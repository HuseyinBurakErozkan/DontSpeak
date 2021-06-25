/**
 * This file contains all lobby-related routes and methods
 */
var lobbies = [];

/**
 * 
 * @param {*} app The express app. Passed as an argument to allow the lobby object to perform routing 
 */
function Lobby(app) {

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
}

Lobby.createLobby = (socket, app) => {
  var lobby = new Lobby(app);
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
