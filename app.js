const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Allow client-side JS and CSS files to be served
app.use(express.static('client/public'));

require('./server/game')(app);
const lobbyModule = require('./server/lobby');
let Lobby = lobbyModule.Lobby;


// Handle the initial client connection
io.on('connection', (socket) => {

  // Create a new lobby/lobby and add the player to it 
  socket.on("request create game", (name) => {
    
    // First check if the player has entered a name
    if (name === null || name === undefined || name.replace(/\s/g, "") == "") {
      io.to(socket.id).emit("error", "Please input a valid name");
      return;
    }

    attachPlayerInfo(socket, name);
    var lobby = Lobby.createLobby(socket, app, io);

    // Respond with the lobby's id
    io.to(socket.id).emit("response lobby created", lobby.id);
  });


  socket.on("request join game", (name, id) => {
    
    // First check if the player has entered a name
    if (name === null || name === undefined || name.replace(/\s/g, "") == "") {
      io.to(socket.id).emit("error", "Please input a valid name");
      return;
    }
    // Then check to ensure id has been added
    if (id === null || id === undefined) {
      io.to(socket.id).emit("error", "No lobby id was provided");
      return;      
    }
    
    var lobby = Lobby.getLobby(id);
    attachPlayerInfo(socket, name);
    lobby.addPlayer(socket);

    io.to(socket.id).emit("response lobby joined", lobby.id);
  });


  socket.on("debug", () => {
    // This will be used for debugging specific emitters or listeners
  })
});


/**
 * Attach player's information to the socket, so that it can better represet the player.
 * Only has player name for now, but may be extended in the future.
 * @param {*} socket The socket representing the player's connection 
 * @param {*} name The name of the player
 */
function attachPlayerInfo(socket, name) {
  socket.playerName = name;
}

// Export the express app io so it can be used when testing route-related functions, as well
// as other functions that may require it passed as an argument (the lobby object for example)
module.exports.app = app;
module.exports.io = io;

module.exports.server = server.listen(3000, () => {
  console.log("listening on *:3000");
});

