'use strict';

const expect = require('chai').expect;
const server = require('../app');
const serverIo = require('../app');
const lobbies = require('../server/lobby');
let Lobby = lobbies.Lobby;
var assert = require('assert');

const io = require('socket.io-client');
const ioOptions = { 
  transports: ['websocket'],
  forceNew: true,
  reconnection: false
}

describe('Lobby creation Events', () => {

  var player;

  beforeEach((done) => {
    player = io("http://localhost:3000/", ioOptions);

    done();
  });

  afterEach((done) => {
    player.disconnect();
    Lobby.emptyLobbiesArray();

    done();
  })


  it("New Lobby should be created and stored in a collection on creation", (done) => {
    
    player.emit("request create game", "testPlayerName");
    player.on("response lobby created", () => {
      expect(Lobby.getCount()).to.have.be.at.least(1);
      done();
    })
  });


  it("Newly created lobby should be able to be found in the collection of lobbies", (done) => {
    
    player.emit("request create game", "testPlayerName");
    player.on("response lobby created", (lobbyId) => {
      var result = Lobby.getLobby(lobbyId);
      expect(result).to.not.be.null.and.to.not.be.undefined;
      done();
    })
  });


  it("New lobby should NOT be created if player hasn't provided a name", (done) => {

    player.emit("request create game", "");
    
    // Server should never respond in this fashion if the player hasn't provided a name
    player.on("response lobby created", (lobbyId) => {
      assert.fail();
      done();
    });

    // The correct response would be for the server to emit an error to the user
    player.on("error", (msg) => {
      done(); // Indicate that the test has passed
    });
  })


  it("New lobby should have generated a 4 digit id on initialisation", (done) => {
    
    player.emit("request create game", "testPlayerName");
    player.on("response lobby created", (lobbyId) => {
      var newLobby = Lobby.getLobby(lobbyId);
      expect(newLobby.id).to.be.a('number');
      expect(newLobby.id).to.be.above(999).and.to.be.below(10000);
      done();
    });
  });


  it("Player should be added to the lobby that they created", (done) => {
    
    player.emit("request create game", "testPlayerName");
    player.on("response lobby created", (lobbyId) => {
      var lobby = Lobby.getLobby(lobbyId);
      var foundPlayer = lobby.getPlayer(player.id);

      expect(player.id).to.be.equal(foundPlayer.id);
      done();
    });
  });

  
  it("Lobby should only have 1 player on creation", (done) => {

    player.emit("request create game", "testPlayerName");
    player.on("response lobby created", (lobbyId) => {
      var lobby = Lobby.getLobby(lobbyId);
      expect(lobby.players).to.have.lengthOf(1);
      done();
    });
  });
});


/**
 * These tests are for any functionalities during waiting in the lobby - before the game has begun
 */
describe('Lobby Events', () => {

  var player; // The initial player that created the lobby
  var lobby;

  beforeEach((done) => {
    player = io("http://localhost:3000/", ioOptions);
    player.emit("request create game", "testPlayerName");
    player.on("response lobby created", (lobbyId) => {
      lobby = Lobby.getLobby(lobbyId);
      done();
    });
  });

  afterEach((done) => {
    player.disconnect();
    Lobby.emptyLobbiesArray();
    done();
  })


  it("Game cannot be started unless there are at least 4 players", (done) => {

    var result = lobby.startGame();
    expect(result).to.equal(false);
    done();
  });


  it("Joining player should be added to correct lobby", (done) => {
    
    var newPlayer = io("http://localhost:3000/", ioOptions);
    newPlayer.emit("request join game", "testPlayerName", lobby.id);

    newPlayer.on("response lobby joined", () => {      
      var currentLobbyId = Lobby.getLobby(lobby.id).id;
      expect(lobby.id).to.equal(currentLobbyId);

      newPlayer.disconnect();
      done();
    });
  });


  // A MaxListenersExceededWarning warning is being thrown when this test runs. Comment out for now
  // and figure out the cause of the issue.
  it("Lobby should add new players who are trying to join", (done) => {

    /**
     * This number will be decremented each time a player is added. Once at 0, the
     * test will be performed. If the list of players is not = playersLeft + 1 (The player
     * that created the game), that means that not all players were able to be added.
     */
    var playersLeft = 3;
    var loopAmt = playersLeft;
    for (var i = 0; i < loopAmt; i++) {
      var newPlayer = io("http://localhost:3000/", ioOptions);
      newPlayer.emit("request join game", "testPlayerName", lobby.id);
      newPlayer.on("response lobby joined", (lobbyId) => {

        playersLeft--; // Decrement in the callback

        // Only perform the test once the last callback has been called
        if (playersLeft === 0) {
          
          // 3 new players + The original player that created the lobby
          expect(lobby.players).to.have.lengthOf(4);

          // Disconnect all sockets to prevent memory leaks
          for (const [key, value] of Object.entries(lobby.players)) {
            value.value.disconnect();
          }          

          done();
        }
      });
    }
  });


  it("Player should NOT join any lobby if lobby id is not provided", (done) => {
    
    var newPlayer = io("http://localhost:3000/", ioOptions);
    newPlayer.emit("request join game", "testPlayerName");
      
    // The server has allowed the played to join, therefore test failed
    newPlayer.on("response lobby joined", (lobbyId) => {
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


  it("Lobby should NOT add player if invalid name", (done) => {
    
    var newPlayer = io("http://localhost:3000/", ioOptions);
    newPlayer.emit("request join game");
      
    // The server has allowed the played to join, therefore test failed
    newPlayer.on("response lobby joined", (lobbyId) => {
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

  
  // it ("Lobby should be removed from collection of lobbies once empty", (done) => {
  //   expect(Lobby.getCount()).to.equal(1);

  //   assert.fail(); // TODO: Remove once test code implemented
  //   done();
  // });

  // it("Game should start when there are at least 4 players", (done) => {

  //   assert.fail();
  //   done();
  // });


  // it("Each team must have at least 2 players before game can begin", (done) => {

  //   assert.fail();
  //   done();
  // });


  // it("Player should not be able to join lobby if game in progress", (done) => {

  //   assert.fail();
  //   done();
  // });

  // it ("Lobby should let every player know when game is starting", (done) => {
  //   assert.fail();
  //   done();
  // });

});