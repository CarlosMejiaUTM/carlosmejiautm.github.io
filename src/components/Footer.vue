<template>
  <footer class="footer">
    <div class="footer-container">
      <!-- Logo -->
      <div class="footer-logo-container">
        <img :src="logo" alt="RenacimientoMaya Logo" class="footer-logo" />
      </div>

      <!-- Descripción -->
      <div class="footer-description">
        <h3>¿Qué es RenacimientoMaya?</h3>
        <p>
          Es un sitio web para descubrir y explorar las zonas turísticas más
          emblemáticas del estado de Yucatán. Aquí puedes ver imágenes, leer
          reseñas, y planear tu próxima aventura cultural o natural.
        </p>
        <hr class="footer-separator" />
      </div>

      <!-- Redes Sociales -->
      <div class="footer-social">
        <h4>Síguenos en:</h4>
        <div class="social-icons">
          <a href="https://facebook.com" target="_blank" aria-label="Facebook">
            <i class="fab fa-facebook-f"></i>
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            aria-label="Instagram"
          >
            <i class="fab fa-instagram"></i>
          </a>
          <a href="https://youtube.com" target="_blank" aria-label="YouTube">
            <i class="fab fa-youtube"></i>
          </a>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <p>© 2025 RenacimientoMaya. Todos los derechos reservados.</p>
    </div>
  </footer>
</template>

<script setup>
  import logo from './img/logo.png';
</script>

<style scoped lang="scss">
  .footer {
    background-color: var(--primary-color);
    color: var(--text-on-primary);
    padding: 2rem 1rem 2.5rem;
    border-top: 1px solid var(--border-color);
    font-family: var(--font-family);
    transition:
      background-color 0.3s ease,
      color 0.3s ease;

    .footer-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;

      @media (min-width: 768px) {
        flex-direction: row;
        align-items: flex-start;
      }
    }

    .footer-logo-container {
      flex-shrink: 0;

      .footer-logo {
        width: 150px;
        height: auto;
      }
    }

    .footer-description {
      flex: 2;
      text-align: center;

      @media (min-width: 768px) {
        text-align: left;
        padding: 0 1rem;
      }

      h3 {
        margin-bottom: 0.5rem;
        font-size: 1.2rem;
        color: var(--text-on-primary);
      }

      p {
        font-size: 0.95rem;
        line-height: 1.5;
        color: var(--text-on-primary);
      }
    }

    .footer-separator {
      border: none;
      border-top: 1px solid rgba(255, 255, 255, 0.3);
      margin: 1rem 0;
      width: 100%;
      max-width: 80%;
      margin-left: auto;
      margin-right: auto;
    }

    .footer-social {
      text-align: center;

      @media (min-width: 768px) {
        text-align: right;
      }

      h4 {
        margin-bottom: 0.5rem;
        font-size: 1.1rem;
        color: var(--text-on-primary);
      }

      .social-icons {
        display: flex;
        justify-content: center;
        gap: 1rem;

        @media (min-width: 768px) {
          justify-content: flex-end;
        }

        a {
          font-size: 1.4rem;
          color: var(--text-on-primary);
          transition: color 0.3s;

          &:hover {
            color: var(--accent-color);
          }
        }
      }
    }

    .footer-bottom {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.85rem;
      opacity: 0.85;
      color: var(--text-on-primary);
    }
  }
</style>
