import './main.css'

import Vue from 'vue'
import App from './App.vue'
import router from './router'
import mitt from 'mitt';

const eventBus = mitt()

const app = new Vue({
  router,
  render: h => h(App)
}).$mount('#app')

app.config.globalProperties.eventBus = eventBus
