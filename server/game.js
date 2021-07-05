/**
 * This file stores all non-user game-related routes and methods.
 */

const Word = require('./word');
const Player = require('./player').Player;

function Game(team1, team2) {

  this.team1 = team1, this.team2 = team2;

  // Used to ensure that everyone has a turn where they speak
  this.team1speakerIndex = 0, this.team2speakerIndex = 0;
  this.chosenWords = new Map(); // 

  this.startGame = () => {
    var rand = Math.random();

    // Randomly choose which team starts first
    (rand > 0.5)
      ? this.speakingTeam = team1
      : this.speakingTeam = team2;
  }

  this.startRound = () => {
    
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
        this.roll = Roll.STANDARD;
        break;
      case 1:
        this.roll = Roll.NOBODYLANGUAGE;
        break;
      case 2:
        this.roll = Roll.DOUBLE;
        break;
      case 3:
        this.roll = Roll.EVERYBODY;
        break;
    }
  }

  this.startGame();

}


/**
 * Use ES6 class to implement enum patten 
 */
class Roll {
  static STANDARD = new Roll("standard rules");
  static NOBODYLANGUAGE = new Roll("no body language allowed");
  static DOUBLE = new Roll("double time");
  static EVERYBODY = new Roll("everybody guesses");
  // TODO: Add a rule where once selected, only the most difficult words are used.
  // TODO: Think of and add some more interesting rules

  constructor(description) {
    this.description = description;
  }

  getDescription() {
    return this.description;
  }
}

module.exports = {
  Game: Game
}
