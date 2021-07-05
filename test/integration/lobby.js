'use strict';

const expect = require('chai').expect;
const server = require('../../app');
const serverIo = require('../../app');
const lobbies = require('../../server/lobby');
let Lobby = lobbies.Lobby;
var assert = require('assert');
const Player = require('../../server/player').Player;

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
    done();
  })


  it("New Lobby should be created and stored in a collection on creation", (done) => {
    
    player.emit("request: create lobby", "testPlayerName");
    player.on("response: lobby created", () => {
      expect(Lobby.getCount()).to.be.at.least(1);
      done();
    })
  });


  it("Newly created lobby should be able to be found in the collection of lobbies", (done) => {
    
    player.emit("request: create lobby", "testPlayerName");
    player.on("response: lobby created", (lobbyId) => {
      var result = Lobby.getLobby(lobbyId);
      expect(result).to.not.be.null.and.to.not.be.undefined;
      done();
    })
  });


  it("New lobby should NOT be created if player hasn't provided a name", (done) => {

    player.emit("request: create lobby", "");
    
    // Server should never respond in this fashion if the player hasn't provided a name
    player.on("response: lobby created", (lobbyId) => {
      assert.fail();
      done();
    });

    // The correct response would be for the server to emit an error to the user
    player.on("error:", (msg) => {
      done(); // Indicate that the test has passed
    });
  })


  it("New lobby should have generated a 4 digit id on initialisation", (done) => {
    
    player.emit("request: create lobby", "testPlayerName");
    player.on("response: lobby created", (lobbyId) => {
      var newLobby = Lobby.getLobby(lobbyId);
      expect(newLobby.id).to.be.a('number');
      expect(newLobby.id).to.be.above(999).and.to.be.below(10000);
      done();
    });
  });


  it("Player should be added to the lobby that they created", (done) => {
    
    player.emit("request: create lobby", "testPlayerName");
    player.on("response: lobby created", (lobbyId) => {
      var lobby = Lobby.getLobby(lobbyId);
      var foundPlayer = lobby.getPlayer(player.id);

      expect(player.id).to.be.equal(foundPlayer.id);
      done();
    });
  });

  
  it("Lobby should only have 1 player on creation", (done) => {

    player.emit("request: create lobby", "testPlayerName");
    player.on("response: lobby created", (lobbyId) => {
      var lobby = Lobby.getLobby(lobbyId);
      expect(lobby.getPlayerCount()).to.equal(1);
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
    player.emit("request: create lobby", "testPlayerName");
    player.on("response: lobby created", (lobbyId) => {
      lobby = Lobby.getLobby(lobbyId);
      done();
    });
  });

  afterEach((done) => {
    player.disconnect();

    done();
  })


  it("Game cannot be started unless there are at least 4 players", (done) => {

    var gameStarted = lobby.startGame();
    expect(gameStarted).to.be.equal(false);
    done();
  });


  it("Joining player should be added to correct lobby", (done) => {
    
    var newPlayer = io("http://localhost:3000/", ioOptions);
    newPlayer.emit("request: join lobby", "testPlayerName", lobby.id);

    newPlayer.on("response: lobby joined", () => {      
      var currentLobbyId = Lobby.getLobby(lobby.id).id;
      expect(lobby.id).to.equal(currentLobbyId);

      newPlayer.disconnect();
      done();
    });
  });


  /**
   * NOTE: There is an issue with adding multiple clients. When more clients are added,
   * only 1 socket is assigned an id, which means that they share a connection(?).
   * The ioOption 'forceNew: true' should ensure that they don't, but the issue isn't solved.
   * 
   * TODO: Find out why this issue is being caused.
   */

  // // TEST ONLY THIS FUNCTION FOR NOW
  // it("Lobby should add new players who are trying to join", (done) => {

  //   /**
  //    * This number will be decremented each time a player is added. Once at 0, the
  //    * test will be performed. If the list of players is not = playersLeft + 1 (The player
  //    * that created the game), that means that not all players were able to be added.
  //    */
  //   var playersLeft = 3;
  //   var loopAmt = playersLeft;
  //   var addedPlayers = []; // Used to disconnect each socket later

  //   console.log("original player's id: " + player.id);
  //   for (var i = 0; i < loopAmt; i++) {
  //     var newPlayer = io("http://localhost:3000/", ioOptions);

      
  //     newPlayer.emit("request: join lobby", "testPlayerName" + i, lobby.id);

  //     newPlayer.on('connect', () => {
  //       console.log(newPlayer.id);
  //       // console.log(newPlayer.id + "------------------------------------------------");
  //     })
  //     // console.log("Before emission");
  //     // console.log(newPlayer.id);
  //     // newPlayer.on("error:", (msg) => {
  //     //   console.log("ERRRRRRRRRRRRROR " + msg )
  //     // });
  //     newPlayer.on("response: lobby joined", (lobbyId) => {

  //       // console.log("=========================+++++++++++++++++")
  //       // console.log(newPlayer.id);
  //       addedPlayers.push(newPlayer);
  //       playersLeft--; // Decrement in the callback

  //       // Only perform the test once the last callback has been called
  //       if (playersLeft === 0) {
       
  //         setInterval(() => {
  //         // 3 new players + The original player that created the lobby
  //         expect(lobby.getPlayerCount()).to.equal(4);
 
  //         for (var i = 0; i < loopAmt; i++) {
  //           addedPlayers[i].disconnect();
  //         }

  //         done();
  //         }, 200)

  //       }
  //     });
  //   }
  // });


  it("Player should NOT join any lobby if lobby id is not provided", (done) => {
    
    var newPlayer = io("http://localhost:3000/", ioOptions);
    newPlayer.emit("request: join lobby", "testPlayerName");
      
    // The server has allowed the played to join, therefore test failed
    newPlayer.on("response: lobby joined", (lobbyId) => {
      assert.fail();
      newPlayer.disconnect();
      done();
    });
    

    // Server emitted error, therefore, test passed
    newPlayer.on("error:", () => {
      newPlayer.disconnect();
      done();
    });
  });

  it("Player should NOT be able to join a lobby if an incorrect id is provded", (done) => {
    var newPlayer = io("http://localhost:3000/", ioOptions);
    var wrongId = lobby.id + 1;
    newPlayer.emit("request: join lobby", "testPlayerName", wrongId);
      
    // The server has allowed the played to join, therefore test failed
    newPlayer.on("response: lobby joined", (lobbyId) => {
      assert.fail();
      newPlayer.disconnect();
      done();
    });

    newPlayer.on("error:", () => {
      done();
    });
  })

  it("Lobby should NOT add player if invalid name", (done) => {
    
    var newPlayer = io("http://localhost:3000/", ioOptions);
    newPlayer.emit("request: join lobby");
      
    // The server has allowed the played to join, therefore test failed
    newPlayer.on("response: lobby joined", (lobbyId) => {
      assert.fail();
      newPlayer.disconnect();
      done();
    });

    // Server emitted error, therefore, test passed
    newPlayer.on("error:", () => {
      newPlayer.disconnect();
      done();
    });
  });


  it("Player should be assigned to a team when lobby is created", (done) => {
    // Sum the lengths of both team arrays. It should be 1 if player was placed into a team
    var teamsLength = lobby.team1.size + lobby.team2.size;
    expect(teamsLength).to.equal(1);

    done();
  });


  /**
   * NOTE: There is an issue with adding multiple clients. When more clients are added,
   * only 1 socket is assigned an id, which means that they share a connection(?).
   * The ioOption 'forceNew: true' should ensure that they don't, but the issue isn't solved.
   * 
   * TODO: Find out why this issue is being caused.
   */
  //   // it("Lobby should balance out teams when other players join", (done) => {

  //   /**
  //    * This number will be decremented each time a player is added. Once at 0, the
  //    * test will be performed. If the list of players is not = playersLeft + 1 (The player
  //    * that created the game), that means that not all players were able to be added.
  //    */
  //   var playersLeft = 3;
  //   var loopAmt = playersLeft;
  //   var addedPlayers = [];

  //   for (var i = 0; i < loopAmt; i++) {
  //     var newPlayer = io("http://localhost:3000/", ioOptions);
  //     newPlayer.emit("request: join lobby", "testPlayerName", lobby.id);
  //     newPlayer.on("response: lobby joined", (lobbyId) => {

  //       addedPlayers.push(newPlayer);
  //       playersLeft--; // Decrement in the callback

  //       // Only perform the test once the last callback has been called
  //       if (playersLeft === 0) {
          
  //         // If working as expected, the players should be evenly divided into both teams
  //         expect(lobby.team1.length).to.equal(lobby.team2.length);

  //         // Disconnect all sockets once done with them
  //         for (var i = 0; i < loopAmt; i++) {
  //           addedPlayers[i].disconnect();
  //         }      

  //         done();
  //       }
  //     });
  //   }
  // });
  

  it("Lobby should be able to change a player's team", (done) => {

    // First ensure only the original player is in 1 team
    expect(lobby.team1.size + lobby.team2.size).to.equal(1);

    var t1length = lobby.team1.length;

    lobby.changePlayerTeam(player);

    // Team count for both should have flipped between 0 and 1, so only need to check if the 
    // current length of team1 is not equal to the previous value
    expect(t1length).to.not.equal(lobby.team1.size);

    // Also ensure that total players between both teams are still 1
    expect(lobby.team1.size + lobby.team2.size).to.equal(1);

    done();
  });

  // it("Should be ready start when there are at least 4 players", (done) => {

  //   var players = [];
  //   for (var i = 0; i < 3; i++) {
  //     var newSocket = io("http://localhost:3000/", ioOptions);
      
  //     // Player should be able to be created
  //     expect(Player.create(newSocket, "player" + i, lobby.id)).to.equal(true);

  //     // Add a random id as a property to the socket, as the io option force true: new doesn't
  //     // seem to work
  //     newSocket.id = Math.floor(Math.random() * 1000000) + 1;

  //     players.push(newSocket);
  //     lobby.addPlayer(newSocket);
  //   }

  //   // Game should be able to start after 4 players are in the lobby
  //   expect(lobby.startGame()).to.equal(true);

  //   for (var i = 0; i < 3; i++) {
  //     lobby.removePlayer(newSocket);
  //   }

  //   setInterval(() => {
  //     done();
  //   }, 500);

  // });


  // it("Player should not be able to join lobby if game in progress", (done) => {

  //   assert.fail();
  //   done();
  // });

  // it ("Lobby should let every player know when game is starting", (done) => {
  //   assert.fail();
  //   done();
  // });

  // it("Game should not continue if player has left and there are less than the minimum required 4 players", (done) => {
  //   assert.fail();
  //   done();
  // });

});

// describe("Game start events", () => { 

//   beforeEach((done) => {
//     player = io("http://localhost:3000/", ioOptions);

//     done();
//   });

//   afterEach((done) => {
//     player.disconnect();
//     done();
//   })

// });

describe("Lobby destruction events", () => {

  it ("Lobby should be removed from collection of lobbies once empty", (done) => {
    
    // Firt ensure there are no lobbies. If this fails, that means there is an issue with either
    // the software or the tests
    expect(Lobby.getCount()).to.equal(0); 

    var player = io("http://localhost:3000/", ioOptions);
    player.emit("request: create lobby", "testPlayerName");
    
    player.on("response: lobby created", () => {
      expect(Lobby.getCount()).to.equal(1);
      player.disconnect();

      done();
    });
  });
});
