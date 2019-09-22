import './main.css'
/**
 * This will only include font files
 */
import '@aeternity/aepp-components/dist/aepp.fonts.css'

import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import router from './router'
import * as filters from './utils/filters'


Vue.use(VueRouter);

Vue.config.productionTip = false;


Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
});

export default new Vue({
  router: router,
  render: h => h(App)
}).$mount('#app')
