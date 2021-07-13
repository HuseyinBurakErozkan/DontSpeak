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


describe.only('Game', () => {

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


  it.skip("Should begin displaying words once speaker is ready", (done) => {

    // TODO: Implement test

    assert.fail();
  });


  it.skip("should be able to roll all dice rolls/rules", (done) => {

    // TODO: Implement other rules

    var rolledPossibilities = [];
    // Loop 200 times, as that gives a > 99.99% chance to hit all rolls 
    for (var i = 0; i < 200; i++) {
      game.rollDice();
      game.strategyManager.runStrategy(ioMock, createMock(), game);
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
  
  
    it("Should allow all players to have a speaker role", (done) => {
      /**
       * Check if all players have performed a speaking role by calling setSpeaker()
       * n times, where n = the player count. After setSpeaker() is called attach a property
       * to the socket that the function has designated. Then iterate through all sockets
       * and ensure that every single one of them has the property.
       */
      for (var i = 0; i < sockets.length; i++) {
        game.prepareRound(ioMock);
        game.startRound(ioMock);
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
      game.startRound(ioMock);
      var speaker = game.speakerSocket;
  
      // Loop and see if the original speaker eventually gets another speaking role. If so,
      // test passed. Otherwise, test fails
      for (var i = 0; i < 5; i++) {
        game.prepareRound(ioMock);
        game.startRound(ioMock);
  
        if (game.speakerSocket === speaker) {
          done();
        }
      }
      
      assert.fail();
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
  

    it("Should be set to 'prepared' once game has begun", (done) => {
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
