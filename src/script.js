import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import { database } from "./firebase"; // You already have this file
import { auth } from "./firebase";

export default function () {
  const conversationList = document.getElementById("conversation-list");
  const clearHistoryBtn = document.getElementById("clear-chatHistory-btn");
  const confirmationModal = document.getElementById("confirmation-modal");
  const confirmClearHistoryBtn = document.getElementById(
    "confirm-clear-history"
  );
  const cancelClearHistoryBtn = document.getElementById("cancel-clear-history");

  const chatContainer = document.querySelector("#chat_container");
  const startMessage = document.getElementById("start-message");
  const drawerBtn = document.getElementById("drawer-btn");
  const overlay = document.getElementById("overlay");
  const sidebar = document.querySelector(".sidebar");

  const form = document.getElementById("chat-form");
  const promptInput = document.querySelector('textarea[name="prompt"]');
  const submitBtn = document.getElementById("submit-btn");

  promptInput.addEventListener("input", () => {
    if (promptInput.value.trim() === "") {
      submitBtn.disabled = true;
    } else {
      submitBtn.disabled = false;
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // your submit code here
  });

  function handlePromptInput() {
    if (promptInput.value.trim() === "") {
      submitBtn.disabled = true;
    } else {
      submitBtn.disabled = false;
    }
  }

  promptInput.addEventListener("input", handlePromptInput);

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

  let loadInterval;

  // Get activeConversation from local storage
  let activeConversation = localStorage.getItem("activeConversation");

  // Set the active conversation style

  function setActiveConversationStyle(conversationId) {
    console.log("setActiveConversationStyle called with:", conversationId);
    const allItems = document.querySelectorAll(".conversation-list-item");
    allItems.forEach((item) => {
      if (item.id === conversationId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  document.querySelectorAll(".conversation-list-item").forEach((item) => {
    item.addEventListener("click", () => {
      const conversationId = item.id;
      activeConversation = conversationId;

      setActiveConversationStyle(conversationId);
    });
  });

  // ... other code

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

    return `
<div class="wrapper ${aiClass} ${listItemClass}">
  <div class="chat">
    <div class="profile">
      <img
        src=${isAi ? "../src/assets/bot.svg" : "../src/assets/user.svg"}
        alt="${isAi ? "../src/assets/bot.svg" : "../src/assets/user.svg"}"
      />
    </div>
    <div class="message ${errorClass}" id=${uniqueId}>${icon}${
      message.content
    }</div>
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
    const conversationList = document.getElementById("conversation-list");
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

  const newChatBtn = document.getElementById("new-chat-btn");
  newChatBtn.addEventListener("click", handleNewChatBtnClick);

  function renderChatHistory() {
    chatContainer.innerHTML = "";
    for (const message of chatHistory) {
      const isAi = message.role === "system";
      chatContainer.innerHTML += chatStripe(
        isAi,
        message,
        message.uniqueId || null
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

  function loader(element) {
    element.textContent = "";
    loadInterval = setInterval(() => {
      element.textContent += ".";
      if (element.textContent === "....") {
        element.textContent = "";
      }
    }, 300);
  }

  function timeout(ms) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request took too long")), ms)
    );
  }

  function getActiveConversationMessages() {
    const activeConv = conversations.find(
      (conv) => conv.id === activeConversation
    );
    return activeConv ? activeConv.messages : [];
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const userPrompt = data.get("prompt");

    if (!userPrompt.trim()) {
      return; // Do nothing if input is empty or only contains whitespace
    }

    chatHistory.push({ role: "user", content: userPrompt });
    chatContainer.innerHTML += chatStripe(false, { content: userPrompt }, null);

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
    chatContainer.innerHTML += chatStripe(true, "", uniqueId);
    const activeConv = conversations.find(
      (conv) => conv.id === activeConversation
    );
    if (activeConv) activeConv.messages = chatHistory;

    // Update the conversation list item with the icon
    const listItem = document.getElementById(
      `conversation-${activeConversation}`
    );
    if (listItem) {
      const textContent = listItem.querySelector(".text-content");
      if (textContent) {
        textContent.textContent = userPrompt;
      } else {
        listItem.innerHTML = `
    <i class="material-icons">chat_bubble_outline</i>
    <span class="text-content">${userPrompt}</span>
  `;
      }
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;

    const messageDiv = document.getElementById(uniqueId);
    try {
      loader(messageDiv);

      const FETCH_TIMEOUT = 25000; // 15 seconds

      console.log(chatHistory);

      const response = await fetchWithTimeout(
        "https://chat-cbd.onrender.com",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            chatHistory: chatHistory,
          }),
        },
        FETCH_TIMEOUT
      );

      clearInterval(loadInterval);
      messageDiv.innerHTML = "";

      if (response.ok) {
        const data = await response.json();
        const parsedData = data.bot.trim();
        chatHistory.push({ role: "system", content: parsedData });

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
                textContent.textContent = userPrompt;
              } else {
                listItem.innerHTML = `
    <i class="material-icons">chat_bubble_outline</i>
    <span class="text-content">${userPrompt}</span>
  `;
              }
            }
          }
        }

        typeText(messageDiv, parsedData);
        updateFirebaseAndRender();
      } else {
        const errorMessage = "An error occurred. Please try again.";
        messageDiv.innerHTML = errorMessage;
        messageDiv.classList.add("error"); // Add the 'error' class to the message
        chatHistory.push({ role: "system", content: errorMessage });
      }
    } catch (error) {
      clearInterval(loadInterval);
      const errorMessage =
        error.message === "Request timed out"
          ? "Request timed out. Please try again."
          : "An error occurred. Please try again.";
      messageDiv.innerHTML = errorMessage;
      messageDiv.classList.add("error"); // Add the 'error' class to the message
      chatHistory.push({ role: "system", content: errorMessage });
    }
  };

  form.onsubmit = handleSubmit;

  promptInput.addEventListener("keydown", (e) => {
    if (e.keyCode === 13) {
      handleSubmit(e);
    }
  });

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
}
