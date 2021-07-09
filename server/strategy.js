"use strict";

const io = require('../app').io

/**
 * This module provides different implementations for various rules that a round of the game can have.
 * @module strategy 
 */

function Strategy(wordHandler) {

  this.wordHandler = wordHandler;

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

      this.name = "Standard";
      this.description = "Standard rules";

      io.to("lobby" + game.id).emit("update: " + this.description);

      // Select a word and let client know what it is. Originally start with easiest words
      var currentWord = this.wordHandler.getWord(1);
      io.to("lobby" + game.id).emit("update: word: ", currentWord);

      var tier = 1; // Start at the easiest tier of words

      speaker.on("request: word", () => {
        /**
         * Progressively increase the difficulty of words by incrementing by 0.25 each 
         * time a new card is requested and then using round down to the nearest integer. 
         * This means that the words will get more difficult every 4 cards requested.
         */
        tier += 0.25;
        currentWord = this.wordHandler.getWord(Math.floor(tier));
        io.to("lobby" + game.id).emit("update: word: ", currentWord);
      });

      this.countdown(30, game, () => {
        callback();
      });
    } catch(e) {
      // console.log(e);
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
