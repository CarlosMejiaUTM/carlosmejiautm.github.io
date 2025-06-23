<template>
  <section class="events-page">
    <div class="events-header">
      <h1 class="section-title">Explora Yucatán</h1>
      <p class="subtitle">
        Descubre las joyas turísticas que nuestro estado tiene para ofrecer
      </p>
    </div>

    <div class="filters">
      <div class="search-wrapper">
        <i class="fas fa-search"></i>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por nombre..."
          class="search-input"
        />
      </div>
      <div class="select-wrapper">
        <i class="fas fa-map-marker-alt"></i>
        <select v-model="selectedMunicipality" class="select-filter">
          <option value="">Todos los municipios</option>
          <option
            v-for="municipio in municipios"
            :key="municipio"
            :value="municipio"
          >
            {{ municipio }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="zones-grid">
      <div v-for="i in itemsPerPage" :key="i" class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-info">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
    </div>

    <div v-else-if="paginatedZones.length > 0" class="zones-grid">
      <div v-for="zone in paginatedZones" :key="zone._id" class="zone-card">
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
              <i class="fas fa-map-marker-alt"></i>

              {{ zone.municipality }}
            </p>
            <p class="rating">
              <span v-html="getStars(zone.averageRating)"></span>
              <span class="reviews">({{ zone.numReviews }})</span>
            </p>
          </div>
        </router-link>

        <div
          v-if="isAuthenticated && userRole === 'admin'"
          class="admin-buttons"
        >
          <button class="btn-edit" @click.stop="openEdit(zone)">Editar</button>
          <button class="btn-delete" @click.stop="confirmDelete(zone)">
            Eliminar
          </button>
        </div>
        <button
          v-if="isAuthenticated && userRole === 'user'"
          class="favorite-btn"
          @click.stop="toggleFavorite(zone._id)"
          :disabled="togglingFavoriteId === zone._id"
          :aria-label="
            isFavorite(zone._id) ? 'Quitar de favoritos' : 'Agregar a favoritos'
          "
        >
          <span
            v-if="togglingFavoriteId === zone._id"
            class="spinner small"
          ></span>
          <i
            v-else
            :class="[
              'favorite-icon',
              isFavorite(zone._id) ? 'fas fa-heart active' : 'far fa-heart',
            ]"
          ></i>
        </button>
      </div>
    </div>

    <div v-else class="no-results">
      <p>No se encontraron zonas que coincidan con tu búsqueda.</p>
    </div>

    <nav
      v-if="!isLoading && totalPages > 1"
      class="pagination"
      role="navigation"
      aria-label="Paginación"
    >
      <button
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        ‹
      </button>
      <button
        v-for="page in totalPages"
        :key="page"
        :class="{ active: page === currentPage }"
        @click="changePage(page)"
      >
        {{ page }}
      </button>
      <button
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        ›
      </button>
    </nav>

    <EditZoneModal
      :is-open="editModalOpen"
      :zone-data="editZone"
      @close="closeEdit"
      @save="submitEdit"
      :is-saving="isSaving"
    />
    <ConfirmDeleteModal
      :is-open="deleteConfirmOpen"
      @close="cancelDelete"
      @confirm="deleteZone"
      :is-deleting="isDeleting"
    />
    <Notification :notification="notification" />
  </section>
</template>

<script setup>
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  import api from '../services/api';
  import './Events.styles.scss';

  import EditZoneModal from '../components/EditZoneModal.vue';
  import ConfirmDeleteModal from '../components/ConfirmDeleteModal.vue';
  import Notification from '../components/Notification.vue';

  const router = useRouter();

  // STATE
  const zonas = ref([]);
  const municipios = ref([]);
  const searchTerm = ref('');
  const selectedMunicipality = ref('');
  const currentPage = ref(1);
  const totalPages = ref(1);
  const itemsPerPage = 8;
  const favorites = ref([]);
  const isAuthenticated = ref(false);
  const userRole = ref(null);
  const userId = ref(null);
  const isLoading = ref(true);
  const isSaving = ref(false);
  const isDeleting = ref(false);
  const togglingFavoriteId = ref(null);
  const notification = ref({ visible: false, message: '', type: 'success' });
  const editModalOpen = ref(false);
  const editZone = ref(null);
  const deleteConfirmOpen = ref(false);
  const zoneToDelete = ref(null);

  // COMPUTED
  const paginatedZones = computed(() => zonas.value);

  /**
   * Carga los datos iniciales de la página: la primera página de zonas y la lista completa de municipios.
   */
  const loadInitialData = async () => {
    isLoading.value = true;
    try {
      const [zonesRes, municipiosRes] = await Promise.all([
        api.get('/zones', { params: { page: 1, limit: itemsPerPage } }),
        api.get('/zones/municipalities'),
      ]);

      zonas.value = zonesRes.data.data;
      totalPages.value = zonesRes.data.pages || 1;
      municipios.value = municipiosRes.data.data;

      updateAuthState();
      if (isAuthenticated.value && userRole.value === 'user') {
        await loadFavorites();
      }
    } catch (err) {
      showNotification(
        'Error al cargar la información. Revisa la consola y que el backend esté activo.',
        'error'
      );
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Filtra y carga las zonas según la búsqueda, municipio o página seleccionada.
   */
  const filterAndLoadZones = async () => {
    isLoading.value = true;
    try {
      const params = {
        page: currentPage.value,
        limit: itemsPerPage,
        municipality: selectedMunicipality.value || undefined,
        search: searchTerm.value.trim() || undefined,
      };
      const response = await api.get('/zones', { params });
      zonas.value = response.data.data;
      totalPages.value = response.data.pages || 1;
    } catch (err) {
      showNotification('Error al aplicar los filtros.', 'error');
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Carga las zonas favoritas del usuario logueado.
   */
  const loadFavorites = async () => {
    if (!userId.value) return;
    try {
      const { data } = await api.get(`/users/${userId.value}/favorites`);
      favorites.value = data.data.map((z) => z._id);
    } catch (err) {
      console.error('Error al cargar favoritos:', err);
    }
  };

  /**
   * Envía los datos del formulario de edición al backend.
   */
  const submitEdit = async (formData) => {
    isSaving.value = true;
    try {
      await api.put(`/zones/${editZone.value._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      showNotification('Zona actualizada con éxito.', 'success');
      closeEdit();
      await filterAndLoadZones();
    } catch (err) {
      showNotification('Error al editar la zona.', 'error');
    } finally {
      isSaving.value = false;
    }
  };

  /**
   * Elimina una zona tras confirmación.
   */
  const deleteZone = async () => {
    isDeleting.value = true;
    try {
      await api.delete(`/zones/${zoneToDelete.value._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      showNotification('Zona eliminada correctamente.', 'success');
      cancelDelete();
      if (paginatedZones.value.length === 1 && currentPage.value > 1) {
        currentPage.value--;
      } else {
        await filterAndLoadZones();
      }
    } catch (err) {
      showNotification('Error al eliminar la zona.', 'error');
    } finally {
      isDeleting.value = false;
    }
  };

  /**
   * Añade o quita una zona de los favoritos del usuario.
   */
  const toggleFavorite = async (zoneId) => {
    togglingFavoriteId.value = zoneId;
    try {
      if (isFavorite(zoneId)) {
        await api.delete(`/users/${userId.value}/favorites/${zoneId}`);
        favorites.value = favorites.value.filter((id) => id !== zoneId);
      } else {
        await api.post(`/users/${userId.value}/favorites`, { zonaId: zoneId });
        favorites.value.push(zoneId);
      }
    } catch (err) {
      showNotification('No se pudo actualizar el favorito.', 'error');
    } finally {
      togglingFavoriteId.value = null;
    }
  };

  // WATCHERS
  watch([searchTerm, selectedMunicipality], () => {
    if (currentPage.value !== 1) {
      currentPage.value = 1;
    } else {
      filterAndLoadZones();
    }
  });

  watch(currentPage, (newPage, oldPage) => {
    if (newPage !== oldPage) {
      filterAndLoadZones();
    }
  });

  // HELPERS & UI
  const changePage = (page) => {
    if (page < 1 || page > totalPages.value || isLoading.value) return;
    currentPage.value = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStars = (rating) =>
    '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  const isFavorite = (zoneId) => favorites.value.includes(zoneId);

  const showNotification = (message, type = 'success', duration = 4000) => {
    notification.value = { visible: true, message, type };
    setTimeout(() => {
      notification.value.visible = false;
    }, duration);
  };

  // MODAL HANDLERS
  const openEdit = (zone) => {
    editZone.value = { ...zone };
    editModalOpen.value = true;
  };

  const closeEdit = () => {
    editModalOpen.value = false;
  };

  const confirmDelete = (zone) => {
    zoneToDelete.value = zone;
    deleteConfirmOpen.value = true;
  };

  const cancelDelete = () => {
    deleteConfirmOpen.value = false;
    zoneToDelete.value = null;
  };

  // LIFECYCLE & SESSION
  const updateAuthState = () => {
    isAuthenticated.value = !!localStorage.getItem('token');
    userRole.value = localStorage.getItem('role');
    userId.value = localStorage.getItem('userId');
  };

  const handleLoginUpdate = () => {
    updateAuthState();
    if (isAuthenticated.value && userRole.value === 'user') {
      loadFavorites();
    } else {
      favorites.value = [];
    }
  };

  onMounted(() => {
    loadInitialData();
    window.addEventListener('login-update', handleLoginUpdate);
  });

  onUnmounted(() => {
    window.removeEventListener('login-update', handleLoginUpdate);
  });
</script>
