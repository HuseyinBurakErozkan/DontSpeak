"use strict";

const expect = require('chai').expect;
const server = require('../app')
const io = require('socket.io-client')
const ioOptions = { 
  transports: ['websocket'],
  forceNew: true,
  reconnection: false
}


var connections = [];

describe("Room Events", () => {
  beforeEach((done) => {

    // Connect 4 io clients, representing 4 players
    for (var i = 0; i < 4; i++) {
      var player = io("http://localhost:3000/", ioOptions);
      player.name = "player " + i;
    }

    connections.push(player);

    done();
  });

  afterEach((done) => {

    // Disconnect every connection
    for (var i = 0; i < 4; i++) {
      connections[i].disconnect();
      done();
    }

    // Set the variable to a new array as a simple way to remove all clients
    connections = [];
  });

  it("Room should be allowed to start game as there are 4 players", (done) => {
    // TODO: Implement functionality required for this test to pass
    var canStart = false;
    expect(canStart).to.equal(true);

    done();
  });
});
