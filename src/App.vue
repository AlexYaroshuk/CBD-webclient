<template>
  <div id="vue-app">
    <!--     <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link> |
      <router-link v-if="isLoggedIn" to="/dashboard">Dashboard</router-link>
    </nav> -->

    <AuthDialog v-if="!isLoggedIn" @auth-success="handleAuthSuccess" />
    <router-view :isLoggedIn="isLoggedIn" @logout-success="handleLogout" />
  </div>
</template>

<script>
import AuthDialog from "./components/AuthDialog.vue";
import { getAuth, signOut } from "firebase/auth";
import router from "./router";
const auth = getAuth();
export default {
  components: {
    AuthDialog,
  },
  data() {
    return {
      isLoggedIn: false,
    };
  },
  mounted() {
    auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user);
      if (user) {
        this.isLoggedIn = true;
        router.push("/dashboard");
      } else {
        this.isLoggedIn = false;
        router.push("/auth");
      }
    });
  },
  methods: {
    handleAuthSuccess() {
      console.log("run");
      this.isLoggedIn = true;
      // Store additional session information, such as location, logged-in date, IP, etc.
      // ...
    },

    async signOut() {
      try {
        await auth.signOut();
        this.isLoggedIn = false;
        router.push("/");
      } catch (error) {
        console.error("Error signing out:", error);
        alert("Failed to sign out. Please try again.");
      }
    },
  },
};
</script>
<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
