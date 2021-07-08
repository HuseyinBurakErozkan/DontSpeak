"use strict";

/**
 * This module provides different implementations for various rules that a round of the game can have.
 * @module strategy 
 */

const Word = require('./word');

/**
 * This class handles calls to the different strategies
 */
class StrategyManager {
  constructor() {
    this.strategies = [];
  }

  addStrategy(strategy) {
    this.strategies = [...this.strategies, strategy];
  }

  getstrategy(name) {
    return this.strategies.find(strategy => strategy.name === name);
  }
}


/** Objects of this class provide different implementations, depending on the rule/dice roll */
class Strategy {
  /**
   * 
   * @param {string} name The name of the rule.
   * @param {string} description The description, which describes the rule to the user.
   * @param {function} handler The implementation of this specific rule.
   */
  constructor(name, description, handler) {
    this.name = name
    this.description = description;
    this.handler = handler;
    this.chosenWords = [];
  }

  /** Call the implementation */
  handleStrategy(io, socket, game) {
    this.handler(io, socket, game);
  }

  

}

const strategyStandard = new Strategy(
  "Standard",
  "Standard rules",
  (io, socket, game) => {
    io.to("lobby" + game.id).emit("update: " + this.description);
    console.log("STANDARD RULES CHOSEN");
    // Handle standard rules here
  }
);

const strategyDouble = new Strategy(
  "Double",
  "Time is doubled!",
  (io, socket, game) => {
    io.to("lobby" + game.id).emit("update: " + this.description);
    console.log("DOUBLE TIME!")
    // Handle double time rules here
  }
);

const strategyNobodyLanguage = new Strategy(
  "No body language",
  "You cannot use body language",
  (io, socket, game) => {
    io.to("lobby" + game.id).emit("update: " + this.description);
    console.log("NO BODY LANGUAGE");
    // Handle rules here
  }
);

const strategyEverybody = new Strategy(
  "Everybody",
  "Everybody except the speaker can answer for this round!",
  (io, socket, game) => {
    io.to("lobby" + game.id).emit("update: " + this.description);
    console.log("EVERYBODY JOINS");
    // Handle rules here
  }
);

const strategyManager = new StrategyManager();

strategyManager.addStrategy(strategyStandard);
strategyManager.addStrategy(strategyNobodyLanguage);
strategyManager.addStrategy(strategyDouble);
strategyManager.addStrategy(strategyEverybody);

module.exports = {
  StrategyManager: strategyManager
}