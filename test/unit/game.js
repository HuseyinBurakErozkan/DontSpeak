"use strict";

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
    id: Math.floor(Math.random() * 9000000000) + 1000
  }
}


describe('Game', () => {

  var lobby;
  var sockets = [];
  var game;

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

  beforeEach((done) => {
    lobby = Lobby.createLobby();

    for (var i = 0; i < 4; i++) {
      var socketMock = createMock();
      Player.create(socketMock, "testPlayer" + i, lobby.id);
      lobby.addPlayer(socketMock);
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


  it("Should have chosen a starting team on creation", (done) => {
    expect(game.speakingTeam).to.exist;
    done();
  });

  // it("Should begin displaying words once speaker is ready", (done) => {


  //   assert.fail();
  // });


  // TODO: Improve this test
  it("Should loop back to the first player, once all players have performed speaker role", (done) => {
    
    for (var i = 0; i < 10; i++) {
      game.startRound(ioMock);
    }
    done();
  });


  it("should be able to roll all dice rolls/rules", (done) => {

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


});


