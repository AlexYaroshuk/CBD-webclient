import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";


/* import "./script.js"; */




createApp(App).use(store).use(router).mount("#app"); // Change this line



