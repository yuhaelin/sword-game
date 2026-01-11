const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const players = {};

function enhanceChance(level) {
  if (level < 10) return 0.8;
  if (level < 13) return 0.6;
  if (level < 16) return 0.4;
  if (level < 18) return 0.25;
  return 0.1;
}

io.on("connection", (socket) => {
  let nickname = "플레이어" + Math.floor(Math.random() * 1000);

  players[socket.id] = { name: nickname, level: 0 };

  io.emit("message", {
    text: `${nickname}님이 들어왔습니다`,
    type: "system",
  });

  socket.on("command", (cmd) => {
    const player = players[socket.id];
    if (!player) return;

    if (cmd === "/강화") {
      if (player.level >= 20) {
        socket.emit("message", {
          text: "이미 20강입니다!",
          type: "system",
        });
        return;
      }

      const chance = enhanceChance(player.level);
      if (Math.random() < chance) {
        player.level++;
        io.emit("message", {
          text: `${player.name} 강화 성공! 🔥 +${player.level}`,
          type: "system",
        });
      } else {
        io.emit("message", {
          text: `${player.name} 강화 실패 💥`,
          type: "system",
        });
      }
    }

    if (cmd.startsWith("/배틀")) {
      const ids = Object.keys(players).filter((id) => id !== socket.id);
      if (ids.length === 0) {
        socket.emit("message", {
          text: "배틀할 상대가 없습니다",
          type: "system",
        });
        return;
      }

      const enemyId = ids[Math.floor(Math.random() * ids.length)];
      const enemy = players[enemyId];

      let winChance = 0.5;
      if (player.level > enemy.level) winChance = 0.7;
      if (player.level < enemy.level) winChance = 0.3;

      const winner =
        Math.random() < winChance ? player.name : enemy.name;

      io.emit("message", {
        text: `⚔️ ${player.name} vs ${enemy.name} → ${winner} 승리!`,
        type: "system",
      });
    }
  });

  socket.on("disconnect", () => {
    if (players[socket.id]) {
      io.emit("message", {
        text: `${players[socket.id].name}님이 나갔습니다`,
        type: "system",
      });
      delete players[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("서버 실행중");
});