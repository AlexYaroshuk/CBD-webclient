<template>
  <DashboardMain :is-logged-in="isLoggedIn" />
</template>
<script>
import DashboardMain from "../components/DashboardMain.vue";

export default {
  components: {
    DashboardMain,
  },

  data() {
    return {
      conversations: [],
    };
  },
  props: {
    isLoggedIn: {
      type: Boolean,
      required: true,
    },
  },

  methods: {
    signOut() {
      this.$root.signOut();
    },
  },
};
</script>

<style>
/* your styles here */
</style>
