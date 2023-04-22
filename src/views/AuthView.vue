<template>
  <div class="about">
    Welcome to chatCBD
    <AuthDialog />
    <p>(dev server)</p>
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
