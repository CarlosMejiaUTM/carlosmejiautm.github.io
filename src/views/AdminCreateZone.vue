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
            <input v-model="zone.name" type="text" id="name" required placeholder="Ej. Chichén Itzá" />
          </div>

          <div class="form-group">
            <label for="municipality">Municipio</label>
            <input v-model="zone.municipality" type="text" id="municipality" required placeholder="Ej. Tinum" />
          </div>

          <div class="form-group">
            <label for="description">Descripción</label>
            <textarea v-model="zone.description" id="description" rows="5" required placeholder="Describe la zona turística, su historia, atractivos..."></textarea>
          </div>

          <div class="form-group">
            <label for="image">Imágenes de la zona (puedes seleccionar varias)</label>
            <input
              type="file"
              @change="handleImageUpload"
              id="image"
              accept="image/*"
              multiple 
            />
            <div v-if="imagePreviews.length > 0" class="previews-container">
              <div v-for="(src, index) in imagePreviews" :key="index" class="image-preview-item">
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

// El estado ahora maneja un array de archivos
const zone = ref({
  name: '',
  municipality: '',
  description: '',
  imageFiles: [], // Pasa de ser 'imageFile: null' a 'imageFiles: []'
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
const handleImageUpload = (event) => {
  const files = event.target.files;
  if (files) {
    // Guarda la lista de archivos en el estado
    zone.value.imageFiles = Array.from(files);
    
    // Limpia las vistas previas anteriores para evitar fugas de memoria
    imagePreviews.value.forEach(url => URL.revokeObjectURL(url));
    
    // Crea nuevas URLs de vista previa para cada archivo seleccionado
    imagePreviews.value = zone.value.imageFiles.map(file => URL.createObjectURL(file));
    error.value = '';
  }
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
    error.value = err.response?.data?.message || 'Error al registrar la zona.';
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
  imagePreviews.value.forEach(url => URL.revokeObjectURL(url));
  window.removeEventListener('login-update', checkAuth);
});
</script>