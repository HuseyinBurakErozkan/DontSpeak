/**
 * This file contains all room-related routes and methods
 */
const path = require('path');

const CLIENT_DIR = path.join(__dirname, '../client');

var rooms = [];


module.exports = function(app, io) {

  io.on("connection", (socket) => {
    socket.on("request create game", (name) => {
      console.log(name + " has requested to create a game");

      // Create a new room and add it to the list of rooms currently running in the server
      let room = {
        id: generateRoomNumber,
        players: [],
        status: 'lobby'
      }

      rooms.push({
        key: room.id,
        value: room
      })
    });

    socket.on("request join game", (name, roomId) => {
      console.log(name + "has requested to join game " + roomId);
    })
  });
}


function addPlayerToRoom() {
  console.log('Adding player to room. Socket id: ', socket);
}


function generateRoomNumber() {
  return Math.floor(Math.random()*90000) + 1000;
}
