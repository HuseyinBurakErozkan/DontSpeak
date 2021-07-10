
/**
 * This file stores all non-user game-related routes and methods.
 */

const Word = require('./word').Word;
const Player = require('./player').Player;
const Strategy = require('./strategy').Strategy;
const io = require('../app').io;

function Game(team1, team2, lobbyId) {

  this.id = lobbyId;
  
  // Create a new word handler object, specifically for this game.
  this.wordHandler = new Word();
  this.strategyManager = new Strategy(this.wordHandler);

  /**
   * Attach listeners to the socket, so that game-related emitter events can be delegated from
   * the socket handler to the game
   * @param {object} socket The socket that is having listeners attached
   */
  this.addSocket = (socket) => {

    socket.on('request: new round', () => {

      // New rounds can only be requested while in waiting state
      if (this.state !== "waiting") {
        return;
      }

      this.prepareRound();
      // Let all players know that they are ready to begin playing the round. Also provide
      // them with information about this particular round
      io.to("lobby" + this.id).emit(
        "response: new round", 
        this.strategyManager.name,
        this.strategyManager.description, 
        this.speakerSocket.player.name);

      io.to(this.speakerSocket.id).emit("update: role: speaking");
    });
    
    // Listen to when user wants to start begin the round
    socket.on('request: start round', () => {

      // Only the speaker is allowed to ask for the round to start
      if (this.state === "prepared" && socket === this.speakerSocket) {
        this.startRound(socket);
      } else {
        console.log("Game: Request: start round: The socket requesting is not the speaker")
        // console.log(socket);
        // console.log(this.speakerSocket);
      }
    });
  }

  this.removeSocket = (socket) => {

  }

  // Convert the dictionaries to arrays to enable iterating via index number. This is used 
  // so that the game can iterate through and choose which player takes on the role of speaker
  this.team1 = Array.from(team1.values());
  this.team2 = Array.from(team2.values());

  // Used to ensure that everyone has a turn where they speak
  this.team1speakerIndex = 0, this.team2speakerIndex = 0;

  this.state = "waiting"; // TODO: Implement a better solution for managing game state


  this.startGame = () => {
    var rand = Math.random();

    // Randomly choose which team starts first
    (rand > 0.5) 
      ? this.speakingTeam = team1
      : this.speakingTeam = team2;
  }
  
  this.startGame();


  this.prepareRound = (socket) => {
    this.state = "prepared";

    // First handle iterating through list of players to choose a speaker
    this.setSpeaker();

    // Roll the dice to select which rule will be used, and then call the strategy/implementation
    // for that rule
    this.rollDice();    
  }

  
  this.startRound = (socket) => {
    this.state = "playing";

    this.strategyManager.runStrategy(this.speakerSocket, this, () => {
      // Let the players know the round is over, and don't allow the player to request words
      // until the next round starts
      this.speakerSocket.removeAllListeners("request: word");

      // Round is over
      this.handleRoundEnd();
    });
  }

  this.handleRoundEnd = () => {
    // Send the array of words that were played, so that the frontend can display
    // them all to the players for review
    io.to("lobby" + this.id).emit(
      "update: round over", (this.strategyManager.wordsPlayedThisRound));
    this.state = "tallying";

  }

  this.setSpeaker = () => {
    var speaker;

    // First, handle who will be speaking
    if (this.speakingTeam === team1) {
      speaker = this.team1[this.team1speakerIndex];
      this.speakingTeam = team2;

      // If all players in the team have spoken, reset back to the first speaker
      (this.team1speakerIndex == team1.size - 1)
        ? this.team1speakerIndex = 0
        : this.team1speakerIndex++;
    }
    else {
      speaker = this.team2[this.team2speakerIndex];
      this.speakingTeam = team1;

      // If all players in the team have spoken, reset back to the first speaker
      (this.team2speakerIndex == team2.size - 1)
        ? this.team2speakerIndex = 0
        : this.team2speakerIndex++;
    }

    // Ensure that the round has a speaker, otherwise don't allow the game to continue
    if (speaker === undefined) {
      throw "Speaker is undefined";
    }

    this.speakerSocket = speaker;
  }

  this.rollDice = () => {
    // Roll twice, and use the lower of the 2 values. This is so that the more game-changing
    // rules/rolls are rolled less often.
    var rand = Math.min(Math.floor(Math.random() * 4), Math.floor(Math.random() * 4));
    
    switch(rand) {
      case 0:
        this.strategyManager.setStrategy("standard");
        break;
      case 1:
        this.strategyManager.setStrategy("no body language");
        break;
      case 2:
        this.strategyManager.setStrategy("double time");
        break;
      case 3:
        this.strategyManager.setStrategy("everybody");
        break;
    }

    // NOTE: For now, test using just the standard strategy
    // this.strategyManager.runStrategy = this.strategyManager.standardRule;
    this.strategyManager.setStrategy("standard");
  }
  

  this.getPlayerTeam = (socket) => {
    var player = this.team1.find(s => s.id === socket.id);

    if (player !== undefined) {
      return "team1";
    } else {
      player = this.team2.find(s => s.id === socket.id);
      if (player !== undefined) {
        return "team2";
      }
    }
  }
};

module.exports = {
  Game: Game
}
