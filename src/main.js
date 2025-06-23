import { createApp } from 'vue';
import '@fortawesome/fontawesome-free/css/all.css';
import App from './App.vue';
import router from './router';
import './styles/global.scss';

const app = createApp(App);
app.use(router);
app.mount('#app');
