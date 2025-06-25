<template>
  <transition name="fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <transition name="scale-up">
        <div class="modal-content" role="dialog" v-if="isOpen">
          <h3 :class="variant">{{ title }}</h3>
          <p>{{ message }}</p>
          <div class="modal-buttons">
            <button
              class="btn-cancel"
              @click="$emit('close')"
              :disabled="isDeleting"
            >
              Cancelar
            </button>
            <button
              class="btn-confirm"
              :class="variant"
              @click="$emit('confirm')"
              :disabled="isDeleting"
            >
              <span v-if="isDeleting" class="spinner"></span>
              <span v-else>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
  defineProps({
    isOpen: Boolean,
    isDeleting: Boolean, // Se puede usar como un "isLoading" genérico
    // Props para hacer el modal 100% reutilizable
    title: {
      type: String,
      default: 'Confirmar Acción',
    },
    message: {
      type: String,
      default: '¿Estás seguro de que deseas continuar?',
    },
    confirmText: {
      type: String,
      default: 'Sí, confirmar',
    },
    variant: {
      type: String,
      default: 'primary', // puede ser 'primary' o 'danger'
    },
  });
  defineEmits(['close', 'confirm']);
</script>

<style scoped>
  /* Estilos del modal y formulario */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: grid;
    place-items: center;
    z-index: 1000;
  }
  .modal-content {
    text-align: center;
    background: white;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    font-family: 'Poppins', sans-serif;
  }

  /* El color del título cambia según la variante */
  h3 {
    margin-top: 0;
  }
  h3.danger {
    color: #e63946;
  }
  h3.primary {
    color: var(--primary-dark);
  }

  p {
    color: #6c757d;
    margin-bottom: 2rem;
    line-height: 1.5;
  }
  .modal-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  .btn-cancel,
  .btn-confirm {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn-cancel {
    background-color: #6c757d;
    color: white;
  }
  .btn-cancel:hover:not(:disabled) {
    background-color: #5a6268;
  }

  /* El color del botón de confirmación cambia según la variante */
  .btn-confirm.danger {
    background-color: #e63946;
    color: white;
  }
  .btn-confirm.danger:hover:not(:disabled) {
    background-color: #c5283f;
  }
  .btn-confirm.primary {
    background-color: var(--color-primary, #800020);
    color: white;
  }
  .btn-confirm.primary:hover:not(:disabled) {
    background-color: #66001a; /* versión más oscura de guinda para hover */
  }

  .btn-cancel:disabled,
  .btn-confirm:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  .scale-up-enter-active {
    transition: all 0.3s ease-out;
  }
  .scale-up-leave-active {
    transition: all 0.2s ease-in;
  }
  .scale-up-enter-from,
  .scale-up-leave-to {
    transform: scale(0.95);
    opacity: 0;
  }

  @media (prefers-color-scheme: dark) {
    .modal-content {
      background-color: var(--surface-card); /* fondo oscuro */
      color: var(--text-primary); /* texto claro */
    }

    p {
      color: var(--text-secondary);
    }

    .btn-cancel {
      background-color: #5a5a5a;
      color: white;
    }

    .btn-cancel:hover:not(:disabled) {
      background-color: #484848;
    }

    .btn-confirm.primary {
      background-color: var(--primary-color);
      color: var(--text-on-primary);
    }

    .btn-confirm.primary:hover:not(:disabled) {
      background-color: var(--primary-dark);
    }

    .btn-confirm.danger {
      background-color: var(--danger-color, #ff6b6b);
      color: white;
    }

    .btn-confirm.danger:hover:not(:disabled) {
      background-color: #e63946;
    }
  }
</style>
