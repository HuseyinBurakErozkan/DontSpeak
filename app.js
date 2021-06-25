const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Allow client-side JS and CSS files to be served
app.use(express.static('client/public'));

require('./server/game')(app);

const Player = require('./server/player').Player;
const Lobby = require('./server/lobby').Lobby;
//const socketHandler = require('./server/sockethandler');


// Handle the initial client connection
io.on('connection', (socket) => {
  require('./server/sockethandler')(io, socket);
});


// Export the express app io so it can be used when testing route-related functions, as well
// as other functions that may require it passed as an argument (the lobby object for example)
module.exports.app = app;
module.exports.io = io;

module.exports.server = server.listen(3000, () => {
  console.log("listening on *:3000");
});
