import './main.css'

import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import mitt from 'mitt';

const eventBus = mitt()

const app = createApp(App)

app.config.globalProperties.eventBus = eventBus
app.use(router).mount('#app')
