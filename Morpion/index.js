var express = require('express')
var app = express()
app.use(express.static('public'))
const port = process.env.PORT || 5001
var http = require('http').createServer(app);
var io = require('socket.io')(http);

http.listen(port)
console.log(`Serveur WebSocket en cours d'exécution sur le port ${port}`);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});


var players = {},
  unmatched;


io.sockets.on("connection", function (socket) {
    console.log("socket connected")
  socket.emit('connect',{msg:"hello"})
  joinGame(socket);

  socket.on('reload', () => {
    // Émettez un événement "reload" vers tous les clients connectés, y compris l'expéditeur
    io.emit('reload');
});

  if (getOpponent(socket)) {
    socket.emit("game.begin", {
      symbol: players[socket.id].symbol,
    });
    getOpponent(socket).emit("game.begin", {
      symbol: players[getOpponent(socket).id].symbol,
    });
  }

  socket.on("make.move", function (data) {
    if (!getOpponent(socket)) {
      return;
    }
    socket.emit("move.made", data);
    getOpponent(socket).emit("move.made", data);
  });

  socket.on("disconnect", function () {
    if (getOpponent(socket)) {
      getOpponent(socket).emit("opponent.left");
    }
  });
});

function joinGame(socket) {
  players[socket.id] = {
    opponent: unmatched,

    symbol: "X",
    socket: socket,
  };
  if (unmatched) {
    players[socket.id].symbol = "O";
    players[unmatched].opponent = socket.id;
    unmatched = null;
  } else {
    unmatched = socket.id;
  }
}

function getOpponent(socket) {
  if (!players[socket.id].opponent) {
    return;
  }
  return players[players[socket.id].opponent].socket;
}

