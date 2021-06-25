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

    // Respond with the lobby's id
    io.to(socket.id).emit("response lobby created", lobby.id);
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
    Player.create(socket, name, lobby.id);
    lobby.addPlayer(socket);

    io.to(socket.id).emit("response lobby joined", lobby.id);
  });


  socket.on("debug", () => {
    // This will be used for debugging specific emitters or listeners
  });

  socket.on('disconnect', () => {
    //console.log("socket disconnected");
  });
}