/**
 * This file contains all lobby-related routes and methods
 */
var lobbies = [];

function Lobby() {

  // Dictionary datatype, with the key being the client socket id, and the value being
  // the socket object with player-relayed information attached
  this.players = [];
  
  // Only 2 teams for now
  this.team1 = [];
  this.team2 = [];

  this.id = Math.floor(Math.random()*9000) + 1000;


  this.addPlayer = (socket) => {
    this.players.push({
      key: socket.id,
      value: socket
    });

    // Automatically assign a player to a team
    if (this.team1.length < this.team2.length) {
      this.team1.push({
        key: socket.id,
        value: socket
      });
    }
    else if (this.team1.length > this.team2.length) {
      this.team2.push({
        key: socket.id,
        value: socket
      });
    }
    else if (this.team1.length === this.team2.length) {
      
      // Randomly assign the player to a team
      var rand = Math.round(Math.random());
      if (rand < 0.5) {
        this.team1.push({
          key: socket.id,
          value: socket
        });
      } else {
        this.team2.push({
          key: socket.id,
          value: socket
        });
      }
    }
  };


  this.removePlayer = (socket) => {
    // TODO: Add functionality to pause or stop game if player drops out and there are only 3 left

    // First find which team the player is in, then remove them.
    var s = this.team1.find(p => p.key == socket.id);

    if (s !== undefined) {
      var index = this.team1.indexOf(s.key);
      this.team1.splice(index, 1);
      this.removeLobbyIfEmpty();
    }

    s = this.team2.find(p => p.key == socket.id);

    if (s !== undefined) {
      var index = this.team2.indexOf(s.key);
      this.team2.splice(index, 1);
      this.removeLobbyIfEmpty();
    }

    return false;

  }


  /**
   * Once a lobby is empty, it should automatically remove itself from the array.
   */
  this.removeLobbyIfEmpty = () => {

    if (this.team1.length === 0 && this.team2.length === 0) {
      var index = lobbies.indexOf(this);
      lobbies.splice(index, 1);
    }
  }

  this.getPlayer = (playerId) => {
    // They key is the id, whereas the value is the object itself
    return this.players.find(p => p.key == playerId).value;
  };


  this.changePlayerTeam = (socket) => {

    // First find which team the player belongs to

    var s = this.team1.find(p => p.key == socket.id);

    // Since there are only 2 teams, changing teams just requires flipping the player to the other team
    if (s !== undefined) {
      // First remove the player from team 1 array, then add to team 2 array
      var index = this.team1.indexOf(s.key);
      this.team1.splice(index, 1);
      this.team2.push({
        key: socket.id,
        value: socket
      });
      return true; // Indicate that player was successfully moved
    }
    
    s = this.team2.find(p => p.key == socket.id);

    if (s !== undefined) {
      // First remove the player from team 1 array, then add to team 2 array
      var index = this.team2.indexOf(s.key);
      this.team2.splice(index, 1);
      this.team1.push({
        key: socket.id,
        value: socket
      });
      return true; // Indicate that player was successfully moved
    }
    
    return false;
  }
    
  this.startGame = () => {
    if (this.players.length < 4) {
      return false; // Don't allow the game to start, as at least 4 players are needed
    } else {
      // TODO: Do something. Start the game
    }
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
    
    for (var key in this.team1) {
      var socket = this.team1[key].value;
      team1PlayerData.push(socket.player);
    }

    for (var key in this.team2) {
      var socket = this.team2[key].value;
      team2PlayerData.push(socket.player);
    }

    return [team1PlayerData, team2PlayerData];
  }
}

Lobby.createLobby = (socket) => {
  var lobby = new Lobby();
  lobby.addPlayer(socket);

  lobbies.push({
    key: lobby.id,
    value: lobby
  });


  return lobby;
}

Lobby.getLobby = (id) => {
  // Note that the lobby's id is stored as a key in the dict, so compare l.key to id
  var lobby = lobbies.find(l => l.key == id);

  if (lobby === undefined) {
    return undefined;
  }
  
  // Return the value, which is the lobby object itself
  return lobby.value;
}

Lobby.getCount = () => {
  return lobbies.length;
}

// NOTE: Used only for testing purposes
Lobby.emptyLobbiesArray = () => {
  lobbies = [];
}


module.exports = {
  Lobby: Lobby
}
