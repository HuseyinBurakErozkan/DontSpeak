const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);



// Allow client-side JS and CSS files to be served
app.use(express.static('client/public'));

require('./server/game')(app);
require('./server/room')(app, io);

io.on('connection', function(socket){
  socket.on('message', function(msg){
    io.sockets.emit('message', msg)
  });
});

// io.on('connection', (socket) => {
//   console.log('A new user connected');
  
//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });

// });

exports.server = server.listen(3000, () => {
  console.log('listening on *:3000');
});