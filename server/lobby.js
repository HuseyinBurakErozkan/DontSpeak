/**
 * This file contains all lobby-related routes and methods
 */
const path = require('path');
const CLIENT_DIR = path.join(__dirname, '../client');

var lobbies = [];


/**
 * 
 * @param {*} app The express app. Passed as an argument to allow the lobby object to perform routing 
 * @param {*} io The socket.io server. Required to be passed as an argument to allow lobby 
 * to perform socket.io related functions
 */
function Lobby(app, io) {

  // Dictionary datatype, with the key being the client socket id, and the value being
  // the socket object with player-relayed information attached
  this.players = [];
  this.id = Math.floor(Math.random()*9000) + 1000;


  this.addPlayer = (player) => {
    this.players.push({
      key: player.id,
      value: player
    })
  };


  this.getPlayer = (playerId) => {
    // They key is the id, whereas the value is the object itself
    return this.players.find(p => p.key == playerId).value;
  };

  
  this.startGame = () => {
    if (this.players.length < 4) {
      return false; // Don't allow the game to start, as at least 4 players are needed
    } else {
      // TODO: Do something. Start the game
    }
  }

  io.on("connection", (socket) => {
    // Add socket.io related stuff here
  });
}

Lobby.createLobby = (socket, app, io) => {
  var lobby = new Lobby(app, io);
  lobby.addPlayer(socket);

  lobbies.push({
    key: lobby.id,
    value: lobby
  });


  return lobby;
}

Lobby.getLobby = (id) => {
  // Note that the lobby's id is stored as a key in the dict, so compare l.key to id
  var lobby = lobbies.find(l => l.key == id);

  // Return the value, which is the lobby object itself
  return lobby.value;
}

Lobby.getCount = () => {
  return lobbies.length;
}

// NOTE: Used only for testing purposes
Lobby.emptyLobbiesArray = () => {
  lobbies = [];
}



module.exports = {
  Lobby: Lobby,
}
