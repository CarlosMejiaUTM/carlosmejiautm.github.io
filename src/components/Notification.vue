<template>
  <transition name="slide-fade">
    <div
      v-if="notification.visible"
      :class="['notification', notification.type]"
      role="alert"
    >
      <div class="notification-icon">
        <span v-if="notification.type === 'success'">✔</span>
        <span v-else>✖</span>
      </div>
      <p class="notification-message">{{ notification.message }}</p>
    </div>
  </transition>
</template>

<script setup>
  defineProps({
    notification: {
      type: Object,
      required: true,
    },
  });
</script>

<style scoped>
  .notification {
    /* Posicionamiento y Dimensiones */
    position: fixed;
    top: 80px; /* Le damos un poco de espacio desde el header */
    right: 20px;
    width: auto; /* Ancho basado en el contenido */
    max-width: 380px; /* Un ancho máximo para que no sea muy grande */
    z-index: 9999; /* Un z-index muy alto para que siempre esté encima */

    /* Estilos Visuales */
    display: flex;
    align-items: center;
    padding: 1rem;
    border-radius: 8px;
    color: white;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .notification.success {
    background-color: #007b5f; /* Verde primario */
  }

  .notification.error {
    background-color: #e63946; /* Rojo de error */
  }

  .notification-icon {
    margin-right: 1rem;
    font-size: 1.2rem;
    line-height: 1;
  }

  .notification-message {
    margin: 0;
    padding: 0;
    line-height: 1.4;
  }

  /* Animación de entrada y salida */
  .slide-fade-enter-active {
    transition: all 0.4s ease-out;
  }

  .slide-fade-leave-active {
    transition: all 0.5s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateX(50px);
    opacity: 0;
  }
</style>
