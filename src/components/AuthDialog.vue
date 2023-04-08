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
import firebase from "./firebase.js";

export default {
  data() {
    return {
      phoneNumber: "",
      verificationCode: "",
      showCodeInput: false,
      verificationId: null,
    };
  },
  methods: {
    async sendCode() {
      if (!this.phoneNumber) {
        alert("Please enter a valid phone number.");
        return;
      }

      const appVerifier = new firebase.auth.RecaptchaVerifier("send-code", {
        size: "invisible",
      });

      try {
        this.verificationId = await firebase
          .auth()
          .signInWithPhoneNumber(this.phoneNumber, appVerifier);
        this.showCodeInput = true;
      } catch (error) {
        console.error("Error sending verification code:", error);
        alert("Failed to send verification code. Please try again.");
      }
    },
    async submitForm() {
      if (!this.verificationCode) {
        alert("Please enter the verification code.");
        return;
      }

      try {
        const credential = firebase.auth.PhoneAuthProvider.credential(
          this.verificationId,
          this.verificationCode
        );
        await firebase.auth().signInWithCredential(credential);
        // Emit an event to the parent component
        this.$emit("auth-success");
      } catch (error) {
        console.error("Error signing in:", error);
        alert("Failed to sign in. Please try again.");
      }
    },
  },
};
</script>
