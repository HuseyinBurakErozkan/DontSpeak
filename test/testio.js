'use strict';

const expect = require('chai').expect;
const server = require('../app');
const serverIo = require('../app');
const rooms = require('../server/room');
let Room = rooms.Room;
var assert = require('assert');


const io = require('socket.io-client');
const ioOptions = { 
  transports: ['websocket'],
  forceNew: true,
  reconnection: false
}

var connections = [];


describe('Room creation Events', () => {

  var player;

  beforeEach((done) => {
    player = io("http://localhost:3000/", ioOptions);

    done();
  });

  afterEach((done) => {
    player.disconnect();
    server.emptyRoomsArray();

    done();
  })


  it("New Room should be created and stored in a collection on creation", (done) => {
    
    player.emit("request create game", "testPlayerName");
    player.on("response room created", () => {
      expect(server.getRoomsCount()).to.have.be.at.least(1);
      done();
    })
  });


  it("Newly created room should be able to be found in the collection of rooms", (done) => {
    
    player.emit("request create game", "testPlayerName");
    player.on("response room created", (roomId) => {
      var result = server.getRoom(roomId);
      expect(result).to.not.be.null.and.to.not.be.undefined;
      done();
    })
  });


  it("New room should NOT be created if player hasn't provided a name", (done) => {

    player.emit("request create game", "");
    
    // Server should never respond in this fashion if the player hasn't provided a name
    player.on("response room created", (roomId) => {
      assert.fail();
      done();
    });

    // The correct response would be for the server to emit an error to the user
    player.on("error", (msg) => {
      done(); // Indicate that the test has passed
    });
  })


  it("New room should have generated a 4 digit id on initialisation", (done) => {
    
    player.emit("request create game", "testPlayerName");
    player.on("response room created", (roomId) => {
      var newRoom = server.getRoom(roomId);
      expect(newRoom.id).to.be.a('number');
      expect(newRoom.id).to.be.above(999).and.to.be.below(10000);
      done();
    });
  });


  it("Player should be added to the room that they created", (done) => {
    
    player.emit("request create game", "testPlayerName");
    player.on("response room created", (roomId) => {
      var room = server.getRoom(roomId);
      var foundPlayer = room.getPlayer(player.id);

      expect(player.id).to.be.equal(foundPlayer.id);
      done();
    });
  });

  
  it("Room should only have 1 player on creation", (done) => {
    player.emit("request create game", "testPlayerName");
    player.on("response room created", (roomId) => {
      var room = server.getRoom(roomId);
      expect(room.players).to.have.lengthOf(1);
      done();
    });
  });

});


// describe("Room Events with 4 players", () => {
//   beforeEach((done) => {

//     // Connect 4 io clients, representing 4 players
//     for (var i = 0; i < 4; i++) {
//       var player = io("http://localhost:3000/", ioOptions);
//       player.name = "player " + i;
//     }

//     connections.push(player);

//     done();
//   });

//   afterEach((done) => {

//     // Disconnect every connection
//     for (var i = 0; i < 4; i++) {
//       connections[i].disconnect();
//       done();
//     }

//     // Set the variable to a new array as a simple way to remove all clients
//     connections = [];
//   });

//   it("Room should be allowed to start game as there are 4 players", (done) => {
//     // TODO: Implement functionality required for this test to pass
//     var canStart = true;
//     expect(canStart).to.equal(true);

//     done();
//   });
// });
