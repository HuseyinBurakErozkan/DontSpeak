/**
 * This file contains all room-related routes and methods
 */
const path = require('path');
const CLIENT_DIR = path.join(__dirname, '../client');

/**
 * 
 * @param {*} app The express app. Passed as an argument to allow the room object to perform routing 
 * @param {*} io The socket.io server. Required to be passed as an argument to allow room 
 * to perform socket.io related functions
 */
function Room(app, io) {

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


module.exports = {
  Room: Room
}
