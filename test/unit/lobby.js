"use strict";

const expect = require('chai').expect;
const server = require('../../app');
const serverIo = require('../../app');
const lobbies = require('../../server/lobby');
const Lobby = lobbies.Lobby;
const assert = require('assert');
const Player = require('../../server/player').Player;

// Create a mock of the socket, as some functions require the socket's id as arguments
function createMock() {
  return {
    id: Math.floor(Math.random() * 9000000000) + 1000,
    on: () => {
      // Do nothing, as we only have to mock the socket for its id, not its functionality
    }
  }
}

describe('Lobby instance', () => {

  var mockSocket;
  beforeEach((done) => {
    mockSocket = createMock();
    done();
  });

  afterEach((done) => {
    done();
  });

  it("Should be instantiated when a new player wants to create game", (done) => {
    expect(Lobby.getCount()).to.equal(0);
    Lobby.createLobby();
    expect(Lobby.getCount()).to.equal(1);
    done();
  });

  it("Should return itself on creation", (done) => {
    var lobby;
    expect(lobby).to.not.exist;
    lobby = Lobby.createLobby();
    expect(lobby).to.exist;
    done();
  });

  it("Should contain 1 player when the requesting player is added to it", (done) => {
    var lobby = Lobby.createLobby();
    expect(lobby.getPlayerCount()).to.equal(0);

    var player = Player.create(mockSocket, "testPlayer", lobby.id);
    lobby.addSocket(mockSocket);
    expect(lobby.getPlayerCount()).to.equal(1);
    done();
  });
});


describe('Lobby instance with 1 player', () => {

  var lobby;
  var socketMock = createMock();
  
  beforeEach((done) => {
    lobby = Lobby.createLobby();
    Player.create(socketMock, "testPlayer", lobby.id);
    lobby.addSocket(socketMock);
    done();
  });

  afterEach((done) => {
    lobby.removePlayer(socketMock);
    lobby.removeLobbyIfEmpty();
    done();
  });


  it("Should not allow the game to start when under 4 players", (done) => {

    expect(lobby.startGame()).to.equal(false);
    done();
  });

});


describe('Lobby instance with minimum needed players', () => {

  var lobby;
  var sockets = [];

  beforeEach((done) => {
    lobby = Lobby.createLobby();

    for (var i = 0; i < 4; i++) {
      var socketMock = createMock();
      Player.create(socketMock, "testPlayer" + i, lobby.id);
      lobby.addSocket(socketMock);
      sockets.push(socketMock);
    }

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


  it("Should have 4 players", (done) => {
    expect(lobby.getPlayerCount()).to.equal(4);
    done();
  });

  it("Should have 2 players per team" , (done) => {
    expect(lobby.team1.size).to.equal(2);
    expect(lobby.team2.size).to.equal(2);
    done();
  });

  it("Should be able to start game", (done) => {
    expect(lobby.startGame()).to.equal(true);
    expect(lobby.game).to.exist;
    done();
  });

  it("Should not start if player leaves and there are less than 4", (done) => {
    lobby.removePlayer(sockets[0]);
    expect(lobby.startGame()).to.equal(false);
    expect(lobby.game).to.not.exist;
    done();
  });

  it("Should not start if one of the team has less than the 2 minimum players", (done) => {

    // Before hook creates 4 players. Therefore, the lobby should automatically distribute them
    // between the teams equally.
    // After changing team, the team the player was in should have 1 player.
    var player = sockets[0];
    var originalTeam = lobby.getPlayerTeam(player);

    // Move player to the opposite team
    (originalTeam === 1)
      ? lobby.movePlayerToTeam(player, 2)
      : lobby.movePlayerToTeam(player, 1);

    // Now that the player's original team has 1 player, game should not start
    expect(lobby.startGame()).to.equal(false);
    expect(lobby.game).to.not.exist;

    // Now move player back to the original team
    (originalTeam === 1)
      ? lobby.movePlayerToTeam(player, 1)
      : lobby.movePlayerToTeam(player, 2);

    expect(lobby.startGame()).to.equal(true);
    expect(lobby.game).to.exist;

    done();
  });


  describe("#movePlayerToTeam", () => {

    it("Should throw error if socket and team isn't provided as an argument", (done) => {
      expect(() => { lobby.movePlayerToTeam() }).to.throw();
      expect(() => { lobby.movePlayerToTeam(socket) }).to.throw();
      expect(() => { lobby.movePlayerToTeam(1) }).to.throw();
      done();
    });


    it("Should move player from one team to the other", (done) => {
      var originalTeam = lobby.getPlayerTeam(sockets[0]);

      (originalTeam === 1)
        ? expect(lobby.movePlayerToTeam(sockets[0], 2)).to.equal(true)
        : expect(lobby.movePlayerToTeam(sockets[0], 1)).to.equal(true);
      
      var newTeam = lobby.getPlayerTeam(sockets[0]);

      (originalTeam === 1)
        ? expect(newTeam).to.equal(2)
        : expect(newTeam).to.equal(1);
      
      done();
    });

    it("Should not do anything if player requested to move to the team it is already in", (done) => {
      var playersTeam = lobby.getPlayerTeam(sockets[0]);
      expect(lobby.movePlayerToTeam(sockets[0], playersTeam)).to.equal(false);

      done();
    });
  });
});