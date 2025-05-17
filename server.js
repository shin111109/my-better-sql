const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Database setup
const db = new Database('chat.db');

// Ensure messages table exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room TEXT,
    username TEXT,
    message TEXT,
    timestamp TEXT
  )
`).run();

app.use(express.static(path.join(__dirname, 'public')));

const users = {}; // socket.id => { username, room }

function sendActiveRooms() {
  const rows = db.prepare('SELECT DISTINCT room FROM messages').all();
  const rooms = rows.map(r => r.room);
  io.emit('active rooms', rooms);
}

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join room', ({ username, room }) => {
    socket.join(room);
    users[socket.id] = { username, room };

    socket.to(room).emit('user joined', username);

    // Send chat history
    const rows = db.prepare(
      'SELECT username, message, timestamp FROM messages WHERE room = ? ORDER BY timestamp ASC'
    ).all(room);

    socket.emit('chat history', rows);
    sendActiveRooms();
  });

  socket.on('leave room', ({ username, room }) => {
    socket.leave(room);
    socket.to(room).emit('user left', username);
  });

  socket.on('chat message', ({ username, message }) => {
    const user = users[socket.id];
    if (user && user.room) {
      const timestamp = new Date().toISOString();

      db.prepare(
        'INSERT INTO messages (room, username, message, timestamp) VALUES (?, ?, ?, ?)'
      ).run(user.room, username, message, timestamp);

      io.to(user.room).emit('chat message', {
        username,
        message,
        timestamp
      });
    }
  });

  socket.on('delete messages', ({ room }) => {
    db.prepare('DELETE FROM messages WHERE room = ?').run(room);
    io.to(room).emit('messages deleted', room);
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      socket.to(user.room).emit('user left', user.username);
      delete users[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
