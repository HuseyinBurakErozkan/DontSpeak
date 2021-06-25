const Player = require('./player').Player;
const Lobby = require('./lobby').Lobby;

module.exports = socketHandler = (io, socket) => {
  //console.log('socket connected');

  // Create a new lobby/lobby and add the player to it 
  socket.on("request create game", (name) => {
    
    // First check if the player has entered a name
    if (!Player.validName(name)) {
      io.to(socket.id).emit("error", "Please input a valid name");
      return;
    }

    var lobby = Lobby.createLobby(socket);
    Player.create(socket, name, lobby.id);

    // Move the socket to a room specifically for that lobby
    socket.join("lobby" + lobby.id);

    // Respond with the lobby's id
    var result = lobby.getArrayOfPlayersWithoutSockets();
    io.to(socket.id).emit("response lobby created", lobby.id, result[0], result[1]);
  });


  socket.on("request join game", (name, id) => {
    
    // First check if the player has entered a name
    if (!Player.validName(name)) {
      io.to(socket.id).emit("error", "Please input a valid name");
      return;
    }
    // Then check to ensure id has been added
    if (id === null || id === undefined) {
      io.to(socket.id).emit("error", "No lobby id was provided");
      return;      
    }
    
    var lobby = Lobby.getLobby(id);

    if (lobby === undefined || lobby === null) {
      io.to(socket.id).emit("error", "That lobby doesn't exist", id);
      return;
    }

    Player.create(socket, name, lobby.id);
    lobby.addPlayer(socket);

    // Have the socket join the lobby's socket.io room
    socket.join("lobby" + lobby.id);
    io.to(socket.id).emit("response lobby joined", lobby.id);

    // Emit this messsage to notify all sockets in the lobby that a new player has joined
    var result = lobby.getArrayOfPlayersWithoutSockets();
    io.to("lobby" + lobby.id).emit("update: player joined", socket.player, result[0], result[1]);
  });



  socket.on('request change team', (roomId) => {
    console.log("changing player's team");
  });


  socket.on('debug', () => {
    // This will be used for debugging specific emitters or listeners
  });

  socket.on('disconnect', () => {
    //console.log("socket disconnected");
  });
}