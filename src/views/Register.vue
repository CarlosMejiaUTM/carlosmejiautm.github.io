<template>
  <div class="auth-page">
    <transition name="fade-in" appear>
      <div class="auth-container">
        <div v-if="registerSuccess" class="success-state">
          <div class="success-icon">✔</div>
          <h2>¡Registro Exitoso!</h2>
          <p>Serás redirigido para iniciar sesión...</p>
          <div class="spinner"></div>
        </div>

        <div v-else class="form-wrapper">
          <h2 class="title">Crea tu Cuenta</h2>
          <p class="subtitle">Únete y explora las maravillas de Yucatán.</p>

          <form @submit.prevent="register" class="form">
            <div class="input-group">
              <label for="username">Nombre de usuario</label>
              <div class="input-icon-wrapper">
                <i class="fas fa-user"></i>
                <input
                  id="username"
                  v-model="form.username"
                  type="text"
                  placeholder="Elige un nombre de usuario"
                  required
                  autocomplete="username"
                />
              </div>
            </div>

            <div class="input-group">
              <label for="email">Correo electrónico</label>
              <div class="input-icon-wrapper">
                <i class="fas fa-envelope"></i>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="tu@correo.com"
                  required
                  autocomplete="email"
                />
              </div>
            </div>

            <div class="input-group">
              <label for="password">Contraseña</label>
              <div class="input-icon-wrapper">
                <i class="fas fa-lock"></i>
                <input
                  id="password"
                  v-model="form.password"
                  :type="passwordFieldType"
                  placeholder="Crea una contraseña segura"
                  required
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  @click="togglePasswordVisibility"
                  class="password-toggle"
                  aria-label="Mostrar u ocultar contraseña"
                ></button>
              </div>
            </div>

            <div class="input-group">
              <label for="password-confirm">Confirmar Contraseña</label>
              <div class="input-icon-wrapper">
                <i class="fas fa-lock"></i>
                <input
                  id="password-confirm"
                  v-model="form.passwordConfirm"
                  :type="confirmPasswordFieldType"
                  placeholder="Repite la contraseña"
                  required
                  autocomplete="new-password"
                  @blur="validatePasswordsMatch"
                />
                <button
                  type="button"
                  @click="toggleConfirmPasswordVisibility"
                  class="password-toggle"
                  aria-label="Mostrar u ocultar contraseña"
                ></button>
              </div>
            </div>
            <button type="submit" :disabled="loading" class="btn-primary">
              <span v-if="!loading">Crear Cuenta</span>
              <div v-else class="spinner"></div>
            </button>

            <p v-if="error" class="feedback-msg error">{{ error }}</p>
          </form>
        </div>

        <p v-if="!registerSuccess" class="register-text">
          ¿Ya tienes una cuenta?
          <router-link to="/login" class="link">Inicia sesión aquí</router-link>
        </p>
      </div>
    </transition>
  </div>
</template>

<script setup>
  import { ref, reactive } from 'vue';
  import api from '../services/api';
  import { useRouter } from 'vue-router';
  import './Register.styles.scss';

  const router = useRouter();

  // State
  const form = reactive({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const loading = ref(false);
  const error = ref('');
  const registerSuccess = ref(false);

  // Password visibility state
  const passwordFieldType = ref('password');
  const confirmPasswordFieldType = ref('password');

  const togglePasswordVisibility = () => {
    passwordFieldType.value =
      passwordFieldType.value === 'password' ? 'text' : 'password';
  };
  const toggleConfirmPasswordVisibility = () => {
    confirmPasswordFieldType.value =
      confirmPasswordFieldType.value === 'password' ? 'text' : 'password';
  };

  const validatePasswordsMatch = () => {
    if (
      form.password &&
      form.passwordConfirm &&
      form.password !== form.passwordConfirm
    ) {
      error.value = 'Las contraseñas no coinciden.';
    } else {
      error.value = '';
    }
  };

  const register = async () => {
    validatePasswordsMatch();
    if (error.value) return;

    loading.value = true;
    try {
      await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      registerSuccess.value = true;

      // Redirigir a login después de mostrar el mensaje de éxito
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      error.value =
        err.response?.data?.message ||
        'Error al registrar. Inténtalo de nuevo.';
    } finally {
      loading.value = false;
    }
  };
</script>
