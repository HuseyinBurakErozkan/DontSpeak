function Player(name, lobby, id) {
  
  this.name = name;
  this.inLobby = lobby;
  this.id = id;
}

/**
 * Evaluates the inputted name to check if it is valid.
 * @param {string} name The name the player has inputted.
 * @returns {Boolean} True if the name is valid. False if not.
 */
Player.validName = (name) => {
  return !(name === null || name === undefined || name.replace(/\s/g, "") == "");
}


/**
 * Create a new player object and attach the lobby id to it. Note that this function 
 * creates a new player object, but the player object doesn't store the socket information. 
 * Instead the player object is attached as a property named 'player' to the socket. 
 * 
 * This should help with separating concerns between gameplay logic and socket-related logic.
 * 
 * @param {object} socket The socket representing the player's connection.
 * @param {string} name The name of the player.
 * @param {number} lobbyId The lobby's id.
 * @returns {Boolean} True if sucessfully created. Otherwise false.
 */
Player.create = (socket, name, lobbyId) => {

  if (socket !== undefined && name !== undefined && lobbyId !== undefined) {
    socket.player = {
      name: name,
      lobbyId: lobbyId,
      id: socket.id
    }
    return true;
  }
  return false;
}


module.exports = {
  Player: Player
}