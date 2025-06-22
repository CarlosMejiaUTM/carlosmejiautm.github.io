<template>
  <transition name="fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <transition name="scale-up">
        <div class="modal-content" role="dialog" aria-modal="true">
          <h3>Editar Zona Turística</h3>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="name">Nombre</label>
              <input id="name" v-model="formData.name" type="text" required />
            </div>
            <div class="form-group">
              <label for="municipality">Municipio</label>
              <input id="municipality" v-model="formData.municipality" type="text" required />
            </div>
            <div class="form-group">
              <label for="description">Descripción</label>
              <textarea id="description" v-model="formData.description" rows="4" required></textarea>
            </div>
            <div class="form-group">
              <label>Imagen Actual</label>
              <img v-if="imagePreview" :src="imagePreview" alt="Vista previa" class="image-preview" />
            </div>
            <div class="form-group">
              <label for="image">Cambiar imagen (opcional)</label>
              <input id="image" type="file" @change="handleImageChange" accept="image/*" />
            </div>
            <div class="modal-buttons">
              <button type="button" class="btn-cancel" @click="close">Cancelar</button>
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

const formData = ref({ name: '', municipality: '', description: '' });
const imageFile = ref(null);
const imagePreview = ref('');

watch(() => props.zoneData, (newData) => {
  if (newData) {
    formData.value = {
      name: newData.name,
      municipality: newData.municipality,
      description: newData.description,
    };
    imagePreview.value = newData.imageUrl;
    imageFile.value = null;
  }
});

const handleImageChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    imageFile.value = file;
    imagePreview.value = URL.createObjectURL(file);
  }
};

const handleSubmit = () => {
  const data = new FormData();
  data.append('name', formData.value.name);
  data.append('municipality', formData.value.municipality);
  data.append('description', formData.value.description);
  if (imageFile.value) {
    data.append('image', imageFile.value);
  }
  emit('save', data);
};

const close = () => {
  emit('close');
};
</script>

<style scoped>
/* Estilos del modal y formulario */
.modal-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background-color: rgba(0,0,0,0.6);
    display: grid;
    place-items: center;
    z-index: 1000;
}
.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
}
.modal-content h3 {
    margin-top: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #005c46;
    margin-bottom: 1.5rem;
}
.form-group {
    margin-bottom: 1rem;
}
label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
}
input, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
}
.image-preview {
    max-width: 100%;
    height: auto;
    max-height: 200px;
    border-radius: 8px;
    margin-top: 0.5rem;
}
.modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}
.btn-cancel, .btn-save {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-cancel { background-color: #6c757d; color: white; }
.btn-save { background-color: #007b5f; color: white; }
.btn-cancel:hover { background-color: #5a6268; }
.btn-save:hover { background-color: #005c46; }

/* Animaciones */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.scale-up-enter-active, .scale-up-leave-active { transition: all 0.3s ease; }
.scale-up-enter-from, .scale-up-leave-to { transform: scale(0.95); opacity: 0; }
.spinner { /* ... estilos del spinner ... */ }
</style>