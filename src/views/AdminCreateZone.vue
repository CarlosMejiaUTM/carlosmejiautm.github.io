<template>
  <div class="form-page">
    <transition name="fade-in" appear>
      <section class="admin-section">
        <div class="admin-header">
          <h2 class="title">Agregar Nueva Zona Turística</h2>
          <p class="subtitle">
            Completa el formulario para registrar una nueva zona en el sistema
          </p>
        </div>

        <form class="zone-form" @submit.prevent="submitForm">
          <div class="form-group">
            <label for="name">Nombre de la zona</label>
            <input
              v-model="zone.name"
              type="text"
              id="name"
              required
              placeholder="Ej. Chichén Itzá"
            />
          </div>

          <div class="form-group">
            <label for="municipality">Municipio</label>
            <input
              v-model="zone.municipality"
              type="text"
              id="municipality"
              required
              placeholder="Ej. Tinum"
            />
          </div>

          <div class="form-group">
            <label for="description">Descripción</label>
            <textarea
              v-model="zone.description"
              id="description"
              rows="5"
              required
              placeholder="Describe la zona turística, su historia, atractivos..."
            ></textarea>
          </div>

          <div class="form-group">
            <label for="image"
              >Imágenes de la zona (puedes seleccionar varias)</label
            >
            <input
              type="file"
              @change="handleImageUpload"
              id="image"
              accept="image/*"
              multiple
            />
            <div v-if="imagePreviews.length > 0" class="previews-container">
              <div
                v-for="(src, index) in imagePreviews"
                :key="index"
                class="image-preview-item"
              >
                <img :src="src" :alt="'Vista previa ' + (index + 1)" />
              </div>
            </div>
            <p v-if="imagePreviews.length > 0" class="image-count">
              {{ imagePreviews.length }} imágen(es) seleccionada(s)
            </p>
          </div>

          <p v-if="error" class="feedback-msg error">{{ error }}</p>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            <span v-else>Guardar Zona</span>
          </button>
        </form>
      </section>
    </transition>
    <Notification :notification="notification" />
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useRouter } from 'vue-router';
  import api from '../services/api';
  import './AdminCreateZone.styles.scss';
  import Notification from '../components/Notification.vue';

  const router = useRouter();

  const zone = ref({
    name: '',
    municipality: '',
    description: '',
    imageFiles: [],
  });

  // El estado ahora maneja un array de URLs para las vistas previas
  const imagePreviews = ref([]);
  const isLoading = ref(false);
  const error = ref('');
  const notification = ref({ visible: false, message: '', type: 'success' });

  /**
   * Muestra una notificación temporal en pantalla.
   */
  const showNotification = (message, type = 'success', duration = 3000) => {
    notification.value = { visible: true, message, type };
    setTimeout(() => {
      notification.value.visible = false;
    }, duration);
  };

  /**
   * Verifica si el usuario es un administrador autenticado.
   */
  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
      router.push('/');
    }
  };

  /**
   * Maneja la selección de múltiples archivos y crea sus vistas previas.
   */
  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    imagePreviews.value.forEach((url) => URL.revokeObjectURL(url));

    const resizedFiles = [];
    const previews = [];

    for (const file of files) {
      try {
        const resizedFile = await resizeImageFile(file);
        resizedFiles.push(resizedFile);
        previews.push(URL.createObjectURL(resizedFile));
      } catch (error) {
        console.error('Error al redimensionar imagen:', error);
        error.value = `No se pudo procesar la imagen: ${file.name}`;
      }
    }

    zone.value.imageFiles = resizedFiles;
    imagePreviews.value = previews;
    error.value = '';
  };

  /**
   * Construye el FormData con múltiples imágenes y lo envía a la API.
   */
  const submitForm = async () => {
    error.value = '';
    if (zone.value.imageFiles.length === 0) {
      error.value = 'Por favor, selecciona al menos una imagen.';
      return;
    }

    isLoading.value = true;
    const formData = new FormData();
    formData.append('name', zone.value.name);
    formData.append('municipality', zone.value.municipality);
    formData.append('description', zone.value.description);

    // Recorre el array de archivos y los añade al FormData.
    // El nombre 'images' debe coincidir con upload.array('images') en el backend.
    for (const file of zone.value.imageFiles) {
      formData.append('images', file);
    }

    try {
      await api.post('/zones', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      showNotification('Zona registrada exitosamente.', 'success');

      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      error.value =
        err.response?.data?.message || 'Error al registrar la zona.';
    } finally {
      isLoading.value = false;
    }
  };

  // Hooks de ciclo de vida
  onMounted(() => {
    checkAuth();
    window.addEventListener('login-update', checkAuth);
  });

  onBeforeUnmount(() => {
    // Limpia todas las URLs de previsualización al salir del componente
    imagePreviews.value.forEach((url) => URL.revokeObjectURL(url));
    window.removeEventListener('login-update', checkAuth);
  });

  function resizeImageFile(
    file,
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8
  ) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        let { width, height } = img;

        if (width <= maxWidth && height <= maxHeight) {
          URL.revokeObjectURL(url);
          resolve(file); // no necesita redimensionar
          return;
        }

        const aspectRatio = width / height;
        if (width > height) {
          width = maxWidth;
          height = Math.round(maxWidth / aspectRatio);
        } else {
          height = maxHeight;
          width = Math.round(maxHeight * aspectRatio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            const resizedFile = new File([blob], file.name, { type: mimeType });
            resolve(resizedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo cargar la imagen'));
      };

      img.src = url;
    });
  }
</script>
