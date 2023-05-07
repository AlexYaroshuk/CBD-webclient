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

        <div>
          <button
            id="regenerate-response-btn"
            class="action-btn-single"
            style="display: none"
          >
            <i class="material-icons">autorenew</i>Regenerate response
          </button>
          <div class="tab-container">
            <div id="text-tab" class="tab active">
              <i class="material-icons">text_format</i>Text
            </div>
            <div id="image-tab" class="tab">
              <i class="material-icons">image</i>Image
            </div>
          </div>
        </div>

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
            >chatCBD May 7 Version.</a
          >
          ChatCBD may produce inaccurate information about people, places, or
          facts.
        </div>
        <div class="form-helper-text-hl">
          This service is currently in early development, so get ready for bugs.
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

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, database, storage } from "../firebase";

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

    handlePromptInput(shouldDisableButton) {
      const promptInput = document.querySelector('textarea[name="prompt"]');
      const submitBtn = document.getElementById("submit-btn");
      promptInput.addEventListener("input", () => {
        submitBtn.disabled = shouldDisableButton(promptInput.value);
      });
    },

    myFunction() {
      //declare vars

      let isPendingResponse = false;

      const shouldDisableButton = (inputValue) => {
        return inputValue.trim() === "" || isPendingResponse;
      };

      // Pass the shouldDisableButton callback function to handlePromptInput
      this.handlePromptInput(shouldDisableButton);

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
      });

      drawerBtn.addEventListener("click", () => {
        sidebar.classList.add("active"); // Add the 'active' class to the sidebar
        overlay.style.display = "block"; // Show the overlay
      });

      overlay.addEventListener("click", () => {
        sidebar.classList.remove("active"); // Remove the 'active' class from the sidebar
        overlay.style.display = "none"; // Hide the overlay
      });

      document.addEventListener("DOMContentLoaded", () => {
        const copyTextBtns = document.querySelectorAll(".copy-btn");

        copyTextBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            const uniqueId = btn.getAttribute("data-id");
            copyMessageToClipboard(uniqueId);
          });
        });
      });

      let chatHistory = [];
      let conversations = [];
      let lastPrompt = "";

      let loadInterval;

      let isImage = false;

      const textTab = document.getElementById("text-tab");
      const imageTab = document.getElementById("image-tab");

      textTab.addEventListener("click", () => {
        isImage = false;
        textTab.classList.add("active");
        imageTab.classList.remove("active");
        promptInput.placeholder = "Type your message";
      });

      imageTab.addEventListener("click", () => {
        isImage = true;
        textTab.classList.remove("active");
        imageTab.classList.add("active");
        promptInput.placeholder = "Type your image description";
      });

      // Get activeConversation from local storage
      let activeConversation = localStorage.getItem("activeConversation");

      // Set the active conversation style

      async function copyMessageToClipboard(uniqueId) {
        const messageDiv = document.getElementById(uniqueId);
        const content = messageDiv.textContent;

        // Copy the content to the clipboard
        try {
          await navigator.clipboard.writeText(content);
        } catch (err) {
          console.error("Failed to copy text: ", err);
        }

        // Change the icon to a checkmark
        const chatControls =
          messageDiv.parentNode.querySelector(".chat-controls i");
        chatControls.textContent = "check";

        // Revert the icon back to 'content_copy' after 3 seconds
        setTimeout(() => {
          chatControls.textContent = "content_copy";
        }, 3000);
      }

      function setActiveConversationStyle(conversationId) {
        if (conversationId) {
          const allItems = document.querySelectorAll(".conversation-list-item");
          sidebar.classList.remove("active"); // Remove the 'active' class from the sidebar
          overlay.style.display = "none";

          allItems.forEach((item) => {
            if (item.id === conversationId) {
              item.classList.add("active");
            } else {
              item.classList.remove("active");
            }
          });
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

            renderChatHistory();
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
            chatHistory = [];
            renderChatHistory();
            updateStartMessageDisplay();
          }
        }
      }

      async function loadConversationsFromFirebase() {
        try {
          const userUid = auth.currentUser.uid;

          const conversationsRef = collection(
            database,
            `users/${userUid}/conversations`
          );

          const conversationsQuery = query(conversationsRef);

          // Use getDocs() instead of onSnapshot()
          const querySnapshot = await getDocs(conversationsQuery);
          querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const id = docSnapshot.id;
            const conversation = { id, messages: [] };
            if (data.messages) {
              conversation.messages = data.messages;
            }

            const existingConvIndex = conversations.findIndex(
              (conv) => conv.id === id
            );

            if (existingConvIndex >= 0) {
              conversations[existingConvIndex] = conversation;
            } else {
              conversations.push(conversation);
              console.log(
                "🚀 ~ file: DashboardMain.vue:359 ~ querySnapshot.forEach ~ conversation:",
                conversation
              );
            }
          });

          renderConversationList();
          addConversationClickEventListeners();
          setActiveConversationStyle(activeConversation);
          loadActiveConversation();
        } catch (error) {
          console.error("Error loading conversations:", error);
          showConversationListFetchError(error.message);
        }
      }

      function showConversationListFetchError(message) {
        const errorDiv = document.createElement("div");
        errorDiv.id = "error-div";

        const errorMsg = document.createElement("p");
        errorMsg.textContent = `Error: ${message}`;
        errorDiv.appendChild(errorMsg);

        const retryBtn = document.createElement("button");
        retryBtn.id = "retry-btn";
        retryBtn.textContent = "Retry";
        errorDiv.appendChild(retryBtn);

        retryBtn.addEventListener("click", () => {
          errorDiv.remove();
          loadConversationsFromFirebase();
        });

        const conversationListWrapper = document.querySelector(
          ".conversation-list-wrapper"
        );
        conversationListWrapper.appendChild(errorDiv);
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
        }, 2);
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
        isConversationListItem = false,
        isError = false
      ) {
        const aiClass = isAi ? "ai" : "";
        const errorClass = isError ? "error" : "";
        const listItemClass =
          isConversationListItem && message.type !== "image"
            ? "conversation-list-item"
            : "";
        const icon =
          isConversationListItem && message.type !== "image"
            ? `<i class="material-icons">chat_bubble_outline</i>`
            : "";

        const hasImages =
          message.images !== undefined && message.images.length > 0;

        const content = hasImages
          ? message.images
              .map((imageUrl, index) => {
                return `<div class="image-loader-container">
  <div class="image-loader"></div>
  <img class="response-image" id="response-image-${uniqueId}-${index}" src="" data-src="${imageUrl}" style="display:none;" width="256" height="256" />
</div>`;
              })
              .join("")
          : message.content;

        return `
<div class="wrapper ${aiClass} ${listItemClass}">
  <div class="chat">
    <div class="profile">
      <img
        src=${isAi ? "/assets/bot.svg" : "/assets/user.svg"}
        alt="${isAi ? "/assets/bot.svg" : "/assets/user.svg"}"
      />
    </div>
    <div class="message ${errorClass}" id=${uniqueId}>${icon}${content}</div>
    <div class="chat-controls">
      <i class="material-icons copy-btn" data-id="${uniqueId}">content_copy</i>
    </div>
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

      function generateImageElements(images) {
        return images
          .map((imageUrl, index) => {
            return `<div class="image-loader-container">
        <div class="image-loader"></div>
        <img class="response-image" id="response-image-${index}" src="" data-src="${imageUrl}" style="display:none;" width="256" height="256" />
      </div>`;
          })
          .join("");
      }

      function handleImageLoad(imageUrl, imgElement) {
        const loader = imgElement.parentElement.querySelector(".image-loader");
        if (loader) {
          loader.classList.add("active");
        }

        imgElement.addEventListener("load", () => {
          imgElement.style.display = "block";
          if (loader) {
            loader.classList.remove("active");
          }
        });

        const cachedImage = new Image();
        cachedImage.src = imageUrl;
        cachedImage.onload = () => {
          imgElement.src = imageUrl;
        };
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

      function addCopyEventListeners() {
        const copyTextBtns = document.querySelectorAll(".copy-btn");

        copyTextBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            const uniqueId = btn.getAttribute("data-id");
            copyMessageToClipboard(uniqueId);
          });
        });
      }

      function renderChatHistory() {
        chatContainer.innerHTML = "";
        let messageIdCounter = 0;
        for (const message of chatHistory) {
          const isAi = message.role === "system";
          const isImage = message.type === "image";
          const uniqueId = message.uniqueId || `message-${messageIdCounter}`;
          messageIdCounter++;
          const messageElement = chatStripe(
            isAi,
            message,
            uniqueId,
            false,
            isImage
          );

          chatContainer.insertAdjacentHTML("beforeend", messageElement);

          // Add the event listeners after inserting the message element
          addCopyEventListeners();

          if (isImage && message.images) {
            message.images.forEach((imageUrl, index) => {
              const imgElement = document.getElementById(
                `response-image-${uniqueId}-${index}`
              );
              if (imgElement) {
                handleImageLoad(imageUrl, imgElement);
              } else {
                console.error(
                  `Image element with ID response-image-${uniqueId}-${index} not found`
                );
              }
            });
          }
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

      function fetchWithTimeout(url, options, timeout = 35000) {
        return Promise.race([
          fetch(url, options),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), timeout)
          ),
        ]);
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

      var activeConv = conversations.find(
        (conv) => conv.id === activeConversation
      );

      function renderUserMessage(message, uniqueId) {
        const userMessageHtml = chatStripe(false, message, uniqueId);
        chatContainer.insertAdjacentHTML("beforeend", userMessageHtml);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      async function handleSubmit(e, resubmit = false) {
        if (e) e.preventDefault();

        const submitBtn = document.getElementById("submit-btn");
        submitBtn.disabled = true; // Disable the submit button
        isPendingResponse = true; // Set isPendingResponse to true

        const userPrompt = {
          role: "user",
          content: escape(promptInput.value),
          type: "text",
        };

        const uniqueId = generateUniqueId();
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
          renderUserMessage(userPrompt, uniqueId);
          chatHistory.push(userPrompt);
        }

        renderChatHistory();

        if (activeConversation === null) {
          const newConversation = {
            id: generateUniqueId(),
            messages: [...chatHistory],
          };
          activeConversation = newConversation.id;
          activeConv = newConversation; // Add this line to update the activeConv object
          conversations.push(newConversation);
          localStorage.setItem("activeConversation", activeConversation); // Set activeConversation in local storage
          updateStartMessageDisplay();
          renderConversationList();
        }

        form.reset();

        // Create a new message element
        const newMessage = document.createElement("div");
        if (isImage) {
          newMessage.innerHTML = `
    <div class="wrapper ai">
      <div class="chat">
        <div class="profile">
          <img src="/assets/bot.svg" alt="/assets/bot.svg" />
        </div>
        <div class="image-loader-container">
          <div class="image-loader"></div>
          <div class="message" id=${uniqueId}></div>
        </div>
      </div>
    </div>`;
        } else {
          newMessage.innerHTML = chatStripe(true, { content: "" }, uniqueId);
        }

        // Append the new message element to the chatContainer
        chatContainer.appendChild(newMessage);

        // Update the conversation list item with the icon
        const listItem = document.getElementById(
          `conversation-${activeConversation}`
        );
        if (listItem) {
          const textContent = listItem.querySelector(".text-content");
          if (textContent) {
            textContent.textContent = userPrompt.content;
          } else {
            listItem.innerHTML = `
        <i class="material-icons">chat_bubble_outline</i>
        <span class="text-content">${userPrompt.content}</span>
      `;
          }
        }
        if (activeConv) activeConv.messages = [...chatHistory];

        const userUid = auth.currentUser.uid;

        chatContainer.scrollTop = chatContainer.scrollHeight;

        const messageDiv = document.getElementById(uniqueId);
        try {
          if (!isImage) {
            loader(messageDiv);
          }

          const FETCH_TIMEOUT = 35000;
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
                userPrompt: userPrompt,
                type: isImage ? "image" : "text",
                activeConversation: activeConversation,
                userId: userUid,
              }),
            },

            FETCH_TIMEOUT
          );

          clearInterval(loadInterval);
          messageDiv.innerHTML = "";

          if (response.status === 200) {
            const data = await response.json();
            const parsedData = data.bot.trim();

            const receivedType = data.type;

            let receivedContent;
            if (receivedType === "image") {
              receivedContent = data.images;
              messageDiv.innerHTML = generateImageElements(receivedContent);
              receivedContent.forEach((imageUrl, index) => {
                const imgElement = document.getElementById(
                  `response-image-${index}`
                );
                handleImageLoad(imageUrl, imgElement);
              });
            } else {
              receivedContent = data.bot.trim();
              messageDiv.innerHTML = "";
              typeText(messageDiv, parsedData);
            }

            const receivedMessage = {
              role: "system",
              content: receivedContent,
              type: receivedType,
              uniqueId: uniqueId,
            };

            chatHistory.push(receivedMessage);

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
                    textContent.textContent = userPrompt.content;
                  } else {
                    listItem.innerHTML = `
                <i class="material-icons">chat_bubble_outline</i>
                <span class="text-content">${userPrompt.content}</span>
              `;
                  }
                }
              }
            }
            document.getElementById("regenerate-response-btn").style.display =
              "block";
          } else {
            const errorData = await response.json(); // Get the error data from the response
            let errorMessage =
              errorData.error || "An error occurred. Please try again.";

            if (response.status === 429) {
              errorMessage =
                "Rate limit exceeded. Please try again in 20 seconds.";
            }

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
              : "An error #1 occurred. Please try again.";
          messageDiv.innerHTML = errorMessage;
          messageDiv.classList.add("error"); // Add the 'error' class to the message

          // Add the error message to chatHistory and activeConv.messages arrays
          chatHistory.push({ role: "system", content: errorMessage });
          if (activeConv) {
            activeConv.messages.push({ role: "system", content: errorMessage });
          }

          document.getElementById("regenerate-response-btn").style.display =
            "block";
          lastPrompt = userPrompt.content;
        } finally {
          isPendingResponse = false;
          if (!promptInput.value.trim()) {
            submitBtn.disabled = true;
          } else {
            submitBtn.disabled = false;
          }
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
  background-color: #949494;
  color: #101011;
}
.tab:hover {
  background-color: #b9b9b9;
}

.tab.active {
  background-color: #4fefff;
}

.image-loader-container {
  border-radius: 8px;
  display: flex;
  position: relative;
  width: 256px;
  /* Adjust the width of the bounding box as needed */
  height: 256px;
  /* Adjust the height of the bounding box as needed */
  background-color: #f0f0f0;
  /* Optional: Set a background color for the bounding box */

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

.response-image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  position: absolute;
  top: 0;
  left: 0;
}

#error-div {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
}

#retry-btn {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

#retry-btn:hover {
  background-color: #0056b3;
}
</style>
