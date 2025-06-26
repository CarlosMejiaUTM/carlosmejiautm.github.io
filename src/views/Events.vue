<template>
  <!-- Carrusel superior -->
  <div class="main-carousel">
    <div
      v-for="(zone, index) in zonesWithImages"
      :key="zone._id"
      class="carousel-slide"
      :class="{ active: index === currentIndex }"
    >
      <img
        v-if="zone.imageUrls?.length"
        :src="zone.imageUrls[0]"
        class="carousel-image"
        :alt="`Imagen principal de ${zone.name}`"
      />
      <div class="carousel-overlay-text">
        Zonas turísticas de Yucatán que no te puedes perder
      </div>
    </div>
  </div>

  <!-- Página principal -->
  <section class="events-page">
    <div class="events-header">
      <h1 class="section-title">Explora Yucatán</h1>
      <p class="subtitle">
        Descubre las joyas turísticas que nuestro estado tiene para ofrecer
      </p>
    </div>

    <div class="filters-layout">
      <!-- Filtros -->
      <aside class="filters-sidebar">
        <div class="filters-header">
          <h2>Filtros</h2>
          <button class="clear-filters" @click="clearAllFilters">
            Borrar todo
          </button>
        </div>
        <hr class="footer-separator" />

        <!-- Mejores Reseñas -->
        <div class="filter-group">
          <h2
            class="filter-title"
            @click="showBestRatedFilter = !showBestRatedFilter"
          >
            Mejores Reseñas
            <span class="toggle-icon">{{
              showBestRatedFilter ? '▾' : '▸'
            }}</span>
          </h2>
          <div v-if="showBestRatedFilter" class="filter-content">
            <label class="rating-checkbox-label">
              <input type="checkbox" v-model="bestRated" />
              <span>Mejores calificados</span>
            </label>
          </div>
        </div>
        <hr class="footer-separator" />

        <!-- Municipios -->
        <div class="filter-group">
          <h2
            class="filter-title"
            @click="showMunicipiosFilter = !showMunicipiosFilter"
          >
            Municipios
            <span class="toggle-icon">{{
              showMunicipiosFilter ? '▾' : '▸'
            }}</span>
          </h2>
          <div
            v-if="showMunicipiosFilter"
            class="filter-content municipality-options"
          >
            <label
              v-for="municipio in municipios"
              :key="municipio"
              class="municipio-label"
              :title="municipio"
            >
              <input
                type="checkbox"
                :value="municipio"
                v-model="selectedMunicipalities"
              />
              <span class="municipio-nombre">{{ municipio }}</span>
              <span class="municipio-cantidad">
                ({{ zonesCountByMunicipality[municipio] || 0 }} zonas)
              </span>
            </label>
          </div>
        </div>
      </aside>

      <div class="zones-content">
        <div class="search-bar">
          <i class="fas fa-search search-icon"></i>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar una zona turística..."
            class="search-input"
          />
        </div>

        <!-- Skeleton mientras carga -->
        <div v-if="isLoading" class="zones-grid">
          <div v-for="i in itemsPerPage" :key="i" class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-info">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line"></div>
            </div>
          </div>
        </div>

        <!-- Resultados -->
        <div v-else-if="paginatedZones.length > 0" class="zones-grid">
          <div v-for="zone in paginatedZones" :key="zone._id" class="zone-card">
            <router-link
              :to="{ name: 'DetailEvents', params: { id: zone._id } }"
              class="card-link-wrapper"
            >
              <img
                v-if="zone.imageUrls?.length"
                :src="zone.imageUrls[0]"
                class="zone-image"
                :alt="`Imagen de ${zone.name}`"
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

            <!-- Admin -->
            <div
              v-if="isAuthenticated && userRole === 'admin'"
              class="admin-buttons"
            >
              <button class="btn-edit" @click.stop="openEdit(zone)">
                Editar
              </button>
              <button class="btn-delete" @click.stop="confirmDelete(zone)">
                Eliminar
              </button>
            </div>

            <!-- Compartir y Favorito -->
            <div
              class="action-buttons"
              v-if="isAuthenticated && userRole === 'user'"
            >
              <button
                class="share-btn"
                @click.stop="openShareModal(zone)"
                aria-label="Compartir zona"
              >
                <i class="fas fa-link"></i>
              </button>
              <button
                class="favorite-btn"
                @click.stop="toggleFavorite(zone._id)"
                :disabled="togglingFavoriteId === zone._id"
                :aria-label="
                  isFavorite(zone._id)
                    ? 'Quitar de favoritos'
                    : 'Agregar a favoritos'
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
                    isFavorite(zone._id)
                      ? 'fas fa-heart active'
                      : 'far fa-heart',
                  ]"
                ></i>
              </button>
            </div>
          </div>
        </div>

        <!-- No resultados -->
        <div v-else class="no-results">
          <p>No se encontraron zonas que coincidan con tu búsqueda.</p>
        </div>

        <!-- Paginación -->
        <nav
          v-if="!isLoading && totalPages > 1"
          class="pagination"
          role="navigation"
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
      </div>
    </div>

    <!-- Modales -->
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
  <!-- Modal de compartir -->
  <div
    v-if="shareModalOpen"
    class="share-modal-overlay"
    @click.self="closeShareModal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="shareModalTitle"
  >
    <div class="share-modal-card">
      <h3 id="shareModalTitle">Compartir zona turística</h3>
      <p class="share-url">{{ shareUrl }}</p>

      <button class="copy-link-btn" @click="copyLink">
        <i class="fas fa-copy"></i> Copiar enlace
      </button>

      <div class="share-options">
        <a
          :href="facebookShareUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="share-option facebook"
          aria-label="Compartir en Facebook"
        >
          <i class="fab fa-facebook-f"></i>
        </a>

        <a
          :href="twitterShareUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="share-option twitter"
          aria-label="Compartir en Twitter"
        >
          <i class="fab fa-twitter"></i>
        </a>

        <a
          :href="gmailShareUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="share-option gmail"
          aria-label="Compartir por Gmail"
        >
          <i class="fas fa-envelope"></i>
        </a>

        <button
          class="share-option close-btn"
          @click="closeShareModal"
          aria-label="Cerrar modal"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div v-if="copySuccess" class="copy-success-msg" role="alert">
        ¡Enlace copiado!
      </div>
    </div>
  </div>
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
  const currentIndex = ref(0);

  let intervalId = null;

  const zonas = ref([]);
  const municipios = ref([]);
  const searchTerm = ref('');
  const selectedMunicipalities = ref([]);
  const bestRated = ref(false);
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
  const allZones = ref([]);
  const showBestRatedFilter = ref(true);
  const showMunicipiosFilter = ref(true);
  const paginatedZones = computed(() => zonas.value);
  const shareModalOpen = ref(false);
  const shareZoneId = ref(null);
  const copySuccess = ref(false);

  const zonesWithImages = computed(() => {
    return paginatedZones.value.filter(
      (zone) => zone.imageUrls && zone.imageUrls.length > 0
    );
  });

  function nextImage() {
    if (zonesWithImages.value.length === 0) return;
    currentIndex.value =
      (currentIndex.value + 1) % zonesWithImages.value.length;
  }

  onMounted(() => {
    intervalId = setInterval(nextImage, 5000);
  });

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  /* ----------------------------------------
  FUNCIONES PRINCIPALES
---------------------------------------- */

  const loadInitialData = async () => {
    isLoading.value = true;
    try {
      const [zonesRes, municipiosRes, allZonesRes] = await Promise.all([
        api.get('/zones', { params: { page: 1, limit: itemsPerPage } }),
        api.get('/zones/municipalities'),
        api.get('/zones', { params: { page: 1, limit: 1000 } }),
      ]);

      zonas.value = zonesRes.data.data;
      totalPages.value = zonesRes.data.pages || 1;
      municipios.value = municipiosRes.data.data;

      allZones.value = allZonesRes.data.data;

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

  const filterAndLoadZones = () => {
    let filtered = allZones.value;

    if (searchTerm.value.trim()) {
      const term = searchTerm.value.trim().toLowerCase();
      filtered = filtered.filter((zone) =>
        zone.name.toLowerCase().includes(term)
      );
    }

    if (bestRated.value) {
      filtered = filtered.filter((zone) => zone.averageRating >= 4.0);
    }

    if (selectedMunicipalities.value.length > 0) {
      filtered = filtered.filter((zone) =>
        selectedMunicipalities.value.includes(zone.municipality)
      );
    }

    totalPages.value = Math.ceil(filtered.length / itemsPerPage);
    zonas.value = filtered.slice(
      (currentPage.value - 1) * itemsPerPage,
      currentPage.value * itemsPerPage
    );
  };

  const loadFavorites = async () => {
    if (!userId.value) return;
    try {
      const { data } = await api.get(`/users/${userId.value}/favorites`);
      favorites.value = data.data.map((z) => z._id);
    } catch (err) {
      console.error('Error al cargar favoritos:', err);
    }
  };

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
      currentPage.value = 1;
      const updatedZones = await api.get('/zones', {
        params: { page: 1, limit: 1000 },
      });
      allZones.value = updatedZones.data.data;
      await filterAndLoadZones();
    } catch (err) {
      showNotification('Error al editar la zona.', 'error');
    } finally {
      isSaving.value = false;
    }
  };

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
      const updatedZones = await api.get('/zones', {
        params: { page: 1, limit: 1000 },
      });
      allZones.value = updatedZones.data.data;

      if (paginatedZones.value.length === 1 && currentPage.value > 1) {
        currentPage.value--;
      }
      await filterAndLoadZones();
    } catch (err) {
      showNotification('Error al eliminar la zona.', 'error');
    } finally {
      isDeleting.value = false;
    }
  };

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

  /* ----------------------------------------
  WATCHERS
---------------------------------------- */
  watch([searchTerm, bestRated, selectedMunicipalities], () => {
    currentPage.value = 1;
    filterAndLoadZones();
  });

  watch(currentPage, () => {
    filterAndLoadZones();
  });

  /* ----------------------------------------
  UI / Helpers
---------------------------------------- */
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

  const clearAllFilters = () => {
    searchTerm.value = '';
    selectedMunicipalities.value = [];
    bestRated.value = false;
    currentPage.value = 1;
    filterAndLoadZones();
  };

  /* ----------------------------------------
  MODAL HANDLERS
---------------------------------------- */
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

  /* ----------------------------------------
  AUTH
---------------------------------------- */
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

  const zonesCountByMunicipality = computed(() => {
    const counts = {};
    for (const zone of allZones.value) {
      if (zone.municipality) {
        counts[zone.municipality] = (counts[zone.municipality] || 0) + 1;
      }
    }
    return counts;
  });

  const shareUrl = computed(() => {
    if (!shareZoneId.value) return '';
    return `https://carlosmejiautm.github.io/details/${shareZoneId.value}`;
  });

  const facebookShareUrl = computed(() => {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl.value)}`;
  });

  const twitterShareUrl = computed(() => {
    const text = encodeURIComponent('¡Mira esta zona turística en Yucatán!');
    return `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl.value)}&text=${text}`;
  });

  const gmailShareUrl = computed(() => {
    const subject = encodeURIComponent('Zona turística en Yucatán');
    const body = encodeURIComponent(
      `Mira esta zona turística: ${shareUrl.value}`
    );
    return `mailto:?subject=${subject}&body=${body}`;
  });
  function openShareModal(zone) {
    shareZoneId.value = zone._id;
    copySuccess.value = false;
    shareModalOpen.value = true;
  }

  function closeShareModal() {
    shareModalOpen.value = false;
    shareZoneId.value = null;
    copySuccess.value = false;
  }

  function copyLink() {
    navigator.clipboard
      .writeText(shareUrl.value)
      .then(() => {
        copySuccess.value = true;
        setTimeout(() => (copySuccess.value = false), 2000);
      })
      .catch(() => {
        alert('No se pudo copiar el enlace. Por favor, cópialo manualmente.');
      });
  }
</script>
