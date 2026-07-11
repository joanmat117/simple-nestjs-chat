const socket = io("/", {
  path: "/chat"
});

// Events Constants
const Events = {
  ADD_MESSAGE: "add_message",
  NEW_MESSAGE: "new_message",
  CHAT_STATE: "chat_state"
};

// DOM Elements
const messagesContainer = document.getElementById("messages");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");

// Format timestamp
function formatTime(date) {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Append message to chat
function appendMessage(data, skipScroll = false) {
  // Remove empty state message if exists
  const emptyState = messagesContainer.querySelector(".text-center");
  if (emptyState) {
    emptyState.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = "flex flex-col";

  messageDiv.innerHTML = `
    <div class="bg-gray-600 rounded-lg px-4 py-3 max-w-[80%]">
      <div class="text-xs text-gray-400 mb-1">${data.ip}</div>
      <div class="text-white">${escapeHtml(data.message)}</div>
      <div class="text-xs text-gray-500 mt-1 text-right">${formatTime(new Date(data.date))}</div>
    </div>
  `;

  messagesContainer.appendChild(messageDiv);
  if (!skipScroll) scrollToBottom();
}

// Append error message
function appendError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "flex justify-center";

  errorDiv.innerHTML = `
    <div class="bg-red-900/50 text-red-300 text-sm px-4 py-2 rounded-lg border border-red-700">
      ⚠️ ${escapeHtml(message)}
    </div>
  `;

  messagesContainer.appendChild(errorDiv);
  scrollToBottom();

  // Remove error after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Scroll to bottom of messages
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Update connection status
function updateStatus(connected) {
  if (connected) {
    statusDot.className = "w-2 h-2 rounded-full bg-green-500";
    statusText.textContent = "Conectado";
  } else {
    statusDot.className = "w-2 h-2 rounded-full bg-red-500";
    statusText.textContent = "Desconectado";
  }
}

// Socket.IO Events
socket.on("connect", () => {
  console.log("Connected to server");
  updateStatus(true);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
  updateStatus(false);
});

socket.on(Events.NEW_MESSAGE, (data) => {
  console.log("Message received:", data);
  appendMessage(data);
});

socket.on(Events.CHAT_STATE, (data) => {
  console.log("Chat state:", data);
  updateChatStats(data);

  // Load initial messages on first connection
  if (data.initialMessages?.length) {
    data.initialMessages.forEach(msg => appendMessage(msg, true));
    scrollToBottom();
  }
});

socket.on("exception", (error) => {
  console.error("Server exception:", error);
  const message = error.message || "Error desconocido";
  appendError(message);
});

// Form submit handler
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const message = messageInput.value.trim();

  if (!message) return;

  socket.emit(Events.ADD_MESSAGE, { message }, (response) => {
    console.log("Server response:", response);
    if (response?.isSuccess) {
      messageInput.value = "";
      messageInput.focus();
    }
  });
});

// Update chat stats (handles partial updates)
function updateChatStats(data) {
  const totalMessagesEl = document.getElementById("total-messages");
  const totalUsersEl = document.getElementById("total-users");

  if (data.totalMessages !== undefined && totalMessagesEl) {
    totalMessagesEl.textContent = data.totalMessages;
  }
  if (data.totalUsers !== undefined && totalUsersEl) {
    totalUsersEl.textContent = data.totalUsers;
  }
}

// Focus input on load
messageInput.focus();
