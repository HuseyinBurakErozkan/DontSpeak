"use strict";

const io = require('../app').io

/**
 * This module provides different implementations for various rules that a round of the game can have.
 * @module strategy 
 */

function Strategy(wordHandler) {

  this.wordHandler = wordHandler;
  this.wordsPlayedThisRound = [];
  this.handler;
  this.startingTier; // What tier/difficulty of words the rule will start at
  this.tierIncrement; // How fast the words will get more difficult

  this.setStrategy = (strategy) => {
    switch(strategy) {
      case "standard":
        this.name = "Standard rules";
        this.description = "Standard rules. Each word the guesser gets right provides 1 " +
          "point, and each disqualified / forfeited word removes 1 point.";
        this.seconds = 4; // Most rules, including the standard rules, feature 60 second rounds
        this.handler = this.standardRule;
        this.startingTier = 1; // Easiest tier of words first
        this.tierIncrement = 0.25; // Every 4 words, the tier increases
        break;

      // This rule is almost identical to the standard rules, except for the amount of time 
      // and rising difficulty of words. In that case, the standardRule handler can be used 
      // as just the seconds needs to change.
      case "double":
        this.name = "Double time";
        this.description = 
          "Time is doubled! This round last 120 seconds. Words will be a little more difficult.";
        this.seconds = 8;
        this.handler = this.standardRule;
        this.startingTier = 1;
        this.tierIncrement = 0.34; // Every 3 words, the tier increases
        break;

      // This rule is identical mechanically to the standard rule, as the 'no body
      // language' rule must be enforced by the players themselves. Therefore, call
      // standard rule handler.
      case "no body language":
        this.name = "No body language allowed";
        this.description =
          "The speaker can not use any body language to describe words. Doing so will forfeit the word";
        this.seconds = 4;
        this.handler = this.standardRule;
        this.startingTier = 1;
        this.tierIncrement = 0.25;
        break;

      case "triple point shuffle":
        this.name = "Triple point shuffle";
        this.description = 
          "The primary taboo word is chosen randomly from the 5 words on the card. " +
          "It takes a few seconds to land on the word. However, the speaker can still " +
          "describe the words as the primary word is being chosen!";
        this.seconds = 60;
        this.handler = this.tripleShuffleRule;
        this.startingTier = 1;
        this.tierIncrement = 0.25;
        break;

      // As thie rule only changes the starting tier and incrementation, can use the 
      // standard strategy
      case "high difficulty":
        this.name = "Ramping difficulty";
        this.description =
          "More difficult words will be chosen for this round";
        this.seconds = 60;
        this.handler = this.standardRule;
        this.startingTier = 2;
        this.tierIncrement = 0.5;
        break;

      case "thief":
        this.name = "Thief's delight";
        this.description =
          "Every point the speaker's team earns is also deducted from the other team! "
          "However, the round is shorter";
        this.seconds = 45;
        this.handler = this.thiefRule;
        this.startingTier = 1;
        this.tierIncrement = 0.34;
        break;
    }
  }

  this.runStrategy = (speaker, game, callback) => {
    // Reinitialise the array that stores each round's words used
    this.wordsPlayedThisRound = [];
    this.handler(speaker, game, callback);
  }

  this.countdown = (seconds, game, callback) => {
    try {
      var i = seconds;

      var countdownTimer = setInterval(() => {
        // io.to("lobby" + game.id).emit("update: seconds left: ", i);     
        i--;
        console.log(i + "seconds left");

        if (i === 0) {
          clearInterval(countdownTimer);
          callback();
        }
      }, 1000);
    } catch(e) {
      console.log(e);
    }
  }

  this.standardRule = (speaker, game, callback) => {

    try {
      io.to("lobby" + game.id).emit("update: starting", this.seconds);

      // Select a word and let client know what it is. Start from the original tier at first
      var currentWord = this.wordHandler.getWord(this.startingTier);

      // Push the word to the array, so that at the end of the round, players can review
      // the words that were dispalyed
      this.wordsPlayedThisRound.push(currentWord);

      // Emit to the speaker and the other team - don't allow the client of the
      // guessing player to receive information about the current word
      io.to(speaker.id).emit("update: word: ", currentWord); // Speaker needs to see the word

      var playerTeam = game.getPlayerTeam(speaker);
      var opposingTeam;

      playerTeam === "team1" 
        ? (opposingTeam = game.team2, playerTeam = game.team1)
        : (opposingTeam = game.team1, playerTeam = game.team2);

      if (opposingTeam === undefined) {
        throw "Error: standard strategy: Player opposing team is defined";
      }

      // Let all players in the opposing team know what the word is, so they dispute
      // when the speaker accidently says one of the taboo words
      for (var i = 0; i < opposingTeam.length; i++) {
        io.to(opposingTeam[i].id).emit("update: word: ", currentWord);
      }

      var tier = this.startingTier;

      speaker.on("request: word", () => {
        /**
         * Progressively increase the difficulty of words by incrementing by the rule's
         * given increment value, each time a new card is requested. Then round down to
         * the nearest integer. This means that words will typically get more difficult.
         * For example: standard rule has a tierIncrement value of 0.25. This means that
         * every 4 cards, the difficulty of words will rise by a tier.
         */
        tier += this.tierIncrement;
        currentWord = this.wordHandler.getWord(Math.floor(tier));
        console.log("tier is " + tier + ". Word is: ", currentWord);

        // Push the word to the array, so that at the end of the round, players can review
        // the words that were dispalyed
        this.wordsPlayedThisRound.push(currentWord);
        
        // Emit to the speaker and the other team - don't allow the client of the
        // guessing player to receive that information
        io.to(speaker.id).emit("update: word: ", currentWord); // Speaker needs to see the word

        // Let all players in the opposing team know what the word is, so they dispute
        // when the speaker accidently says one of the taboo words
        for (var i = 0; i < opposingTeam.length; i++) {
          io.to(opposingTeam[i].id).emit("update: word: ", currentWord);
        }
      });

      this.countdown(this.seconds, game, () => {
        callback();
      });
    } catch(e) {
      console.log(e);
    }
  }

  this.tripleShuffleRule = (speaker, game, callback) => {

  }

  this.thiefRule = (speaker, game, callback) => {

  }

}

module.exports = {
  Strategy: Strategy
}
