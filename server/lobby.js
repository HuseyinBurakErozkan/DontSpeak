/**
 * This file contains all lobby-related routes and methods
 */

const io = require('../app').io;
const Game = require('./game').Game;

var lobbies = new Map();

function Lobby() {

  // Only 2 teams for now
  this.team1 = new Map();
  this.team2 = new Map();
  
  // TODO: Ensure that there aren't any existing lobbies with the same id
  this.id = Math.floor(Math.random() * 9000) + 1000;

  /**
   * This function is for adding lobby-related event listeners for the socket after it 
   * has joined the lobby. It does not handle any game or lobby related logic. That is
   * handled by the addPlayer() function. 
   */
  this.addSocket = (socket) => {
    this.addPlayer(socket); // Now add the player to the lobby

    socket.on('request: move to team', (team) => {
      console.log(`${socket.player.name} is asking to move to team ${team}`);
      this.movePlayerToTeam(socket, team);
    });
  
    socket.on('request: start game', () => {
      if (this.startGame()) {
        io.to("lobby" + this.id).emit("response: game started");
  
        // Attach game-related eventListeners for all sockets in the lobby by calling
        // the game's addSocket function.
        for (let s of this.team1.values()) {
          console.log(s.id);
          this.game.addSocket(s)
        }
        for (let s of this.team2.values()) {
          console.log(s.id)
          this.game.addSocket(s);
        }
      }
      else {
        io.to("lobby" + this.id).emit("error:", 
          "Game can not start. Either an error occurred or there are less than 2 players per team");
      }
    });
  };

  /**
   * Add a player to the lobby and assign it to a team
   * @param {object} socket The socket representing the player connection 
   */
  this.addPlayer = (socket) => {

    // Automatically assign a player to a team
    if (this.team1.size < this.team2.size) {
      this.team1.set(socket.id, socket); 
    }
    else if (this.team1.size > this.team2.size) {
      this.team2.set(socket.id, socket);
    }
    else if (this.team1.size === this.team2.size) { // Both size are equal, so assign to random team
      
      var rand = Math.round(Math.random());
      rand < 0.5 ? this.team1.set(socket.id, socket) : this.team2.set(socket.id, socket); 
    }
  }


  this.movePlayerToTeam = (socket, team) => {

    if (socket === undefined || team === undefined) {
      throw new Error("Error: movePlayerToTeam(): socket or team is undefined");
    } else if (this.getPlayerTeam(socket) === undefined) {
      // Throw an exception, as this should never happen.
      throw "Error: movePlayerToTeam(): player could not be found in team";
    }

    // First check if player is already in the team they requested, and if so, ignore it
    // Return false to indicate that the player wasn't changed.
    if (this.getPlayerTeam(socket) === team) {
      // Let the client know that they couldn't change teams
      io.to(socket.id).emit("error:", `You are already in team ${team}`);
      return false;

    } else {
      // Assign the teams to the variables to avoid having to create unnecessary if statements
      var oldTeam, newTeam;
      (team === 1) // If player wants to move to team 1
        ? (newTeam = this.team1, oldTeam = this.team2) // Move player to team 1
        : (newTeam = this.team2, oldTeam = this.team1); // Move player to team 2

      oldTeam.delete(socket.id);
      newTeam.set(socket.id, socket);

      // Let all clients know that the 
      io.to(socket.id).emit("response: move to team");
      var result = this.getArrayOfPlayersWithoutSockets();

      io.to("lobby" + this.id).emit("update: teams updated", result[0], result[1]);

      return true;
    }
  }


  this.removePlayer = (socket) => {
    var deleted = false;

    if (this.team1.delete(socket.id)) {
      deleted = true;
    }
    else if (this.team2.delete(socket.id)) {
      deleted = true;
    }

    if (deleted) {
      this.removeLobbyIfEmpty();
      return true; // Indicate that the player was removed from lobby
    }

    return false;
  }

  /**
   * Once a lobby is empty, it should automatically remove itself from the array.
   */
  this.removeLobbyIfEmpty = () => {

    if (this.team1.size === 0 && this.team2.size === 0) {
      lobbies.delete(this.id);
    }
  }


  this.getPlayer = (playerId) => {
    var p1 = this.team1.get(playerId);
    var p2 = this.team2.get(playerId);

    if (p1 !== undefined) {
      return p1;
    } 
    else if (p2 !== undefined) {
      return p2
    }
    else {
      return null;
    }
  };


  this.getPlayers = () => {
    return new Map(...this.team1, ...this.team2);
  }


  this.getPlayerTeam = (socket) => {
    var player = this.team1.get(socket.id); 

    if (player !== undefined) {
      return 1;
    } else {
      player = this.team2.get(socket.id);

      if (player !== undefined) {
        return 2;
      }
    }

    // Player was not found in any team, so something must have went wrong
    throw "Player was not found in team";
  }
    

  this.startGame = () => {
    // First ensure that there are at least 2 players per team, and also ensure that there
    // isn't a game already running
    if (this.team1.size < 2 || this.team2.size < 2 || this.game !== undefined ) {
      return false; // Don't allow the game to start, as at least 4 players are needed
    } else {
      this.game = new Game(this.team1, this.team2, this.id);
      return true;
    }
  }

  this.getPlayerCount = () => {
    return this.team1.size + this.team2.size;
  }


  // TODO: Rewrite the code for sockets and players to avoid the neccesity for these sorts of
  // functions, as they may cause issues later
  /**
   * Since socket data can't be sent to clients without causing issues/errors, and player data
   * is attached to sockets, we need to extract the player data from sockets and send only the player
   * data and socket id. This function extracts player data for every player in the lobby
   */
  this.getArrayOfPlayersWithoutSockets = () => {
    
    var team1PlayerData = [];
    var team2PlayerData = [];
    
    for(let socket of this.team1.values()) {
      team1PlayerData.push(socket.player);
    }
    for(let socket of this.team2.values()) {
      team2PlayerData.push(socket.player);
    }

    return [team1PlayerData, team2PlayerData];
  }
}


Lobby.createLobby = () => {
  var lobby = new Lobby();
  lobbies.set(lobby.id, lobby);
  return lobby;
}


Lobby.getLobby = (id) => {

  // Must account for strings that represent integers
  if (typeof(id) === 'string') {
    var idInt = parseInt(id);

    if (Number.isInteger(idInt)) {
      return lobbies.get(idInt);
    }
  }
  return lobbies.get(id);
}


Lobby.getCount = () => {
  return lobbies.size;
}


module.exports = {
  Lobby: Lobby
}
