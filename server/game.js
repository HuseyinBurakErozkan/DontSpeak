
/**
 * This file stores all non-user game-related routes and methods.
 */

const Word = require('./word');
const Player = require('./player').Player;
const strategyManager = require('./strategy').StrategyManager;

function Game(team1, team2, lobbyId) {

  this.id = lobbyId;

  // Convert the dictionaries to arrays to enable iterating via index number. This is used 
  // so that the game can iterate through and choose which player takes on the role of speaker
  this.team1 = Array.from(team1.values());
  this.team2 = Array.from(team2.values());

  // Used to ensure that everyone has a turn where they speak
  this.team1speakerIndex = 0, this.team2speakerIndex = 0;

  this.chosenWords = new Map(); // Stores list of words that have been chosen before, to avoid repeats
  this.strategy;

  this.state = "waiting"; // TODO: Implement a better solution for managing game state

  this.startGame = () => {
    var rand = Math.random();

    // Randomly choose which team starts first
    (rand > 0.5) 
      ? this.speakingTeam = team1
      : this.speakingTeam = team2;
  }


  this.startRound = (io, socket) => {
    this.state = "playing";

    // First handle iterating through list of players to choose a speaker
    this.setSpeaker();

    // Roll the dice to select which rule will be used, and then call the strategy/implementation
    // for that rule

    this.rollDice();
    if (io !== undefined) {
      // Let all players know which rule was chosen. Game id is derived from lobby id.
      io.to("lobby" + this.id).emit("update: rule:", this.strategy.description);
      // Let all players knows who the speaker is
      io.to("lobby" + this.id).emit("update: speaker:", this.speakerSocket.player.name);
      // Inform the player who was chosen as speaker, that they're speaking for this round
      io.to(this.speakerSocket.id).emit("update: role: speaking");
    }
    else {
      throw Error("io is undefined");
    }

    this.strategy.handleStrategy(io, socket, this);
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


  this.selectWord = () => {
    var word;
    var randIndex = Math.floor(Math.random() * Word.words.size);

    // Check if word was already selected, and if so, choose a new word.
    while (word === undefined || this.chosenWords.get(randIndex)) {
      word = Word.words.get(randIndex);
    }

    // Add to the list of already chosen words to ensure its not picked again
    this.chosenWords.set(randIndex, word);

    return word;
  }

  this.rollDice = () => {
    // Roll twice, and use the lower of the 2 values. This is so that the more game-changing
    // rules/rolls are rolled less often.
    var rand = Math.min(Math.floor(Math.random() * 4), Math.floor(Math.random() * 4));
    
    switch(rand) {
      case 0:
        this.strategy = strategyManager.getstrategy("Standard");
        break;
      case 1:
        this.strategy = strategyManager.getstrategy("No body language");
        break;
      case 2:
          this.strategy = strategyManager.getstrategy("Double");
        break;
      case 3:
          this.strategy = strategyManager.getstrategy("Everybody");
        break;
    }
  }

  this.startGame();
};

module.exports = {
  Game: Game
}
