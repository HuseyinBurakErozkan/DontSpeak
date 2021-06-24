const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Allow client-side JS and CSS files to be served
app.use(express.static('client/public'));

require('./server/game')(app);
const roomModule = require('./server/room');
let Room = roomModule.Room;


var rooms = [];

// Handle the initial client connection
io.on('connection', (socket) => {

  // Create a new room/lobby and add the player to it 
  socket.on("request create game", (name) => {
    
    // First check if the player has entered a name
    if (name === null || name === undefined || name.replace(/\s/g, "") == "") {
      io.to(socket.id).emit("error", "Please input a valid name");
      return;
    }

    var room = createRoom(socket, name);

    // Respond with the room's id
    io.to(socket.id).emit("response room created", room.id);
  });


  socket.on("request join game", (name, id) => {
    
    // First check if the player has entered a name
    if (name === null || name === undefined || name.replace(/\s/g, "") == "") {
      io.to(socket.id).emit("error", "Please input a valid name");
      return;
    }
    // Then check to ensure id has been added
    if (id === null || id === undefined) {
      io.to(socket.id).emit("error", "No room id was provided");
      return;      
    }
    
    var room = getRoom(id);
    attachPlayerInfo(socket, name);
    room.addPlayer(socket);

    io.to(socket.id).emit("response room joined", room.id);
  });


  socket.on("debug", () => {
    console.log(rooms);
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



function createRoom(socket) {
  var room = new Room(app, io);
  room.addPlayer(socket);
  rooms.push({
    key: room.id,
    value: room
  });

  return room;
}


function getRoom(id) {
  // Note that the room's id is stored as a key in the dict, so compare r.key to id
  var room = rooms.find(r => r.key == id);

  // Return the value, which is the room object itself
  return room.value;
}

function getRoomsCount() {
  return rooms.length;
}

function emptyRoomsArray() {
  rooms = [];
}

// Export functions for testing
module.exports = {attachPlayerInfo, createRoom, getRoom, getRoomsCount, emptyRoomsArray}


// Export the express app io so it can be used when testing route-related functions, as well
// as other functions that may require it passed as an argument (the room object for example)
module.exports.app = app;
module.exports.io = io;

module.exports.server = server.listen(3000, () => {
  console.log("listening on *:3000");
});

