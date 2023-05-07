<template>
  <div id="auth-container">
    <h2 style="padding: 1rem">Enter your phone number to login or sign up</h2>
    <form @submit.prevent="submitForm">
      <div style="width: 100%; flex-direction: column; padding: 1rem">
        <div>
          <input
            style="width: 100%"
            type="tel"
            id="phone"
            name="phone"
            v-model="phoneNumber"
            placeholder="Phone number w/ country code"
            required
          />
        </div>
        <div>
          <input
            v-if="showCodeInput"
            type="text"
            id="code"
            name="code"
            v-model="verificationCode"
            required
            placeholder="Verification code"
          />
          <div class="tab-container">
            <div>
              <button class="tab" type="submit" :disabled="sendingCode">
                <i v-if="!sendingCode" class="material-icons">{{
                  buttonIcon
                }}</i>
                <i v-else class="material-icons spin">autorenew</i>
                {{ buttonLabel }}
              </button>
            </div>
          </div>
        </div>
        <div id="recaptcha-container"></div>
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
      sendingCode: false,
    };
  },

  computed: {
    buttonLabel() {
      return this.showCodeInput ? "Verify" : "Send verification code";
    },
    buttonIcon() {
      return this.showCodeInput ? "check" : "send";
    },
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

      this.sendingCode = true;

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
      } finally {
        this.sendingCode = false;
      }
    },

    async submitForm() {
      if (!this.showCodeInput) {
        // Send verification code
        await this.sendCode();
      } else {
        // Verify the code
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

.tab-container {
  display: flex;
  justify-content: flex-end;
  margin: 0.25rem 0.5rem;
}

.tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  margin: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: border-color 0.1s;
  background-color: #4fefff;
  color: #101011;
}
.tab:hover {
  background-color: #b9b9b9;
}

.gray-placeholder::placeholder {
  color: gray;
}

.tab.active {
  background-color: #4fefff;
}
</style>
