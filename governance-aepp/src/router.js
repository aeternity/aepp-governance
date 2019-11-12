import Router from 'vue-router'
import Home from './views/Home.vue'
import Create from './views/Create.vue'
import Poll from "./views/Poll.vue";
import Account from "./views/Account.vue";
import Testing from "./views/Testing.vue";

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {title: 'Home'}
  }, {
    path: '/create',
    name: 'create',
    component: Create,
    meta: {title: 'Create'}
  }, {
    path: '/account/:account',
    name: 'account',
    component: Account,
    meta: {title: 'Account'}
  }, {
    path: '/poll/:id',
    name: 'poll',
    component: Poll,
    meta: {title: 'Poll'}
  }, {
    path: '/testing',
    name: 'testing',
    component: Testing,
    meta: {title: 'Testing Mode'}
  }
]

const router = new Router({mode: 'hash', routes: routes})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - Governance Aepp`
  next()
})

export default router;
