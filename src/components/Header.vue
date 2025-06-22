<template>
  <header class="header">
    <nav class="header-nav container">
      
      <div class="header-left">
        <button v-if="isLoggedIn" class="profile-btn" @click="drawerOpen = true">
          <div class="avatar">{{ userInitial }}</div>
          <span class="username">{{ username }}</span>
        </button>
        <button v-else class="hamburger-btn" @click="drawerOpen = true" aria-label="Abrir menú">
          <i class="icon-bars"></i>
        </button>
      </div>

      <router-link to="/" class="logo">
        <span class="renacimiento">Renacimiento</span>
        <span class="maya">Maya</span>
      </router-link>

      <div class="header-right">
        <div v-if="!isLoggedIn" class="logged-out-actions">
          <router-link to="/login" class="btn btn-secondary">Ingresar</router-link>
          <router-link to="/register" class="btn btn-primary">Registrarse</router-link>
        </div>
        <ul v-else class="desktop-nav-links">
          <li><router-link to="/">Inicio</router-link></li>
          </ul>
      </div>
    </nav>

    <AccountDrawer v-model:open="drawerOpen" />
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import AccountDrawer from './Drawer.vue';
import './Header.styles.scss';

const drawerOpen = ref(false);
const isLoggedIn = ref(false);
const username = ref('');

const userInitial = computed(() => (username.value ? username.value.charAt(0).toUpperCase() : '?'));

const updateLoginStatus = () => {
  const token = localStorage.getItem('token');
  isLoggedIn.value = !!token;
  if (isLoggedIn.value) {
    username.value = localStorage.getItem('username') || 'Usuario';
  } else {
    username.value = '';
  }
};

onMounted(() => {
  updateLoginStatus();
  window.addEventListener('login-update', updateLoginStatus);
  window.addEventListener('storage', updateLoginStatus);
});

onBeforeUnmount(() => {
  window.removeEventListener('login-update', updateLoginStatus);
  window.removeEventListener('storage', updateLoginStatus);
});
</script>