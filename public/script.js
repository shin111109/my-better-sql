const socket = io();

const loginForm = document.getElementById('login-form');
const chatForm = document.getElementById('chat-form');
const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const usernameInput = document.getElementById('username');
const roomInput = document.getElementById('room');
const messageInput = document.getElementById('message');
const messagesEl = document.getElementById('messages');
const container = document.getElementById('container');

const deleteBtn = document.getElementById('delete-messages');

let username = '';
let room = '';
let hasJoined = false;

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  username = usernameInput.value.trim();
  room = roomInput.value.trim();

  if (username && room) {
    socket.emit('join room', { username, room });
    hasJoined = true;


    loginSection.style.display = 'none';
    chatSection.style.display = 'block';
    deleteBtn.style.display = 'block';
    container.style.display = 'flex';
  }
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message && hasJoined) {
    socket.emit('chat message', { username, message });
    messageInput.value = '';
  }
});

function switchRoom(newRoom) {
  if (newRoom !== room && username) {
    socket.emit('leave room', { username, room });
    room = newRoom;
    socket.emit('join room', { username, room });

    messagesEl.innerHTML = '';
    roomDisplay.textContent = room;
  }
}

deleteBtn.addEventListener('click', () => {
  if (confirm(`Delete all messages in room "${room}"?`)) {
    socket.emit('delete messages', { room });
  }
});

socket.on('chat history', (messages) => {
  messagesEl.innerHTML = '';
  messages.forEach(({ username, message, timestamp }) => {
    appendMessage(`${formatTime(timestamp)} - ${username}: ${message}`);
  });
});

socket.on('chat message', ({ username, message, timestamp }) => {
  appendMessage(`${formatTime(timestamp)} - ${username}: ${message}`);
});

socket.on('user joined', (user) => {
  appendNotification(`${user} joined the room`);
});

socket.on('user left', (user) => {
  appendNotification(`${user} left the room`);
});

socket.on('messages deleted', (roomName) => {
  if (roomName === room) {
    messagesEl.innerHTML = '';
    appendNotification(`All messages in "${room}" have been deleted.`);
  }
});


function appendMessage(msg) {
  const li = document.createElement('li');
  li.textContent = msg;
  messagesEl.appendChild(li);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendNotification(msg) {
  const li = document.createElement('li');
  li.textContent = msg;
  li.style.fontStyle = 'italic';
  li.style.color = '#555';
  messagesEl.appendChild(li);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function addMessage(text) {
  const li = document.createElement('li');
  li.textContent = text;
  messages.appendChild(li);

  // Scroll to bottom
  messages.scrollTop = messages.scrollHeight;
}