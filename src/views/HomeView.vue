<template>
  <div class="home">
    <img alt="Vue logo" src="/assets/logo.png" />
    <AuthDialog msg="Welcome to Your Vue.js + TypeScript App" />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import AuthDialog from "../components/AuthDialog.vue"; // @ is an alias to /src

@Options({
  components: {
    AuthDialog,
  },
})
export default class HomeView extends Vue {}
</script>
