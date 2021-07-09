
/**
 * This file stores all non-user game-related routes and methods.
 */

const Word = require('./word').Word;
const Player = require('./player').Player;
const Strategy = require('./strategy').Strategy;
const io = require('../app').io;

function Game(team1, team2, lobbyId) {

  this.id = lobbyId;
  
  this.wordHandler = new Word();
  this.strategyManager = new Strategy(this.wordHandler);


  // Convert the dictionaries to arrays to enable iterating via index number. This is used 
  // so that the game can iterate through and choose which player takes on the role of speaker
  this.team1 = Array.from(team1.values());
  this.team2 = Array.from(team2.values());

  // Used to ensure that everyone has a turn where they speak
  this.team1speakerIndex = 0, this.team2speakerIndex = 0;

  this.state = "waiting"; // TODO: Implement a better solution for managing game state


  this.displayWord = () => {
    console.log("game: request: word");
    if (this.state === "playing") {
      console.log("getting a word to display");
      var currentWord = this.strategyManager.selectWord();
      console.log(currentWord);
      // console.log(currentWord);
      // this.io.to("lobby" + this.id).emit("update: word: ", currentWord);
    }
  }

  this.startGame = () => {
    var rand = Math.random();

    // Randomly choose which team starts first
    (rand > 0.5) 
      ? this.speakingTeam = team1
      : this.speakingTeam = team2;
  }


  this.startRound = (socket) => {
    this.state = "playing";

    // First handle iterating through list of players to choose a speaker
    this.setSpeaker();

    // Roll the dice to select which rule will be used, and then call the strategy/implementation
    // for that rule
    this.rollDice();
    this.strategyManager.runStrategy(this.speakerSocket, this, () => {

      // Let the players know the round is over, and don't allow the player to request words
      // until the next round starts
      this.speakerSocket.removeAllListeners("request: word");
      io.to("lobby" + this.id).emit("update: round over:");
      this.state = "waiting";
      console.log("round is over");

      // Testing purposes only
      const newRound = setTimeout(() => {
        console.log("new round starting");
        this.strategyManager = new Strategy(this.wordHandler); // New instance of strategy, to readd the listener
        // this.startRound(io, socket);
      }, 5000);
    });

    // Let all players know which rule was chosen. Game id is derived from lobby id.
    io.to("lobby" + this.id).emit("update: rule:", this.strategyManager.description);
    // Let all players knows who the speaker is
    io.to("lobby" + this.id).emit("update: speaker:", this.speakerSocket.player.name);
    // Inform the player who was chosen as speaker, that they're speaking for this round
    io.to(this.speakerSocket.id).emit("update: role: speaking");

  }


  this.setSpeaker = () => {
    var speaker;

    // First, handle who will be speaking
    if (this.speakingTeam === team1) {
      // console.log("Speaker for team 1 is: ", this.team1[this.team1speakerIndex]);
      speaker = this.team1[this.team1speakerIndex];
      this.speakingTeam = team2;

      // If all players in the team have spoken, reset back to the first speaker
      (this.team1speakerIndex == team1.size - 1)
        ? this.team1speakerIndex = 0
        : this.team1speakerIndex++;
    }
    else {
      // console.log("Speaker for team 2 is: ", this.team2[this.team2speakerIndex]);
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
        this.strategyManager.runStrategy = this.strategyManager.standardRule;
        break;
      case 1:
          this.strategyManager.runStrategy = this.strategyManager.noBodyLanguageRule;
        break;
      case 2:
          this.strategyManager.runStrategy = this.strategyManager.doubleRule;
        break;
      case 3:
          this.strategyManager.runStrategy = this.strategyManager.everybodyRule;
        break;
    }

    // NOTE: FOR NOW, JUST TEST USING THE STNDARD STRATEGY
    this.strategyManager.runStrategy = this.strategyManager.standardRule;

  }
  
  this.startGame();
};

module.exports = {
  Game: Game
}
