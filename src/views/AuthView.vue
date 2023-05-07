<template>
  <div class="about">
    Welcome to chatCBD alpha(0.2.0).
    <br />
    This service is currently in early development, so
    <span
      style="
        background-color: #e80cf0;
        color: black;
        text-decoration: underline;
        font-size: large;
      "
      >get ready for bugs</span
    >.

    <div style="margin-top: 4rem" id="start-message" class="start-message">
      chatCBD
    </div>
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
