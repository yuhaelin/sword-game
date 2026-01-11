const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const players = {}; 
// { socketId: { name, level } }

function enhanceRate(level) {
  if (level < 10) return 0.8;
  if (level < 15) return 0.5;
  if (level < 16) return 0.3;
  if (level < 18) return 0.15;
  if (level < 20) return 0.05;
  return 0;
}

io.on("connection", socket => {

  socket.on("join", name => {
    players[socket.id] = { name, level: 0 };
    io.emit("log", `📥 ${name}님이 들어왔습니다`);
  });

  socket.on("disconnect", () => {
    const p = players[socket.id];
    if (p) {
      io.emit("log", `📤 ${p.name}님이 나갔습니다`);
      delete players[socket.id];
    }
  });

  socket.on("enhance", () => {
    const p = players[socket.id];
    if (!p || p.level >= 20) return;

    const rate = enhanceRate(p.level);
    if (Math.random() < rate) {
      p.level++;
      io.emit("log", `🔨 ${p.name} 강화 성공! +${p.level}`);
    } else {
      io.emit("log", `❌ ${p.name} 강화 실패`);
    }
  });

  socket.on("battle", targetName => {
    const me = players[socket.id];
    if (!me) return;

    const others = Object.values(players).filter(p => p.name !== me.name);
    if (others.length === 0) {
      socket.emit("log", "상대가 없습니다.");
      return;
    }

    const enemy = targetName
      ? others.find(p => p.name === targetName)
      : others[Math.floor(Math.random() * others.length)];

    if (!enemy) {
      socket.emit("log", "해당 유저가 없습니다.");
      return;
    }

    const diff = me.level - enemy.level;
    let winRate = 0.5 + diff * 0.05;
    winRate = Math.max(0.1, Math.min(0.9, winRate));

    if (Math.random() < winRate) {
      io.emit("log", `⚔️ ${me.name} vs ${enemy.name} → ${me.name} 승리`);
    } else {
      io.emit("log", `⚔️ ${me.name} vs ${enemy.name} → ${enemy.name} 승리`);
    }
  });

});

server.listen(3000, () => {
  console.log("서버 실행중 → http://localhost:3000");
});