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


/**
 * These tests are for any functionalities during the waiting room - before the game has begun
 */
describe('Room lobby Events', () => {

  var player; // The initial player that created the room
  var room;

  beforeEach((done) => {
    player = io("http://localhost:3000/", ioOptions);
    player.emit("request create game", "testPlayerName");
    player.on("response room created", (roomId) => {
      room = server.getRoom(roomId);
      done();
    });
  });

  afterEach((done) => {
    player.disconnect();
    server.emptyRoomsArray();
    done();
  })


  it("Game cannot be started unless there are at least 4 players", (done) => {

    var result = room.startGame();
    expect(result).to.equal(false);
    done();
  });


  it("Joining player should be added to correct room", (done) => {
    
    var newPlayer = io("http://localhost:3000/", ioOptions);
    newPlayer.emit("request join game", "testPlayerName", room.id);

    newPlayer.on("response room joined", () => {      
      var currentRoomId = server.getRoom(room.id).id;
      expect(room.id).to.equal(currentRoomId);

      newPlayer.disconnect();
      done();
    });
  });


  // A MaxListenersExceededWarning warning is being thrown when this test runs. Comment out for now
  // and figure out the cause of the issue.
  // it("Room should add new players who are trying to join", (done) => {

  //   /**
  //    * This number will be decremented each time a player is added. Once at 0, the
  //    * test will be performed. If the list of players is not = playersLeft + 1 (The player
  //    * that created the game), that means that not all players were able to be added.
  //    */
  //   var playersLeft = 3;
  //   var loopAmt = playersLeft;
  //   for (var i = 0; i < loopAmt; i++) {
  //     var newPlayer = io("http://localhost:3000/", ioOptions);
  //     newPlayer.emit("request join game", "testPlayerName", room.id);
  //     newPlayer.on("response room joined", (roomId) => {

  //       playersLeft--; // Decrement in the callback

  //       // Only perform the test once the last callback has been called
  //       if (playersLeft === 0) {
          
  //         // 3 new players + The original player that created the room
  //         expect(room.players).to.have.lengthOf(4);

  //         // Disconnect all sockets to prevent memory leaks
  //         for (const [key, value] of Object.entries(room.players)) {
  //           value.value.disconnect();
  //         }          

  //         done();
  //       }
  //     });
  //   }
  // });


  it("Player should NOT join any room if room id is not provided", (done) => {
    
    var newPlayer = io("http://localhost:3000/", ioOptions);
    newPlayer.emit("request join game", "testPlayerName");
      
    // The server has allowed the played to join, therefore test failed
    newPlayer.on("response room joined", (roomId) => {
      assert.fail();
      newPlayer.disconnect();
      done();
    });
    

    // Server emitted error, therefore, test passed
    newPlayer.on("error", () => {
      newPlayer.disconnect();
      done();
    });
  });




  it("Room should NOT add player if invalid name", (done) => {
    
    var newPlayer = io("http://localhost:3000/", ioOptions);
    newPlayer.emit("request join game");
      
    // The server has allowed the played to join, therefore test failed
    newPlayer.on("response room joined", (roomId) => {
      assert.fail();
      newPlayer.disconnect();
      done();
    });

    // Server emitted error, therefore, test passed
    newPlayer.on("error", () => {
      newPlayer.disconnect();
      done();
    });
  });


  // it("Game should start when there are at least 4 players", (done) => {

  //   assert.fail();
  //   done();
  // });


  // it("Each team must have at least 2 players before game can begin", (done) => {

  //   assert.fail();
  //   done();
  // });


  // it("Player should not be able to join room if game in progress", (done) => {

  //   assert.fail();
  //   done();
  // });

  // it ("Room should let every player know when game is starting", (done) => {
  //   assert.fail();
  //   done();
  // });

});