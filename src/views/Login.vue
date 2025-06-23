<template>
  <div class="login-page">
    <transition name="fade-in" appear>
      <div class="auth-container">
        <div v-if="loginSuccess" class="success-state">
          <div class="success-icon">✔</div>
          <h2>¡Éxito!</h2>
          <p>Iniciando sesión de forma segura...</p>
          <div class="spinner"></div>
        </div>

        <div v-else class="form-wrapper">
          <h2 class="title">
            {{ showForgot ? 'Recuperar Contraseña' : 'Bienvenido de Nuevo' }}
          </h2>
          <p class="subtitle">
            {{
              showForgot
                ? 'Ingresa tu correo para recibir instrucciones.'
                : 'Inicia sesión para continuar.'
            }}
          </p>

          <transition name="form-fade" mode="out-in">
            <form @submit.prevent="login" class="form" v-if="!showForgot">
              <div class="input-group with-icon">
                <label for="username">Nombre de usuario</label>
                <div class="input-icon-wrapper">
                  <i class="fas fa-user"></i>
                  <input
                    id="username"
                    v-model="username"
                    type="text"
                    placeholder="Ingresa el usuario"
                    required
                    autocomplete="username"
                  />
                </div>
              </div>

              <div class="input-group with-icon">
                <label for="password">Contraseña</label>
                <div class="input-icon-wrapper">
                  <i class="fas fa-lock"></i>
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Ingresa la contraseña"
                    required
                    autocomplete="current-password"
                  />
                </div>
                <i
                  class="fas password-toggle"
                  :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"
                  @click="showPassword = !showPassword"
                ></i>
              </div>

              <button type="submit" :disabled="loading" class="btn-primary">
                <span v-if="!loading">Entrar</span>
                <div v-else class="spinner"></div>
              </button>

              <p v-if="error" class="feedback-msg error">{{ error }}</p>

              <p class="toggle-link" @click="showForgot = true">
                ¿Olvidaste tu contraseña?
              </p>
            </form>

            <form @submit.prevent="submitForgot" class="form" v-else>
              <div class="input-group">
                <label for="email">Correo electrónico</label>
                <div class="input-icon-wrapper">
                  <i class="fas fa-envelope"></i>
                  <input
                    id="email"
                    v-model="email"
                    type="email"
                    placeholder="tu@correo.com"
                    required
                    autocomplete="email"
                  />
                </div>
              </div>

              <button type="submit" :disabled="loading" class="btn-primary">
                <span v-if="!loading">Enviar Instrucciones</span>
                <div v-else class="spinner"></div>
              </button>

              <p v-if="forgotMessage" class="feedback-msg success">
                {{ forgotMessage }}
              </p>
              <p v-if="error" class="feedback-msg error">{{ error }}</p>

              <p class="toggle-link" @click="showForgot = false">
                ‹ Volver a Iniciar Sesión
              </p>
            </form>
          </transition>
        </div>

        <p v-if="!loginSuccess" class="register-text">
          ¿Aún no tienes cuenta?
          <router-link to="/register" class="link">Regístrate aquí</router-link>
        </p>
      </div>
    </transition>
  </div>
</template>
<script setup>
  import { ref, onBeforeMount, computed } from 'vue';
  import api from '../services/api';
  import { useRouter } from 'vue-router';
  import './Login.styles.scss';
  import '../styles/global.scss';

  const router = useRouter();

  // State
  const username = ref('');
  const password = ref('');
  const email = ref('');
  const loading = ref(false);
  const error = ref('');
  const forgotMessage = ref('');
  const showForgot = ref(false);
  const loginSuccess = ref(false);
  // Agrega esto con las otras refs
  const showPassword = ref(false);
  // Password visibility state
  const passwordFieldType = ref('password');

  const togglePasswordVisibility = () => {
    passwordFieldType.value =
      passwordFieldType.value === 'password' ? 'text' : 'password';
  };

  const login = async () => {
    error.value = '';
    loading.value = true;
    try {
      const response = await api.post('/auth/login', {
        username: username.value,
        password: password.value,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.user.role);
      localStorage.setItem('username', response.data.user.username);
      if (response.data.user.id) {
        localStorage.setItem('userId', response.data.user.id);
      }

      window.dispatchEvent(new Event('login-update'));

      loginSuccess.value = true; // Activar estado de éxito

      // Esperar 1.5 segundos para mostrar el mensaje de éxito antes de redirigir
      setTimeout(() => {
        const previousRoute = localStorage.getItem('preLoginRoute') || '/';
        localStorage.removeItem('preLoginRoute');
        router.push(previousRoute);
      }, 1500);
    } catch (err) {
      error.value =
        err.response?.data?.message ||
        'Error al iniciar sesión. Verifica tus credenciales.';
    } finally {
      loading.value = false;
    }
  };

  const submitForgot = async () => {
    error.value = '';
    forgotMessage.value = '';
    loading.value = true;
    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.value,
      });
      forgotMessage.value =
        response.data.message ||
        'Si el correo existe, recibirás instrucciones.';
    } catch (err) {
      error.value =
        err.response?.data?.message || 'No se pudo procesar la solicitud.';
    } finally {
      loading.value = false;
    }
  };

  onBeforeMount(() => {
    const from =
      router.currentRoute.value?.query?.redirect ||
      router.options.history.state.back;
    // Solo guardar la ruta si no es una de las rutas de autenticación
    if (from && !['/login', '/register'].includes(from)) {
      localStorage.setItem('preLoginRoute', from);
    }
  });
</script>
