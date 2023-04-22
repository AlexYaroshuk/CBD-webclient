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
        <div class="image-switch">
          <input type="checkbox" id="image-switch-input" />
          <label for="image-switch-input">Image</label>
        </div>
        <button
          id="regenerate-response-btn"
          class="action-btn-single"
          style="display: none"
        >
          <i class="material-icons">autorenew</i>Regenerate response
        </button>

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
            >chatCBD Apr 15 Version.</a
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
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import { database } from "../firebase"; // You already have this file
import { auth } from "../firebase";
import { escape } from "lodash";

export default {
  name: "DashboardMain",
  /*   data() {
    return {
      conversations: [],
    };
  }, */
  props: {
    isLoggedIn: {
      type: Boolean,
      required: true,
    },
  },

  mounted() {
    this.myFunction();
  },
  methods: {
    signOut() {
      this.$root.signOut();
    },

    handlePromptInput() {
      const promptInput = document.querySelector('textarea[name="prompt"]');
      const submitBtn = document.getElementById("submit-btn");
      promptInput.addEventListener("input", () => {
        if (promptInput.value.trim() === "") {
          submitBtn.disabled = true;
        } else {
          submitBtn.disabled = false;
        }
      });
    },

    myFunction() {
      //declare consts

      this.handlePromptInput();
      const conversationList = document.getElementById("conversation-list");
      const clearHistoryBtn = document.getElementById("clear-chatHistory-btn");
      const confirmationModal = document.getElementById("confirmation-modal");
      const confirmClearHistoryBtn = document.getElementById(
        "confirm-clear-history"
      );
      const cancelClearHistoryBtn = document.getElementById(
        "cancel-clear-history"
      );

      const chatContainer = document.querySelector("#chat_container");
      const startMessage = document.getElementById("start-message");
      const drawerBtn = document.getElementById("drawer-btn");
      const overlay = document.getElementById("overlay");
      const sidebar = document.querySelector(".sidebar");

      const form = document.getElementById("chat-form");
      const promptInput = document.querySelector('textarea[name="prompt"]');
      const newChatBtn = document.getElementById("new-chat-btn");

      const imageSwitchInput = document.getElementById("image-switch-input");

      promptInput.addEventListener("keydown", (e) => {
        if (e.keyCode === 13) {
          handleSubmit(e);
        }
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        // your submit code here
      });

      drawerBtn.addEventListener("click", () => {
        sidebar.classList.add("active"); // Add the 'active' class to the sidebar
        overlay.style.display = "block"; // Show the overlay
      });

      overlay.addEventListener("click", () => {
        sidebar.classList.remove("active"); // Remove the 'active' class from the sidebar
        overlay.style.display = "none"; // Hide the overlay
      });

      let chatHistory = [];
      let conversations = [];
      let lastPrompt = "";

      let loadInterval;

      let isImage = false;

      imageSwitchInput.addEventListener("change", (e) => {
        isImage = e.target.checked;
      });

      // Get activeConversation from local storage
      let activeConversation = localStorage.getItem("activeConversation");

      // Set the active conversation style

      function setActiveConversationStyle(conversationId) {
        if (conversationId) {
          const allItems = document.querySelectorAll(".conversation-list-item");
          sidebar.classList.remove("active"); // Remove the 'active' class from the sidebar
          overlay.style.display = "none";
          console.log(
            "🚀 ~ file: DashboardMain.vue:236 ~ item.addEventListener ~ none:"
          );
          allItems.forEach((item) => {
            if (item.id === conversationId) {
              item.classList.add("active");
            } else {
              item.classList.remove("active");
            }
          });
        } else {
          console.log("No conversation id given.");
        }
      }

      document.querySelectorAll(".conversation-list-item").forEach((item) => {
        item.addEventListener("click", () => {
          const conversationId = item.id;
          activeConversation = conversationId;

          setActiveConversationStyle(conversationId);
        });
      });

      const handleRegenerateResponseClick = async () => {
        if (lastPrompt) {
          const textarea = form.querySelector("textarea");
          textarea.value = lastPrompt;
          handleSubmit(null, true); // Pass true as the second argument to indicate resubmission
        }
      };

      document
        .getElementById("regenerate-response-btn")
        .addEventListener("click", handleRegenerateResponseClick);

      // Add event listeners to conversation list items
      function addConversationClickEventListeners() {
        const items = document.querySelectorAll(".conversation-list-item");
        items.forEach((item) => {
          item.addEventListener("click", (event) => {
            event.preventDefault();
            const conversationId = item.id;
            activeConversation = conversationId;

            setActiveConversationStyle(conversationId);
            localStorage.setItem("activeConversation", conversationId);

            const activeConv = conversations.find(
              (conv) => conv.id === activeConversation
            );
            if (activeConv) chatHistory = activeConv.messages || [];

            renderChatHistory(); // This line was missing
            updateStartMessageDisplay();
          });
        });
      }

      function loadActiveConversation() {
        if (activeConversation) {
          const conversation = conversations.find(
            (conv) => conv.id === activeConversation
          );
          if (conversation) {
            chatHistory = conversation.messages || [];
            renderChatHistory();
            updateStartMessageDisplay();
            setActiveConversationStyle(activeConversation);
          } else {
            chatHistory = []; // Clear chat history
            renderChatHistory(); // Render the empty chat history
            updateStartMessageDisplay();
          }
        }
      }

      async function loadConversationsFromFirebase() {
        const userUid = auth.currentUser.uid;
        const conversationsRef = collection(
          database,
          `users/${userUid}/conversations`
        );
        const conversationsQuery = query(conversationsRef);

        onSnapshot(conversationsQuery, (querySnapshot) => {
          conversations = [];
          querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const id = docSnapshot.id;
            const conversation = { id, messages: [] }; // initialize messages array
            if (data.messages) {
              conversation.messages = data.messages;
            }
            conversations.push(conversation);
          });

          renderConversationList();
          addConversationClickEventListeners();
          setActiveConversationStyle(activeConversation);
          loadActiveConversation();
        });
      }

      function typeText(element, text) {
        let index = 0;
        let interval = setInterval(() => {
          if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
          } else {
            clearInterval(interval);
          }
        }, 1);
      }

      function generateUniqueId() {
        const timestamp = Date.now();
        const randomNumber = Math.random();
        const hexadecimalString = randomNumber.toString(16);
        return `id-${timestamp}-${hexadecimalString}`;
      }

      function chatStripe(
        isAi,
        message,
        uniqueId,
        isImage = false,
        isError = false,
        isConversationListItem = false
      ) {
        const aiClass = isAi ? "ai" : "";
        const errorClass = isError ? "error" : "";
        const listItemClass = isConversationListItem
          ? "conversation-list-item"
          : "";
        const icon = isConversationListItem
          ? `<i class="material-icons">chat_bubble_outline</i>`
          : "";

        const content = isImage
          ? `<div class="image-loader-container">
         <div class="image-loader"></div>
         <img class="response-image" src="${message.content}" style="display:none;" onload="this.style.display='block'; this.previousElementSibling.style.display='none';" />
       </div>`
          : message.content;

        return `
<div class="wrapper ${aiClass} ${listItemClass}">
  <div class="chat">
    <div class="profile">
      <img
        src=${isAi ? "../src/assets/bot.svg" : "../src/assets/user.svg"}
        alt="${isAi ? "../src/assets/bot.svg" : "../src/assets/user.svg"}"
      />
    </div>
    <div class="message ${errorClass}" id=${uniqueId}>${icon}${content}</div>
  </div>
</div>
`;
      }

      function conversationListItem(value, uniqueId) {
        return `
    <div class="conversation-list-item" id=${uniqueId}>
      <i class="material-icons">chat_bubble_outline</i>
      ${value}
    </div>
  `;
      }

      function renderConversationList() {
        conversationList.innerHTML = "";
        conversations.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        conversations.forEach((conversation, index) => {
          const firstUserMessage = conversation.messages.find(
            (message) => message.role === "user"
          );

          // Display the content of the first user message
          const conversationElement = conversationListItem(
            firstUserMessage ? firstUserMessage.content : "",
            conversation.id
          );
          conversationList.insertAdjacentHTML("beforeend", conversationElement);
        });

        addConversationClickEventListeners();
      }

      function handleNewChatBtnClick() {
        activeConversation = null; // clear activeConversation
        chatHistory = []; // clear chatHistory
        localStorage.removeItem("activeConversation"); // clear activeConversation in local storage
        chatContainer.innerHTML = ""; // clear chat container
        updateStartMessageDisplay();
        setActiveConversationStyle(activeConversation);
      }

      newChatBtn.addEventListener("click", handleNewChatBtnClick);

      function renderChatHistory() {
        chatContainer.innerHTML = "";
        for (const message of chatHistory) {
          const isAi = message.role === "system";
          const isImage = message.isImage;
          chatContainer.innerHTML += chatStripe(
            isAi,
            message,
            message.uniqueId || null,
            isImage
          );
        }
      }

      function updateStartMessageDisplay() {
        if (activeConversation === null) {
          startMessage.style.display = "block";
          const newChatItem = document.querySelector(".new-chat-item");
          if (newChatItem) {
            newChatItem.classList.add("active");
          }
        } else {
          startMessage.style.display = "none";
          const newChatItem = document.querySelector(".new-chat-item");
          if (newChatItem) {
            newChatItem.classList.remove("active");
          }
        }
      }

      async function updateFirebaseAndRender() {
        const userUid = auth.currentUser.uid;
        const conversationsRef = collection(
          database,
          `users/${userUid}/conversations`
        );

        // Iterate through the conversations array and set each document in the Firestore
        for (const conversation of conversations) {
          const conversationDocRef = doc(conversationsRef, conversation.id);
          await setDoc(conversationDocRef, { messages: conversation.messages });
        }
      }

      function fetchWithTimeout(url, options, timeout = 25000) {
        return Promise.race([
          fetch(url, options),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), timeout)
          ),
        ]);
      }

      function showImageLoader(messageDiv) {
        messageDiv.innerHTML = `
    <div class="image-loader-container">
      <div class="image-loader"></div>
    </div>
  `;
      }

      function loader(element) {
        element.textContent = "";
        loadInterval = setInterval(() => {
          element.textContent += ".";
          if (element.textContent === "....") {
            element.textContent = "";
          }
        }, 300);
      }

      const activeConv = conversations.find(
        (conv) => conv.id === activeConversation
      );

      async function handleSubmit(e, resubmit = false) {
        if (e) e.preventDefault();

        const imageSwitch = document.getElementById("image-switch-input");

        const userPrompt = {
          role: "user",
          content: escape(promptInput.value),
        };

        lastPrompt = userPrompt.content;

        if (!userPrompt.content.trim()) {
          return; // Do nothing if input is empty or only contains whitespace
        }

        // Only push the userPrompt and render the chat history if this is not a resubmission
        if (resubmit) {
          // Remove the last message from chatHistory and activeConv.messages when resubmitting
          chatHistory.pop();
          if (activeConv) {
            activeConv.messages.pop();
          }
        } else {
          chatHistory.push(userPrompt);
        }

        renderChatHistory();

        const sanitizedPrompt = escape(userPrompt);

        const isResubmittedPrompt = sanitizedPrompt === lastPrompt;
        if (isResubmittedPrompt) {
          chatHistory.pop();
          if (activeConv) {
            activeConv.messages.pop();
          }
        }

        if (activeConversation === null) {
          const newConversation = {
            id: generateUniqueId(),
            messages: chatHistory,
          };
          activeConversation = newConversation.id;
          conversations.push(newConversation);
          localStorage.setItem("activeConversation", activeConversation); // Set activeConversation in local storage
          updateStartMessageDisplay();
          renderConversationList();
        }

        form.reset();

        const uniqueId = generateUniqueId();

        const isImage = document.getElementById("image-switch-input").checked;

        // Create a new message element
        const newMessage = document.createElement("div");
        if (isImage) {
          newMessage.innerHTML = `
      <div class="wrapper ai">
        <div class="chat">
          <div class="profile">
            <img src="../src/assets/bot.svg" alt="../src/assets/bot.svg" />
          </div>
          
            <div class="image-loader-container">
              <div class="image-loader"></div>
              <div class="message" id=${uniqueId}>
            </div>
          </div>
        </div>
      </div>`;
        } else {
          newMessage.innerHTML = chatStripe(true, { content: "" }, uniqueId);
        }

        // Append the new message element to the chatContainer
        chatContainer.appendChild(newMessage);

        if (activeConv) activeConv.messages = chatHistory;

        // Update the conversation list item with the icon
        const listItem = document.getElementById(
          `conversation-${activeConversation}`
        );
        if (listItem) {
          const textContent = listItem.querySelector(".text-content");
          if (textContent) {
            textContent.textContent = sanitizedPrompt;
          } else {
            listItem.innerHTML = `
        <i class="material-icons">chat_bubble_outline</i>
        <span class="text-content">${sanitizedPrompt}</span>
      `;
          }
        }

        chatContainer.scrollTop = chatContainer.scrollHeight;

        const messageDiv = document.getElementById(uniqueId);
        try {
          loader(messageDiv);

          const FETCH_TIMEOUT = 15000; // 15 seconds

          console.log(chatHistory);

          document.getElementById("regenerate-response-btn").style.display =
            "none";

          const response = await fetchWithTimeout(
            "https://chat-cbd-server-test.onrender.com/send-message",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messages: chatHistory,
                isImage: isImage,
              }),
            },
            FETCH_TIMEOUT
          );

          clearInterval(loadInterval);
          messageDiv.innerHTML = "";

          if (response.ok) {
            const data = await response.json();
            const parsedData = data.bot.trim();
            const isImage = data.isImage;

            if (isImage) {
              // Remove the image loader container
              messageDiv.innerHTML = "";

              // Wait for the image to load and then replace the loader with the image
              const img = new Image();
              img.src = parsedData;
              img.alt = "Generated Image";
              img.style.maxWidth = "100%"; // Optional: Set a max width for the image
              img.onload = () => {
                messageDiv.appendChild(img);
              };
            } else {
              messageDiv.innerHTML = "";
              typeText(messageDiv, parsedData);
            }

            chatHistory.push({
              role: "system",
              content: parsedData,
              isImage: isImage,
            });

            if (activeConversation === null) {
              const newConversation = {
                id: generateUniqueId(),
                messages: chatHistory,
              };
              activeConversation = newConversation.id;
              conversations.push(newConversation);
            } else {
              // Update the conversation list item with the icon
              const convIndex = conversations.findIndex(
                (conv) => conv.id === activeConversation
              );
              if (convIndex >= 0) {
                const listItem = document.getElementById(
                  `conversation-${activeConversation}`
                );
                if (listItem) {
                  const textContent = listItem.querySelector(".text-content");
                  if (textContent) {
                    textContent.textContent = sanitizedPrompt;
                  } else {
                    listItem.innerHTML = `
                <i class="material-icons">chat_bubble_outline</i>
                <span class="text-content">${sanitizedPrompt}</span>
              `;
                  }
                }
              }
            }
            document.getElementById("regenerate-response-btn").style.display =
              "block";

            updateFirebaseAndRender();
          } else {
            const errorMessage = "An error occurred. Please try again.";
            messageDiv.innerHTML = errorMessage;
            messageDiv.classList.add("error"); // Add the 'error' class to the message
            chatHistory.push({ role: "system", content: errorMessage });
            document.getElementById("regenerate-response-btn").style.display =
              "block";
          }
        } catch (error) {
          clearInterval(loadInterval);
          const errorMessage =
            error.message === "Request timed out"
              ? "Request timed out. Please try again."
              : "An error occurred. Please try again.";
          messageDiv.innerHTML = errorMessage;
          messageDiv.classList.add("error"); // Add the 'error' class to the message

          // Add the error message to chatHistory and activeConv.messages arrays
          chatHistory.push({ role: "system", content: errorMessage });
          if (activeConv) {
            activeConv.messages.push({ role: "system", content: errorMessage });
          }

          document.getElementById("regenerate-response-btn").style.display =
            "block";
          lastPrompt = sanitizedPrompt;
        }
      }

      form.onsubmit = handleSubmit;

      clearHistoryBtn.addEventListener("click", () => {
        confirmationModal.style.display = "block";
      });

      confirmClearHistoryBtn.addEventListener("click", async () => {
        const userUid = auth.currentUser.uid;
        const conversationsRef = collection(
          database,
          `users/${userUid}/conversations`
        );

        // Delete all documents in the user's conversations collection
        const querySnapshot = await getDocs(conversationsRef);
        const batch = writeBatch(database);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        // Reset the conversations array, activeConversation, and chatHistory
        conversations = [];
        activeConversation = null;
        chatHistory = [];

        // Update the UI
        localStorage.removeItem("conversations");
        chatContainer.innerHTML = "";
        renderConversationList();
        updateStartMessageDisplay();

        // Close the confirmation modal
        confirmationModal.style.display = "none";
      });

      cancelClearHistoryBtn.addEventListener("click", () => {
        confirmationModal.style.display = "none";
      });

      updateStartMessageDisplay();
      setActiveConversationStyle(activeConversation);
      loadActiveConversation();
      loadConversationsFromFirebase();
    },
  },
};
</script>

<style>
.image-switch {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin: 0.5rem 1rem;
}

.image-switch label {
  margin-left: 0.5rem;
  cursor: pointer;
}

.image-loader-container {
  display: flex;
  position: relative;
  width: 256px;
  /* Adjust the width of the bounding box as needed */
  height: 256px;
  /* Adjust the height of the bounding box as needed */
  background-color: #f0f0f0;
  /* Optional: Set a background color for the bounding box */
  border-radius: 4px;
  overflow: hidden;
  /* Optional: Set a border radius for the bounding box */
}

.image-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  margin-top: -20px;
  margin-left: -20px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
