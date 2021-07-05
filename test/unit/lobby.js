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
    id: Math.floor(Math.random() * 9000000000) + 1000
  }
}

describe('Lobby instance', () => {

  beforeEach((done) => {
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

    var player = Player.create("mock socket", "testPlayer", lobby.id);
    lobby.addPlayer(player);
    expect(lobby.getPlayerCount()).to.equal(1);
    // TODO: ADD A PLAYER AND EXPECT COUNT TO EQUAL 1
    done();
  });
});


describe('Lobby instance with 1 player', () => {

  var lobby;
  var socketMock = createMock();
  
  beforeEach((done) => {
    lobby = Lobby.createLobby();
    Player.create(socketMock, "testPlayer", lobby.id);
    lobby.addPlayer(socketMock);
    done();
  });

  afterEach((done) => {
    lobby.removePlayer(socketMock);
    lobby.removeLobbyIfEmpty();
    done();
  });


  it("Should correctly change a player's team on request", (done) => {
    var originalTeam = lobby.getPlayerTeam(socketMock);
    expect(originalTeam).to.be.oneOf(["team1", "team2"]);

    // Change team and check if the player was moved to the opposite once done
    lobby.changePlayerTeam(socketMock);

    (originalTeam == "team1") 
      ? expect(lobby.getPlayerTeam(socketMock)).to.equal("team2") 
      : expect(lobby.getPlayerTeam(socketMock)).to.equal("team1");

    // Repeat the test by switching the player again and checking that they're back in the
    // original team.
    lobby.changePlayerTeam(socketMock);
    expect(lobby.getPlayerTeam(socketMock)).to.equal(originalTeam);

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
      lobby.addPlayer(socketMock);
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
    lobby.changePlayerTeam(sockets[0]);
    expect(lobby.startGame()).to.equal(false);
    expect(lobby.game).to.not.exist;

    // Now have the switch back to the original team and ensure that the game can start
    lobby.changePlayerTeam(sockets[0]);
    expect(lobby.startGame()).to.equal(true);
    expect(lobby.game).to.exist;

    done();
  });
});