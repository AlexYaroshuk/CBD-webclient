import { getAuth } from "firebase/auth";

const auth = getAuth();

export default {
  computed: {
    isLoggedIn() {
      return !!auth.currentUser;
    },
  },
};
