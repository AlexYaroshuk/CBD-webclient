<template>
  <div class="about">
    Welcome to chatCBD beta. This service is currently in early development, so
    get ready for bugs
    <AuthDialog />
  </div>
</template>
<script>
import AuthDialog from "../components/AuthDialog.vue";

export default {
  components: {
    AuthDialog,
  },
};
</script>

<style>
.about {
  color: #4fefff;
}
</style>
