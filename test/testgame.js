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

describe("Game", () => {

  beforeEach((done) => {

    done();
  });

  afterEach((done) => {
    
    done();
  })

  // it("should be assigned to a lobby", (done) => {
  //   assert.fail();
  // });

  // it("should randomly choose which team goes first", (done) => {
  //   assert.fail();
  // });

});