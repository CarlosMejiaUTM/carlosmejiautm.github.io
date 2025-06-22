<template>
  <div class="detail-events-page">
    <div v-if="isLoading" class="skeleton-loader">
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-info">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
      <div class="skeleton-reviews">
        <div class="skeleton-line medium title"></div>
        <div class="skeleton-review-item" v-for="i in 2" :key="i"></div>
      </div>
    </div>

    <section class="zona-detalle" v-else-if="zona">
      <div class="zona-card">
        <div class="gallery-container">
          <template v-if="zona.imageUrls && zona.imageUrls.length > 0">
            <div class="main-image">
              <img :src="selectedImage || zona.imageUrls[0]" :alt="zona.name" />
            </div>
            <div v-if="zona.imageUrls.length > 1" class="thumbnails">
              <img
                v-for="(imageUrl, index) in zona.imageUrls"
                :key="index"
                :src="imageUrl"
                :alt="`Imagen ${index + 1} de ${zona.name}`"
                :class="{ active: (selectedImage || zona.imageUrls[0]) === imageUrl }"
                @click="selectedImage = imageUrl"
              />
            </div>
          </template>
           <div v-else class="no-image-placeholder">
            <p>Esta zona no tiene imágenes.</p>
          </div>
        </div>

        <div class="zona-info">
          <h1 class="zona-title">{{ zona.name }}</h1>
          <p class="zona-municipio">
            <i class="icon-location"></i>
            {{ zona.municipality }}
          </p>
          <div class="zona-rating" v-if="zona.numReviews > 0">
            <span class="stars" v-html="getStars(zona.averageRating)"></span>
            <span class="rating-text">
              {{ zona.averageRating.toFixed(1) }}
              <span class="separator">·</span>
              {{ zona.numReviews }} reseñas
            </span>
          </div>
          <p class="zona-description">{{ zona.description }}</p>
        </div>
      </div>

      <div class="zona-reseñas">
        <h2 class="reseñas-title">Opiniones de Visitantes</h2>
        <div v-if="reviews.length > 0" class="reseña-list">
          <div v-for="review in reviews" :key="review._id" class="reseña-item">
            <div class="reseña-header">
              <div class="reseña-user">
                <div class="user-avatar">{{ getInitials(review.user?.username) }}</div>
                <strong>{{ review.user?.username || 'Anónimo' }}</strong>
              </div>
              <div class="reseña-meta">
                <span class="reseña-stars" v-html="getStars(review.rating)"></span>
                <button v-if="userRole === 'admin'" class="btn-eliminar-reseña" @click="confirmarEliminarReseña(review._id)" aria-label="Eliminar reseña" title="Eliminar reseña">
                  <i class="icon-trash"></i>
                </button>
              </div>
            </div>
            <p class="reseña-comentario">“{{ review.comment }}”</p>
            <p class="reseña-fecha">{{ formatDate(review.createdAt) }}</p>
          </div>
        </div>
        <p v-else class="no-reseñas">Sé el primero en dejar una reseña para este lugar.</p>
      </div>

      <div v-if="isAuthenticated && userRole === 'user'" class="reseña-form-wrapper">
        <div class="reseña-form">
          <h3>{{ formTitle }}</h3>
          <form @submit.prevent="submitReview">
            <div class="star-rating">
              <button v-for="star in 5" :key="star" type="button" class="star" :class="{ filled: star <= (hoverRating || form.rating) }" @click="!isReadOnly && (form.rating = star)" @mouseover="!isReadOnly && (hoverRating = star)" @mouseleave="hoverRating = 0" :disabled="isReadOnly" aria-label="Calificación">
                <i class="icon-star"></i>
              </button>
            </div>
            <textarea v-model="form.comment" :readonly="isReadOnly" placeholder="Escribe tu opinión sobre este lugar..." required rows="4"></textarea>
            <div class="botones">
              <button v-if="!userAlreadyReviewed || isEditing" type="submit" class="btn-primary" :disabled="isSubmittingReview || form.rating === 0 || !form.comment.trim()">
                <span v-if="isSubmittingReview" class="spinner"></span>
                <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Enviar Reseña' }}</span>
              </button>
              <button v-if="isEditing" type="button" class="btn-secondary" @click="cancelEdit">Cancelar</button>
              <button v-if="userAlreadyReviewed && !isEditing" type="button" class="btn-primary" @click="startEdit">Editar mi reseña</button>
            </div>
          </form>
        </div>
      </div>
      
      <div v-if="!isAuthenticated" class="zona-cta">
        <p>¿Quieres dejar tu opinión o guardar este lugar?</p>
        <div class="cta-buttons">
          <router-link to="/login" class="btn-accion">Inicia sesión</router-link>
          <router-link to="/register" class="btn-accion outline">Regístrate</router-link>
        </div>
      </div>
    </section>
    
    <ConfirmDeleteModal :is-open="showConfirmDialog" :is-deleting="isDeleting" title="Confirmar Eliminación" message="¿Estás seguro? Esta acción es permanente." confirm-text="Sí, eliminar" variant="danger" @close="cancelarEliminarReseña" @confirm="eliminarReseña"/>
    <Notification :notification="notification" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';
import './DetailEvents.styles.scss';

import ConfirmDeleteModal from '../components/ConfirmDeleteModal.vue';
import Notification from '../components/Notification.vue';

const route = useRoute();
const router = useRouter();

const zona = ref(null);
const reviews = ref([]);
const form = ref({ rating: 0, comment: '' });
const editingReview = ref(null);
const hoverRating = ref(0);
const isAuthenticated = ref(false);
const userRole = ref('');
const userId = ref('');
const isEditing = ref(false);
const userAlreadyReviewed = ref(false);
const isLoading = ref(true);
const isSubmittingReview = ref(false);
const isDeleting = ref(false);
const showConfirmDialog = ref(false);
const reseñaAEliminar = ref(null);
const notification = ref({ visible: false, message: '', type: 'success' });
const selectedImage = ref('');

const isReadOnly = computed(() => userAlreadyReviewed.value && !isEditing.value);
const formTitle = computed(() => {
  if (isEditing.value) return 'Editar tu reseña';
  if (userAlreadyReviewed.value) return 'Gracias por tu opinión';
  return 'Deja tu reseña';
});

const getStars = (rating) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
const getInitials = (name) => (name ? name.match(/\b\w/g)?.join('').slice(0, 2).toUpperCase() || 'A' : 'A');
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
const showNotification = (message, type = 'success', duration = 3000) => {
  notification.value = { visible: true, message, type };
  setTimeout(() => { notification.value.visible = false; }, duration);
};

const loadZone = async () => {
  isLoading.value = true;
  selectedImage.value = '';
  try {
    const { data } = await api.get(`/zones/${route.params.id}`);
    zona.value = data.data;
    reviews.value = data.data.reviews?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) || [];
    checkUserReviewStatus();
  } catch (err) {
    console.error('Error al cargar la zona:', err);
    showNotification('No se pudo cargar la información del lugar.', 'error');
  } finally {
    isLoading.value = false;
  }
};

const checkUserReviewStatus = () => {
  if (isAuthenticated.value && userRole.value === 'user') {
    const userReview = reviews.value.find(r => String(r.user?._id) === String(userId.value));
    if (userReview) {
      editingReview.value = { ...userReview };
      form.value = { rating: userReview.rating, comment: userReview.comment };
      userAlreadyReviewed.value = true;
      isEditing.value = false;
    } else {
      resetForm();
    }
  } else {
    resetForm();
  }
};

const resetForm = () => {
  form.value = { rating: 0, comment: '' };
  editingReview.value = null;
  userAlreadyReviewed.value = false;
  isEditing.value = false;
};

const submitReview = async () => {
  if (isSubmittingReview.value) return;
  isSubmittingReview.value = true;
  try {
    const zoneId = route.params.id;
    if (isEditing.value && editingReview.value) {
      await api.put(`/reviews/${editingReview.value._id}`, form.value);
      showNotification('Reseña actualizada con éxito.', 'success');
    } else {
      await api.post(`/zones/${zoneId}/reviews`, form.value);
      showNotification('¡Gracias por tu reseña!', 'success');
    }
    await loadZone();
  } catch (err) {
    showNotification(err.response?.data?.message || 'Error al enviar la reseña.', 'error');
  } finally {
    isSubmittingReview.value = false;
    isEditing.value = false;
  }
};

const eliminarReseña = async () => {
  if (!reseñaAEliminar.value || isDeleting.value) return;
  isDeleting.value = true;
  try {
    await api.delete(`/reviews/${reseñaAEliminar.value}`);
    showNotification('Reseña eliminada correctamente.', 'success');
  } catch (err) {
    showNotification(err.response?.data?.message || 'Error al eliminar la reseña.', 'error');
  } finally {
    isDeleting.value = false;
    cancelarEliminarReseña();
    await loadZone();
  }
};

const startEdit = () => { isEditing.value = true; };
const cancelEdit = () => {
  form.value.rating = editingReview.value.rating;
  form.value.comment = editingReview.value.comment;
  isEditing.value = false;
};
const confirmarEliminarReseña = (reviewId) => {
  reseñaAEliminar.value = reviewId;
  showConfirmDialog.value = true;
};
const cancelarEliminarReseña = () => {
  showConfirmDialog.value = false;
  reseñaAEliminar.value = null;
};

const updateUserSession = () => {
  isAuthenticated.value = !!localStorage.getItem('token');
  userRole.value = localStorage.getItem('role') || '';
  userId.value = localStorage.getItem('userId') || '';
};

const onLoginUpdate = () => {
  updateUserSession();
  loadZone();
};

onMounted(() => {
  updateUserSession();
  loadZone();
  window.addEventListener('login-update', onLoginUpdate);
});

onBeforeUnmount(() => {
  window.removeEventListener('login-update', onLoginUpdate);
});
</script>