<template>
  <transition name="fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <transition name="scale-up">
        <div
          class="modal-content"
          role="dialog"
          aria-modal="true"
          v-if="isOpen"
        >
          <h3>Editar Zona Turística</h3>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="name">Nombre</label>
              <input
                id="name"
                v-model="editableZone.name"
                type="text"
                required
              />
            </div>
            <div class="form-group">
              <label for="municipality">Municipio</label>
              <input
                id="municipality"
                v-model="editableZone.municipality"
                type="text"
                required
              />
            </div>
            <div class="form-group">
              <label for="description">Descripción</label>
              <textarea
                id="description"
                v-model="editableZone.description"
                rows="4"
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label>Imágenes Actuales</label>
              <p class="small-text">
                Haz clic en una imagen para marcarla y eliminarla.
              </p>
              <div class="previews-container existing">
                <div
                  v-for="(url, index) in editableZone.imageUrls"
                  :key="index"
                  class="image-preview-item"
                  @click="toggleImageForDeletion(url)"
                  :class="{
                    'marked-for-deletion': imagesToDelete.includes(url),
                  }"
                >
                  <img :src="url" :alt="'Imagen existente ' + (index + 1)" />
                  <div class="delete-overlay"><span>ELIMINAR</span></div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="new-images">Añadir nuevas imágenes (opcional)</label>
              <input
                id="new-images"
                type="file"
                @change="handleImageChange"
                accept="image/*"
                multiple
              />
            </div>
            <div v-if="newImagePreviews.length > 0" class="previews-container">
              <div
                v-for="(src, index) in newImagePreviews"
                :key="index"
                class="image-preview-item"
              >
                <img :src="src" :alt="'Nueva imagen ' + (index + 1)" />
              </div>
            </div>

            <div class="modal-buttons">
              <button
                type="button"
                class="btn-cancel"
                @click="close"
                :disabled="isSaving"
              >
                Cancelar
              </button>
              <button type="submit" class="btn-save" :disabled="isSaving">
                <span v-if="isSaving" class="spinner"></span>
                <span v-else>Guardar Cambios</span>
              </button>
            </div>
          </form>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
  import { ref, watch } from 'vue';

  const props = defineProps({
    isOpen: Boolean,
    zoneData: Object,
    isSaving: Boolean,
  });

  const emit = defineEmits(['close', 'save']);

  const editableZone = ref({
    name: '',
    municipality: '',
    description: '',
    imageUrls: [],
  });
  const newImageFiles = ref([]);
  const newImagePreviews = ref([]);
  const imagesToDelete = ref([]);

  watch(
    () => props.zoneData,
    (newData) => {
      if (newData) {
        editableZone.value = JSON.parse(JSON.stringify(newData));
        newImageFiles.value = [];
        newImagePreviews.value.forEach((url) => URL.revokeObjectURL(url));
        newImagePreviews.value = [];
        imagesToDelete.value = [];
      }
    },
    { deep: true }
  );

  const getBase64 = (fileOrUrl) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      if (typeof fileOrUrl === 'string') {
        fetch(fileOrUrl)
          .then((res) => res.blob())
          .then((blob) => {
            reader.readAsDataURL(blob);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
          });
      } else {
        reader.readAsDataURL(fileOrUrl);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      }
    });
  };

  const handleImageChange = async (event) => {
    const files = Array.from(event.target.files);
    const newFiles = [];
    const previews = [];

    const existingHashes = await Promise.all(
      editableZone.value.imageUrls.map((url) => getBase64(url))
    );

    for (const file of files) {
      const base64 = await getBase64(file);

      const isDuplicateInBackend = existingHashes.includes(base64);
      const isDuplicateInSession = newImagePreviews.value.includes(base64);

      if (isDuplicateInBackend) {
        alert(`⚠️ La imagen "${file.name}" ya existe en la zona.`);
      } else if (isDuplicateInSession) {
        alert(`⚠️ Ya seleccionaste "${file.name}" anteriormente.`);
      } else {
        newFiles.push(file);
        previews.push(base64);
      }
    }

    newImageFiles.value = newFiles;
    newImagePreviews.value = previews;
  };

  const toggleImageForDeletion = (url) => {
    const index = imagesToDelete.value.indexOf(url);
    if (index > -1) {
      imagesToDelete.value.splice(index, 1);
    } else {
      imagesToDelete.value.push(url);
    }
  };

  const handleSubmit = () => {
    const data = new FormData();
    data.append('name', editableZone.value.name);
    data.append('municipality', editableZone.value.municipality);
    data.append('description', editableZone.value.description);

    for (const file of newImageFiles.value) {
      data.append('images', file);
    }

    if (imagesToDelete.value.length > 0) {
      data.append('deletedImages', JSON.stringify(imagesToDelete.value));
    }

    emit('save', data);
  };

  const close = () => {
    emit('close');
  };
</script>

<style scoped>
  /* Estilos para el modal, incluido el efecto de eliminación */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: grid;
    place-items: center;
    z-index: 1000;
  }
  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 550px;
    max-height: 90vh;
    overflow-y: auto;
    font-family: 'Poppins', sans-serif;
  }
  .modal-content h3 {
    margin-top: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #005c46;
    margin-bottom: 1.5rem;
  }
  .form-group {
    margin-bottom: 1.25rem;
  }
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
  }
  input,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
  }
  .previews-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1rem;
    margin-top: 0.5rem;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
  }
  .image-preview-item {
    position: relative;
    width: 100%;
    padding-top: 100%;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
  }
  .image-preview-item img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  .image-preview-item:hover img {
    transform: scale(1.05);
  }
  .small-text {
    font-size: 0.8rem;
    color: #6c757d;
    margin-top: -0.75rem;
    margin-bottom: 0.5rem;
  }
  .delete-overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(220, 53, 69, 0.7);
    color: white;
    display: grid;
    place-items: center;
    font-weight: bold;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  .image-preview-item.marked-for-deletion .delete-overlay {
    opacity: 1;
  }
  .modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }
  .btn-cancel,
  .btn-save {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .btn-cancel {
    background-color: #6c757d;
    color: white;
  }
  .btn-save {
    background-color: #007b5f;
    color: white;
  }
  .spinner {
    /* ... */
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  .scale-up-enter-active,
  .scale-up-leave-active {
    transition: all 0.3s ease;
  }
  .scale-up-enter-from,
  .scale-up-leave-to {
    transform: scale(0.95);
    opacity: 0;
  }
</style>
