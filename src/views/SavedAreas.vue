<template>
  <div class="saved-areas-page">
    <div class="container">
      <h1 class="title">Mis Zonas Favoritas</h1>
      <p class="subtitle">
        Los lugares que has guardado para tu próxima aventura.
      </p>

      <div v-if="loading" class="favorites-grid">
        <div v-for="i in 4" :key="i" class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-info">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line"></div>
          </div>
        </div>
      </div>

      <div v-else-if="favorites.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="icon-heart-crack"></i>
        </div>
        <h2>Aún no tienes favoritos</h2>
        <p>
          Parece que no has guardado ninguna zona. ¡Empieza a explorar para
          encontrar tus lugares preferidos!
        </p>
        <router-link to="/" class="btn-explore">Explorar Zonas</router-link>
      </div>

      <div v-else class="favorites-grid">
        <div v-for="zone in favorites" :key="zone._id" class="zone-card">
          <router-link
            :to="{ name: 'DetailEvents', params: { id: zone._id } }"
            class="card-link-wrapper"
          >
            <img
              v-if="zone.imageUrls && zone.imageUrls.length > 0"
              :src="zone.imageUrls[0]"
              :alt="`Imagen de ${zone.name}`"
              class="zone-image"
            />
            <div class="zone-info">
              <h3>{{ zone.name }}</h3>
              <p class="municipality">
                <i class="fas fa-map-marker-alt"></i> {{ zone.municipality }}
              </p>
              <p class="rating">
                <span v-html="getStars(zone.averageRating)"></span>
                <span class="reviews">({{ zone.numReviews }})</span>
              </p>
            </div>
          </router-link>
          <button class="btn-remove" @click.prevent="openConfirmDelete(zone)">
            <i class="fas fa-trash"></i> Quitar de favoritos
          </button>
        </div>
      </div>
    </div>

    <ConfirmDeleteModal
      :is-open="showConfirmModal"
      :is-deleting="isDeleting"
      @close="closeConfirmDelete"
      @confirm="handleRemoveFavorite"
    />
    <Notification :notification="notification" />
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useRouter } from 'vue-router';
  import api from '../services/api';
  import './SavedAreas.styles.scss';

  // Importando componentes reutilizables
  import ConfirmDeleteModal from '../components/ConfirmDeleteModal.vue';
  import Notification from '../components/Notification.vue';

  const router = useRouter();

  // State
  const favorites = ref([]);
  const loading = ref(true);
  const isDeleting = ref(false);
  const showConfirmModal = ref(false);
  const zoneToRemove = ref(null);
  const notification = ref({ visible: false, message: '', type: 'success' });

  // HELPERS
  const getStars = (rating) =>
    '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  const showNotification = (message, type = 'success', duration = 4000) => {
    notification.value = { visible: true, message, type };
    setTimeout(() => {
      notification.value.visible = false;
    }, duration);
  };

  // AUTH & DATA FETCHING
  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'user') {
      router.push('/login');
      return false;
    }
    return true;
  };

  const fetchFavorites = async () => {
    if (!checkAuth()) return;
    loading.value = true;
    try {
      const userId = localStorage.getItem('userId');
      const { data } = await api.get(`/users/${userId}/favorites`);
      favorites.value = data.data || [];
    } catch (err) {
      console.error('Error al obtener favoritos:', err);
      showNotification(
        'Error al cargar tus zonas favoritas. Intenta recargar la página.',
        'error'
      );
    } finally {
      loading.value = false;
    }
  };

  // USER ACTIONS
  const openConfirmDelete = (zone) => {
    zoneToRemove.value = zone;
    showConfirmModal.value = true;
  };

  const closeConfirmDelete = () => {
    showConfirmModal.value = false;
    zoneToRemove.value = null;
  };

  const handleRemoveFavorite = async () => {
    if (!zoneToRemove.value) return;

    isDeleting.value = true;
    const zoneId = zoneToRemove.value._id;
    const userId = localStorage.getItem('userId');

    try {
      await api.delete(`/users/${userId}/favorites/${zoneId}`);
      favorites.value = favorites.value.filter((z) => z._id !== zoneId);
      showNotification(
        `'${zoneToRemove.value.name}' eliminado de tus favoritos.`,
        'success'
      );
    } catch (err) {
      console.error('Error al eliminar favorito:', err);
      showNotification(
        'No se pudo eliminar el favorito. Inténtalo de nuevo.',
        'error'
      );
    } finally {
      isDeleting.value = false;
      closeConfirmDelete();
    }
  };

  const goToDetail = (id) => {
    router.push({ name: 'DetailEvents', params: { id } });
  };

  // LIFECYCLE
  onMounted(() => {
    fetchFavorites();
    window.addEventListener('login-update', fetchFavorites);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('login-update', fetchFavorites);
  });
</script>
