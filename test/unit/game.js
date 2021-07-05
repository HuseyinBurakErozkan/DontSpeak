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


  // TODO: Improve this test
  it("Should loop back to the first player, once all players have performed speaker role", (done) => {
    for (var i = 0; i < 10; i++) {
      game.startRound();
    }
    done();
  });

  it("Should choose a word", (done) => {
    var result = game.selectWord();
    expect(result).to.exist;
    
    // Also check that the result variable is indeed assigned a word, rather than a
    // garbage value.
    for (let v of Word.words.values()) {
      if (result === v) {
        done();
      }
    }
    
    // If here is reached, the result variable has been assigned an incorrect value
    assert.fail();
  });

  it("should be able to roll all dice rolls/rules", (done) => {

    var rolledPossibilities = [];
    // Loop 200 times, as that gives a > 99.99% chance to hit all rolls 
    for (var i = 0; i < 200; i++) {
      game.rollDice();
      if (!rolledPossibilities.includes(game.strategy.description)) {
        // console.log("DOESN'T INCLUDE", game.strategy.description);
        rolledPossibilities.push(game.strategy.description);

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


