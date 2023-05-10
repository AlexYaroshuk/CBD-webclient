<template>
  <div class="about">
    Welcome to chatCBD alpha(0.2.1).
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

    <div
      class="latest-changes"
      style="
        display: flex;
        flex-direction: column;
        width: fit-content;
        text-align: left;
        margin: 0 auto;
      "
    >
      <h3>Latest changes (May 10th)</h3>
      <br />

      <p>-Added ability to choose the quality of generated images</p>
      <p style="margin-top: 0.5rem">
        -Added ability to view images in fullscreen
      </p>
      <p style="margin-top: 0.5rem">
        -Added this Latest changes section so you see the latest changes 🗒️🤟🚀
      </p>
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

.latest-changes {
  display: flex;
  flex-direction: column;
  width: fit-content;
  text-align: left;
  margin: 0 auto;
}
@media (max-width: 600px) {
  .latest-changes h3 {
    font-size: medium;
    /* CSS styles go here */
  }
}
@media (max-width: 600px) {
  .latest-changes p {
    font-size: small;
    /* CSS styles go here */
  }
}
</style>
