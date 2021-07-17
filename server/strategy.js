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

  this.setStrategy = (strategy) => {
    switch(strategy) {
      case "standard":
        this.name = "Standard strategy";
        this.description = "Standard rules. Each word the guesser gets right provides 1 " +
          "point, and each disqualified / forfeited word removes 1 point. Can't get below 0 points";
        this.seconds = 60; // Most rules, including the standard rules, feature 60 second rounds
        this.handler = this.standardRule;
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

      // Select a word and let client know what it is. Originally start with easiest words
      var currentWord = this.wordHandler.getWord(1);

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

      var tier = 1; // Start at the easiest tier of words

      speaker.on("request: word", () => {
        /**
         * Progressively increase the difficulty of words by incrementing by 0.25 each 
         * time a new card is requested and then using round down to the nearest integer. 
         * This means that the words will get more difficult every 4 cards requested.
         */
        tier += 0.25;
        currentWord = this.wordHandler.getWord(Math.floor(tier));

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


  this.doubleRule = (speaker, game) => {
    this.name = "Double";
    this.description = "Time is doubled!";
    io.to("lobby" + game.id).emit("update: " + this.description);

    this.countdown(10, game, () => {
      console.log("DOUBLE ROUND OVER");
      return;
    });
  }

  this.noBodyLanguageRule = (speaker, game) => {
    this.name = "No body language";
    this.description = "You cannot use body language";
    io.to("lobby" + game.id).emit("update: " + this.description);
    
    this.countdown(5, game, () => {
      console.log("NO BODY LANGUAGE ROUND OVER");
      return;
    });
  }

  this.everybodyRule = (speaker, game) => {
    this.name = "Everybody";
    this.description = "Everybody except the speaker can answer for this round!";
    io.to("lobby" + game.id).emit("update: " + this.description);

    this.countdown(5, game, () => {
      console.log("EVERYBODY ROUND OVER");
      return;
    });
  }
}

module.exports = {
  Strategy: Strategy
}
