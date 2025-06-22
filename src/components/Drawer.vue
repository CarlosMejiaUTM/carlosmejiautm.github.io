<template>
  <div class="drawer-overlay" :class="{ visible: open }" @click.self="emitClose">
    <transition name="slide-from-right">
      <aside v-if="open" class="drawer">
        <header class="drawer-header">
          <div class="user-profile">
            <div class="user-avatar">{{ userInitials }}</div>
            <div class="user-details">
              <h2 class="username">{{ userName || 'Invitado' }}</h2>
              <p class="role">{{ userRoleText }}</p>
            </div>
          </div>
          <button class="close-btn" @click="emitClose" aria-label="Cerrar menú">✕</button>
        </header>

        <nav class="drawer-nav">
          <div class="menu-group">
            <h3 class="menu-title">Navegación</h3>
            <div class="menu-item" @click="goTo('')">
              <i class="icon-home"></i>
              <span class="label">Inicio</span>
              <span class="arrow">›</span>
            </div>
          </div>

          <div v-if="isLoggedIn" class="menu-group">
            <h3 class="menu-title">Mi Cuenta</h3>
            <div v-if="userRole === 'user'" class="menu-item" @click="goTo('saved-zone')">
              <i class="icon-heart"></i>
              <span class="label">Mis Favoritos</span>
              <span class="arrow">›</span>
            </div>
            
            <div v-if="userRole === 'admin'" class="menu-item" @click="goTo('create-zone')">
              <i class="icon-plus-circle"></i>
              <span class="label">Crear Zona</span>
              <span class="arrow">›</span>
            </div>
          </div>
        </nav>

        <footer v-if="isLoggedIn" class="drawer-footer">
          <div class="menu-item logout" @click="openLogoutConfirm">
            <i class="icon-logout"></i>
            <span class="label">Cerrar sesión</span>
          </div>
        </footer>
      </aside>
    </transition>

    <ConfirmDeleteModal
      :is-open="showLogoutModal"
      :is-deleting="false"
      title="Confirmar Cierre de Sesión"
      message="¿Estás seguro de que deseas cerrar la sesión?"
      confirm-text="Sí, cerrar sesión"
      @close="closeLogoutConfirm"
      @confirm="handleLogout"
    />
    <Notification :notification="notification" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
// Asumimos que los estilos y componentes ya están en la ubicación correcta
import './Drawer.styles.scss'; 
import ConfirmDeleteModal from './ConfirmDeleteModal.vue';
import Notification from './Notification.vue';

const props = defineProps({ open: Boolean });
const emit = defineEmits(['update:open']);

const emitClose = () => emit('update:open', false);

const router = useRouter();

// State
const userName = ref('');
const userRole = ref('');
const isLoggedIn = ref(false);
const showLogoutModal = ref(false);
const notification = ref({ visible: false, message: '', type: 'success' });

// Computed properties para el UI
const userInitials = computed(() => (userName.value ? userName.value.charAt(0).toUpperCase() : '?'));
const userRoleText = computed(() => {
  if (!isLoggedIn.value) return 'No has iniciado sesión';
  return userRole.value === 'admin' ? 'Cuenta de Administrador' : 'Cuenta de Usuario';
});

// Lógica de datos de usuario
const updateUserData = () => {
  const token = localStorage.getItem('token');
  isLoggedIn.value = !!token;
  userName.value = localStorage.getItem('username') || '';
  userRole.value = localStorage.getItem('role') || '';
};

// Navegación
const goTo = (route) => {
  emitClose();
  router.push(`/${route}`);
};

// Lógica de Logout
const openLogoutConfirm = () => {
  showLogoutModal.value = true;
};
const closeLogoutConfirm = () => {
  showLogoutModal.value = false;
};
const handleLogout = () => {
  closeLogoutConfirm();
  localStorage.clear();
  window.dispatchEvent(new Event('login-update'));
  
  showNotification('Has cerrado sesión exitosamente.', 'success');

  setTimeout(() => goTo(''), 500);
};

// Lógica de Notificaciones
const showNotification = (message, type = 'success', duration = 3000) => {
  notification.value = { visible: true, message, type };
  setTimeout(() => {
    notification.value.visible = false;
  }, duration);
};

// Lifecycle Hooks
onMounted(() => {
  updateUserData();
  window.addEventListener('login-update', updateUserData);
});

onBeforeUnmount(() => {
  window.removeEventListener('login-update', updateUserData);
});
</script>