const Player = require('./player').Player;
const Lobby = require('./lobby').Lobby;
const Game = require('./game').Game;
const io = require('../app').io

module.exports = socketHandler = (socket) => {
  
  /**
   * Depending on the type of socket communication, prepend emitter messages with:
   * 
   * "request:" - For clients sending requests
   * "response:" - For server responding to requests
   * "update:" - For server emitting a message without the client specifically requesting it
   * "error:" - For when the server encounters a client or server error
   * 
   */

  // Create a new lobby/lobby and add the player to it 
  socket.on("request: create lobby", (name) => {
    
    // First check if the player has entered a name
    if (!Player.validName(name)) {
      io.to(socket.id).emit("error:", "Please input a valid name");
      return;
    }

    var lobby = Lobby.createLobby(io);
    Player.create(socket, name, lobby.id);
    lobby.addSocket(socket);

    // Move the socket to a room specifically for that lobby
    socket.join("lobby" + lobby.id);

    // Respond with the lobby's id
    var result = lobby.getArrayOfPlayersWithoutSockets();
    io.to(socket.id).emit("response: lobby created", socket.player, lobby.id, result[0], result[1]);
  });


  socket.on("request: join lobby", (name, id) => {
    
    // First check if the player has entered a name
    if (!Player.validName(name)) {
      io.to(socket.id).emit("error:", "Please input a valid name");
      return;
    }
    // Then check to ensure id has been added
    if (id === null || id === undefined) {
      io.to(socket.id).emit("error:", "No lobby id was provided");
      return;      
    }
    
    var lobby = Lobby.getLobby(id);

    if (lobby === undefined || lobby === null) {
      io.to(socket.id).emit("error:", "Lobby " + id + " doesn't exist", id);
      return;
    }

    Player.create(socket, name, lobby.id);
    lobby.addSocket(socket);

    // Have the socket join the lobby's socket.io room
    socket.join("lobby" + lobby.id);
    io.to(socket.id).emit("response: lobby joined", lobby.id, socket.player);

    // Emit this messsage to notyify all sockets in the lobby that a new player has joined
    var result = lobby.getArrayOfPlayersWithoutSockets();
    io.to("lobby" + lobby.id).emit("update: player joined", socket.player, result[0], result[1]);
  });


  socket.on('debug', () => {
    // This will be used for debugging specific emitters or listeners
  });

  
  // When a user disconnects, inform the other clients
  socket.on('disconnect', () => {
    if (socket.hasOwnProperty("player")) {
      // Remove player from lobby
      var lobby = Lobby.getLobby(socket.player.lobbyId);
      lobby.removePlayer(socket);

      // Inform the other clients that player has disconnected
      var result = lobby.getArrayOfPlayersWithoutSockets();
      io.to("lobby" + socket.player.lobbyId).emit("update: player left", result[0], result[1]);
    }
  });

  socket.on("get: id", () => {
    return socket.id;
  });
}