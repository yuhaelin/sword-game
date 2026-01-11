const socket = io();
const input = document.getElementById("input");
const chat = document.getElementById("chat");

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = `bubble ${type}`;
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

socket.on("message", (data) => {
  addMessage(data.text, data.type);
});

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  socket.emit("command", text);
  input.value = "";
}

function sendCommand(cmd) {
  socket.emit("command", cmd);
}

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});