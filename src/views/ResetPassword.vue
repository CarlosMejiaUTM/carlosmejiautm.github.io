<template>
  <div class="auth-page">
    <transition name="fade-in" appear>
      <div class="auth-container">

        <div v-if="success" class="success-state">
          <div class="success-icon">✔</div>
          <h2>Contraseña Actualizada</h2>
          <p>Tu contraseña ha sido restablecida. Serás redirigido al inicio de sesión...</p>
          <div class="spinner"></div>
        </div>

        <div v-else class="form-wrapper">
          <h2 class="title">Nueva Contraseña</h2>
          <p class="subtitle">Ingresa y confirma tu nueva contraseña segura.</p>

          <form @submit.prevent="submitReset" class="form">
            <div class="input-group">
              <label for="password">Nueva contraseña</label>
              <i class="input-icon icon-lock"></i>
              <input id="password" v-model="password" :type="passwordFieldType" placeholder="Escribe tu nueva contraseña" required autocomplete="new-password" />
              <button type="button" @click="togglePasswordVisibility" class="password-toggle" aria-label="Mostrar u ocultar contraseña">
                <i :class="passwordFieldType === 'password' ? 'icon-eye-off' : 'icon-eye'"></i>
              </button>
            </div>

            <div class="input-group">
              <label for="confirm">Confirmar contraseña</label>
              <i class="input-icon icon-lock"></i>
              <input id="confirm" v-model="confirm" :type="confirmPasswordFieldType" placeholder="Confirma la contraseña" required autocomplete="new-password" @blur="validatePasswordsMatch" />
              <button type="button" @click="toggleConfirmPasswordVisibility" class="password-toggle" aria-label="Mostrar u ocultar contraseña">
                <i :class="confirmPasswordFieldType === 'password' ? 'icon-eye-off' : 'icon-eye'"></i>
              </button>
            </div>

            <button type="submit" class="btn-primary" :disabled="loading">
              <span v-if="!loading">Guardar Contraseña</span>
              <div v-else class="spinner"></div>
            </button>

            <p v-if="error" class="feedback-msg error">{{ error }}</p>
          </form>
        </div>

      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';
import './ResetPassword.styles.scss';

const route = useRoute();
const router = useRouter();
const token = route.params.token;

const password = ref('');
const confirm = ref('');
const error = ref('');
const loading = ref(false);
const success = ref(false);

const passwordFieldType = ref('password');
const confirmPasswordFieldType = ref('password');

const togglePasswordVisibility = () => {
  passwordFieldType.value = passwordFieldType.value === 'password' ? 'text' : 'password';
};
const toggleConfirmPasswordVisibility = () => {
  confirmPasswordFieldType.value = confirmPasswordFieldType.value === 'password' ? 'text' : 'password';
};

const validatePasswordsMatch = () => {
  if (password.value && confirm.value && password.value !== confirm.value) {
    error.value = 'Las contraseñas no coinciden.';
  } else {
    error.value = '';
  }
};

const submitReset = async () => {
  validatePasswordsMatch();
  if (error.value) return;

  loading.value = true;
  try {
    await api.post(`/auth/reset-password/${token}`, {
      password: password.value,
    });
    
    success.value = true;
    error.value = '';

    setTimeout(() => {
      router.push('/login');
    }, 2500);

  } catch (err) {
    error.value = err.response?.data?.message || 'El enlace puede haber expirado. Intenta de nuevo.';
  } finally {
    loading.value = false;
  }
};
</script>