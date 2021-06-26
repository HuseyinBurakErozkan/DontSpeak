/**
 * This file contains all lobby-related routes and methods
 */
var lobbies = new Map();

function Lobby() {
  
  // Only 2 teams for now
  this.team1 = new Map();
  this.team2 = new Map();

  this.id = Math.floor(Math.random() * 9000) + 1000;

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
  };

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


  this.changePlayerTeam = (socket) => {

    // First find which team the player belongs to
    var player = this.team1.get(socket.id); 

    if (player !== undefined) {
      this.team1.delete(socket.id);
      this.team2.set(socket.id, player);
      return true;
    }
    else {
      player = this.team2.get(socket.id);

      if (player !== undefined) {
        this.team2.delete(socket.id);
        this.team2.set(socket.id, player);
        return false;
      }
    }

    // Player was not found in any team, so something must have went wrong
    return false;
  }
    
  this.startGame = () => {
    if (this.team1.length < 2 || this.team2.length < 2) {
      return false; // Don't allow the game to start, as at least 4 players are needed
    } else {
      // TODO: Do something. Start the game
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

Lobby.createLobby = (socket) => {
  var lobby = new Lobby();
  lobby.addPlayer(socket);
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
