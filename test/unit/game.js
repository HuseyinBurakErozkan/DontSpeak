const expect = require('chai').expect;
const server = require('../../app');
const serverIo = require('../../app');
const lobbies = require('../../server/lobby');
const Lobby = lobbies.Lobby;
const assert = require('assert');
const Player = require('../../server/player').Player;
const Word = require('../../server/word');

// Create a mock of the socket, as some functions require the socket's id as arguments
function createMock() {
  return {
    id: Math.floor(Math.random() * 9000000000) + 1000,
    on: () => {
      // Do nothing, as we only have to mock the socket for its id, not its functionality
    }
  }
}

function createServerMock() {
  // A basic mock of the io server, as the tested function requires it as an argument
  var ioMock = {
    to: () => {
      return { 
        emit: () => {
          // The mock only needs to provide a definition for this function. No functionality
          // is required, so leave it empty.
        }
      };
    }
  }

  return ioMock;
}


describe('Game', () => {

  var lobby;
  var sockets = [];
  var game;

  var ioMock = createServerMock();

  beforeEach((done) => {

    lobby = Lobby.createLobby();

    for (var i = 0; i < 4; i++) {
      var socketMock = createMock();
      Player.create(socketMock, "testPlayer" + i, lobby.id);
      lobby.addSocket(socketMock);
      sockets.push(socketMock);
    }

    lobby.startGame();
    game = lobby.game;

    done();
  });

  afterEach((done) => {
    var length = sockets.length;
    for (var i = 0; i < length; i++) {
      lobby.removePlayer(sockets[i]);
    }
    sockets = []; // Also empty the array of sockets
    done();
  });


  it("Should have chosen a starting team on initialisation", (done) => {
    expect(game.speakingTeam).to.exist;

    done();
  });


  it.skip("Should have set the amount of points needed to win on initialisation", (done) => {
    assert.fail();
  });


  it("should be able to roll all dice rolls/rules", (done) => {

    // TODO: Think of a better way to test this, rather than just looping and
    // hoping the high probability of hitting all rolls succeeds

    var rolledPossibilities = [];
    // Loop 250 times, as that gives a > 99.99% chance to hit all rolls 
    for (var i = 0; i < 250; i++) {
      game.rollDice();
      if (!rolledPossibilities.includes(game.strategyManager.name)) {
        rolledPossibilities.push(game.strategyManager.name);

        // Once all roles are reached, avoid unnecessary looping and just conclude
        // the test as passed
        if (rolledPossibilities.length === 4) {
          done();
        }
      }
    }

    assert.fail();
  });


  describe("#prepareRound", () => {

    it("Should set the game's state to prepared", (done) => {
      game.prepareRound();
      expect(game.state).to.equal("prepared");
      done();
    });


    it("Should return false if game is in any state other than 'waiting'", (done) => {
      expect(game.state).to.equal("waiting");
      game.prepareRound(); // Game state is set to 'prepared' if this function behaves as expected
      expect(game.state).to.equal("prepared");
      expect(game.prepareRound()).to.equal(false);
      game.state = "playing";
      expect(game.prepareRound()).to.equal(false);
      game.state = "gameover";
      expect(game.prepareRound()).to.equal(false);
      done();
    });


    it("Should change who the speaker is when called", (done) => {
      game.prepareRound();

      var originalSpeaker = game.speakerSocket;
      game.state = "waiting"; // Reset state so prepareRound can be called again
      expect(game.prepareRound()).to.not.equal(false);
      game.prepareRound();
      // Speaker should have changed between rounds
      expect(game.speakerSocket).to.not.equal(originalSpeaker);
      done();
    });
  });


  describe("#startRound", () => {

    it("Should only allow the round to start if game state is set to 'prepared'", (done) => {
      // State should initially be waiting, and the round should therefore return false indicating
      // it didn't start.
      expect(game.state).to.equal("waiting");
      expect(game.startRound(sockets[0])).to.equal(false);

      game.prepareRound();
      var speaker = sockets.find(s => s.id === game.speakerSocket.id);

      // Round should now start
      expect(game.state).to.equal("prepared");
      expect(game.startRound(speaker)).to.not.equal(false);

      done();
    });


    it("Should only allow the start the round if the speaker had asked for it", (done) => {
      game.prepareRound();
      var speaker = sockets.find(s => s.id === game.speakerSocket.id);
      var speakerIndex = sockets.indexOf(speaker);

      // Iterate through all sockets and have all non-speaker sockets request to start a round
      for (var i = 0; i < sockets.length; i++) {

        // Make sure that the socket is not the speaker
        if (i === speakerIndex) {
          continue;
        }

        // Round should not start
        expect(game.startRound(sockets[i])).to.equal(false);
      }

      // Now test the speaker requesting the round to start
      expect(game.startRound(sockets[speakerIndex])).to.not.equal(false);

      done();
    });


    it("Should set game state to 'playing'", (done) => {
      // First ensure the round is able to be prepared
      game.prepareRound();
      expect(game.state).to.not.equal("playing");

      // Try start round and see if the state is set to 'playing'
      var speaker = sockets.find(s => s.id === game.speakerSocket.id);
      expect(game.startRound(speaker)).to.not.equal(false);
      expect(game.state).to.equal("playing");

      done();
    });
  });


  describe("#setSpeaker", () => {

    it("Should designate a player a speaker", (done) => {

      expect(game.speakerSocket).to.equal(undefined);
      game.setSpeaker();
      expect(game.speakerSocket).to.not.equal(undefined);
      done();
    });
  
  
    it("Should designate one of it's players as a speaker", (done) => {
      game.setSpeaker();
      // Check if the speaker is also one of the game's players
      var player = sockets.find(s => s.id === game.speakerSocket.id);
      expect(player).to.exist;
      done();
    });
  

    it("Should never choose a player from the same team twice", (done) => {
      game.setSpeaker();
      var team = game.getPlayerTeam(game.speakerSocket);

      // Perform the check multiple times, to ensure no issues are caused once every player
      // has performed the speaker role, and the game loops to the beginning og the original 
      // array again
      for (var i = 0; i < 10; i++) {
        game.setSpeaker();

        // Check if the current speaker is in the same team as the previous round's speaker 
        if (game.getPlayerTeam(game.speakerSocket) === team) {
          assert.fail(); // If so, fail
        }

        // Assign to the team variable, so the next iteration can compare the previously set speaker
        // with its own.
        team = game.getPlayerTeam(game.speakerSocket);
      }

      done(); // Test passed
    });

  
    it("Should allow all players to have a speaker role", (done) => {
      /**
       * Check if all players have performed a speaking role by calling setSpeaker()
       * n times, where n = the player count. After setSpeaker() is called attach a property
       * to the socket that the function has designated. Then iterate through all sockets
       * and ensure that every single one of them has the property.
       */
      for (var i = 0; i < sockets.length; i++) {
        game.prepareRound(ioMock);
        game.state = "waiting"; // Set the game's state, as nothing will happen if in any other state
        game.speakerSocket.hasSpoken = true;
      }
  
      for (var i = 0; i < sockets.length; i++) {
        expect(sockets[i].hasSpoken).to.be.true;
      }
  
      done();
    });
  
  
    it("Should loop back to the first player, once all players have performed speaker role", (done) => {
      
      // Get the first speaker, by simulating 1 round
      game.prepareRound(ioMock);
      var speaker = game.speakerSocket;
  
      // Loop and see if the original speaker eventually gets another speaking role. If so,
      // test passed. Otherwise, test fails
      for (var i = 0; i < 5; i++) {
        game.state = "waiting"; // prepareRound does nothing if the game is not in "waiting" state
        game.prepareRound(ioMock);
  
        if (game.speakerSocket === speaker) {
          done();
        }
      }      
      assert.fail(); // If test reaches here, it never looped back to the first speaker
    });
  });
  

  describe("#getPlayerTeam", (done) => {

    it("Should find existing player", (done) => {

      var playerToFind = sockets[0];
      expect(game.getPlayerTeam(playerToFind)).to.be.oneOf(["team1", "team2"]);
      done();
    });
  
    it("Should throw an error if a socket isn't provided as an argument", (done) => {
      expect(() => { game.getPlayerTeam(playerNotInGame) }).to.throw(Error);
      done();
    });

    it("Should throw an exception when asked to find non-existent player", (done) => {
  
      var playerNotInGame = createMock();
      expect(() => { game.getPlayerTeam(playerNotInGame) }).to.throw();
      done();
    });
  });

  
  describe.skip("State", () => {
    it("Should be set to 'waiting' on creation", (done) => {
      expect(game.state).to.equal("waiting");
      done();
    });
  

    it("Should be set to 'prepared' once game has begun and new round is requested", (done) => {
      game.prepareRound(sockets[0]);
      expect(game.state).to.equal("prepared");
      done();
    });
  

    it("Should be able to be set to 'prepared' from 'waiting'", (done) => {
      assert.fail();
    });
  

    it("Should be able to be set to 'prepared' from 'tallying'", (done) => {
      assert.fail();
    });
  

    it("Should be set to 'playing' once round has begun", (done) => {
      expect(game.state).to.equal("playing");
  
      done();
    });
  

    it("Should not be able to be set to 'playing' from any state other than 'prepared'", (done) => {
  
      assert.fail();
    });
  
    it("Should be set to 'tallying' after the round is over", (done) => {
      expect(game.state).to.equal("tallying");
  
      done();
    });
  

    it("Should not be able to be set to 'tallying' from any state other than 'playing'", (done) => {
  
      assert.fail();
    });
  
    it("Should be set to 'gameover' after game over", (done) => {
      expect(game.state).to.equal("gameover");
  
      done();
    });
  

    it("Should not be able to be set to any other state after game over", (done) => {
  
      assert.fail();
    });  
  })
});
