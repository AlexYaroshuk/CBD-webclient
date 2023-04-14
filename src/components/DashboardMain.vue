<template>
  <div>
    <!--     <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </nav> -->

    <div class="overlay" id="overlay"></div>
    <div class="header">
      <button class="drawer-btn" id="drawer-btn">
        <i class="material-icons">menu</i>
      </button>
    </div>

    <div class="container">
      <div class="sidebar">
        <button class="action-btn" id="new-chat-btn">
          <i class="material-icons">add</i>New chat
        </button>
        <div class="conversation-list-wrapper">
          <div id="conversation-list">
            <div
              v-for="(conversation, index) in conversations"
              :key="index"
              class="conversation-list-item"
              @click="handleConversationClick(index)"
            >
              <i class="material-icons">chat_bubble_outline</i>
              {{
                conversation.find((message) =>
                  message.prompt.startsWith("User: ")
                )?.prompt ?? "No messages"
              }}
            </div>
          </div>
        </div>

        <div class="clear-chat-history-wrapper">
          <button class="action-btn" id="clear-chatHistory-btn">
            <i class="material-icons">delete</i>Clear history
          </button>
          <button class="action-btn" v-if="isLoggedIn" @click="signOut">
            <i class="material-icons">logout</i>Sign out
          </button>
        </div>
      </div>

      <div class="mainview">
        <div id="chat_container"></div>
        <div id="start-message" class="start-message">chatCBD</div>
        <form id="chat-form">
          <textarea
            name="prompt"
            rows="1"
            placeholder="Type your message"
          ></textarea>
          <button type="submit" id="submit-btn" class="action-btn" disabled>
            <i class="material-icons">send</i>
          </button>
        </form>
        <div class="form-helper-text">
          <a href="https://github.com/AlexYaroshuk/CBD-webclient"
            >chatCBD Apr 5 Version.</a
          >
          ChatCBD may produce inaccurate information about people, places, or
          facts
        </div>
      </div>
    </div>

    <div id="confirmation-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Clear History</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete all conversations?</p>
        </div>
        <div class="modal-footer">
          <button
            id="confirm-clear-history"
            class="modal-button modal-button-destructive"
          >
            Delete all conversations
          </button>

          <button id="cancel-clear-history" class="modal-button">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import myScript from "../script.js";

export default {
  name: "DashboardMain",
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

  mounted() {
    // Call your JavaScript code from the mounted hook
    myScript();
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
