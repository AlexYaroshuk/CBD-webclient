<template>
  <div id="auth-container">
    <h1>Sign In / Sign Up</h1>
    <form @submit.prevent="submitForm">
      <label for="phone">Phone number:</label>
      <input
        type="tel"
        id="phone"
        name="phone"
        v-model="phoneNumber"
        required
      />
      <div id="recaptcha-container"></div>
      <button type="button" @click="sendCode">Send verification code</button>

      <div v-if="showCodeInput">
        <label for="code">Verification code:</label>
        <input
          type="text"
          id="code"
          name="code"
          v-model="verificationCode"
          required
        />
        <button type="submit">Verify</button>
      </div>
    </form>
  </div>
</template>

<script>
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { database } from "../firebase";

import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
} from "firebase/auth";
import app from "../firebase";

const auth = getAuth(app);

export default {
  data() {
    return {
      phoneNumber: "",
      verificationCode: "",
      showCodeInput: false,
      confirmationResult: null,
      appVerifier: null,
    };
  },

  methods: {
    async createUserConversations(userId) {
      const userConversationsRef = collection(
        database,
        `users/${userId}/conversations`
      );
      const initialConversationRef = doc(userConversationsRef);
      const initialData = {
        id: initialConversationRef.id,
        messages: [],
      };

      await setDoc(initialConversationRef, initialData);
    },

    async sendCode() {
      if (!this.phoneNumber) {
        alert("Please enter a valid phone number.");
        return;
      }

      if (!this.appVerifier) {
        this.appVerifier = new RecaptchaVerifier(
          "recaptcha-container",
          {
            size: "invisible",
            callback: (response) => {
              this.sendCode();
            },
          },
          auth
        );
      }

      try {
        this.confirmationResult = await signInWithPhoneNumber(
          auth,
          this.phoneNumber,
          this.appVerifier
        );
        this.showCodeInput = true;
      } catch (error) {
        console.error("Error sending verification code:", error);
        alert("Failed to send verification code. Please try again.");
        this.appVerifier
          .render()
          .then((widgetId) => this.appVerifier.grecaptcha.reset(widgetId));
      }
    },

    async submitForm() {
      if (!this.verificationCode) {
        alert("Please enter the verification code.");
        return;
      }

      try {
        const result = await this.confirmationResult.confirm(
          this.verificationCode
        );
        const user = result.user;

        // Check if the user document exists
        const userDocRef = doc(database, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (!userDocSnapshot.exists()) {
          await setDoc(userDocRef, { phone: this.phoneNumber });

          // Create the initial conversation for the new user
          await this.createUserConversations(user.uid);
        }

        // Emit an event to the parent component
        this.$emit("auth-success", user);
      } catch (error) {
        console.error("Error signing in:", error);
        alert("Failed to sign in. Please try again.");
      }
    },
  },
};
</script>

<style scoped>
#auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}

#auth-form {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}
</style>
