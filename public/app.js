const socket = io();

const loginScreen = document.querySelector("#loginScreen");
const chatScreen = document.querySelector("#chatScreen");
const loginForm = document.querySelector("#loginForm");
const usernameInput = document.querySelector("#usernameInput");
const loginError = document.querySelector("#loginError");

const currentUserName = document.querySelector("#currentUserName");
const onlineCount = document.querySelector("#onlineCount");
const usersList = document.querySelector("#usersList");
const messages = document.querySelector("#messages");

const messageForm = document.querySelector("#messageForm");
const messageInput = document.querySelector("#messageInput");

let username = "";

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const value = usernameInput.value.trim();

  if (value.length < 2) {
    loginError.textContent = "El nombre debe tener al menos 2 caracteres.";
    return;
  }

  username = value;
  currentUserName.textContent = username;

  socket.emit("user:join", username);

  loginScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");

  messageInput.focus();
});

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();

  if (!text) return;

  socket.emit("chat:message", text);
  messageInput.value = "";
  messageInput.focus();
});

socket.on("users:update", (users) => {
  onlineCount.textContent = users.length;

  usersList.innerHTML = users
    .map((user) => `<li><span></span>${escapeHtml(user)}</li>`)
    .join("");
});

socket.on("chat:history", (history) => {
  messages.innerHTML = "";

  history.forEach((message) => {
    addChatMessage(message);
  });
});

socket.on("chat:message", (message) => {
  addChatMessage(message);
});

socket.on("system:message", (message) => {
  const article = document.createElement("article");
  article.className = "system-message";
  article.textContent = `${message.time} · ${message.text}`;

  messages.appendChild(article);
  scrollMessages();
});

socket.on("system:error", (message) => {
  loginError.textContent = message;
});

function addChatMessage(message) {
  const article = document.createElement("article");
  article.className = "chat-message";

  article.innerHTML = `
    <header>
      <strong>${escapeHtml(message.user)}</strong>
      <span>${escapeHtml(message.time)}</span>
    </header>
    <p>${escapeHtml(message.text)}</p>
  `;

  messages.appendChild(article);
  scrollMessages();
}

function scrollMessages() {
  messages.scrollTop = messages.scrollHeight;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}