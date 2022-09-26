import {createRouter, createWebHistory} from 'vue-router'


// route level code-splitting
// this generates a separate chunk (...[hash].js) for this route
// which is lazy-loaded when the route is visited.
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import(/* webpackChunkName: "home" */ '../views/Home.vue'),
    meta: {title: 'Home'}
  }, {
    path: '/create',
    name: 'create',
    component: () => import(/* webpackChunkName: "create" */ '../views/Create.vue'),
    meta: {title: 'Create'}
  }, {
    path: '/account/:account',
    name: 'account',
    component: () => import(/* webpackChunkName: "account" */ '../views/Account.vue'),
    meta: {title: 'Account'}
  }, {
    path: '/poll/:id',
    name: 'poll',
    component: () => import(/* webpackChunkName: "poll" */ '../views/Poll.vue'),
    meta: {title: 'Poll'}
  }, {
    path: '/help',
    name: 'help',
    component: () => import(/* webpackChunkName: "help" */ '../views/Help.vue'),
    meta: {title: 'Help & Hints'}
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - Governance Aepp`;
  next()
});

export default router
