const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const path = require('path');
const client_dir = path.join(__dirname, './client');

app.set('view engine', 'pug')
app.set('views','./views');

// Allow client-side JS and CSS files to be served
app.use(express.static('client/public'));


// Handle the initial client connection to server
io.on('connection', (socket) => {
  require('./server/sockethandler')(socket);
});


app.get('/', (req, res) => {
  res.render('index', { title: "Don't speak", screen: "main"})
});

// Export the express app io so it can be used when testing route-related functions, as well
// as other functions that may require it passed as an argument (the lobby object for example)
module.exports.io = io;

// Export the server so it can be used for testing
module.exports.server = server.listen(3000, () => {
  console.log("listening on *:3000");
});

