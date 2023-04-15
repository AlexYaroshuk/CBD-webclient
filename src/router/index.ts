import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import ChatView from "../views/ChatView.vue";

import { auth } from "../firebase";


const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/auth",
    name: "auth",
    component: AboutView,
    meta: {
      requiresGuest: true
    }
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: ChatView,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/"
  }

];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest);

  const user = auth.currentUser;

  if (requiresAuth && !user) {
    next("/auth");
  } else if (requiresGuest && user) {
    next("/dashboard"); // Change this to '/dashboard'
  } else {
    next();
  }
});


export default router;
