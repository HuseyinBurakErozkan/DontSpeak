
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

  // This is used for confirming that everyone agrees on the points the speaker has claimed
  this.playersConfirmed = [];
  
  // Convert the dictionaries to arrays to enable iterating via index number. This is used 
  // so that the game can iterate through and choose which player takes on the role of speaker
  this.team1 = Array.from(team1.values());
  this.team2 = Array.from(team2.values());

  this.team1Points = 0;
  this.team2Points = 0;

  this.pointsToWin = 30; // TODO: Allow players to alter this amount while in lobby

  // Used to ensure that everyone has a turn where they speak
  this.team1speakerIndex = 0, this.team2speakerIndex = 0;

  this.state = "waiting"; // TODO: Implement a better solution for managing game state

  
  /**
   * Attach listeners to the socket, so that game-related emitter events can be delegated from
   * the socket handler to the game
   * @param {object} socket The socket that is having listeners attached
   */
  this.addSocket = (socket) => {

    // Listen to when the user wants to move on to the next round
    socket.on('request: new round', () => {
      this.prepareRound();
    });
    
    // Listen to when user wants to start the round
    socket.on('request: start round', () => {
      this.startRound(socket);
    });

    // Listen to when a speaker claims how many points they've received. As the
    // points can't in any way be verified by the system, instead ask every player
    // and have them confirm it.
    socket.on("request: earned points amount", (amount) => {
      this.handleSpeakerClaimingPoints(socket, amount);
    });

    // Listen to when the players confirm the speaker's claim
    socket.on("response: confirm points", () => {
      this.handlePlayerConfirmingPoints(socket);
    });
  }


  this.startGame = () => {
    var rand = Math.random();

    // Randomly choose which team starts first
    (rand > 0.5) 
      ? this.speakingTeam = team1
      : this.speakingTeam = team2;
  }


  this.prepareRound = () => {
    // New rounds can only be requested while in waiting state. Must check for this as sockets
    // can request to start a new round at any time.
    if (this.state !== "waiting") {
      return false;
    }

    this.state = "prepared";
    
    // Clear the array that lists all the players who confirm the points earned at the end
    // of the previous round.
    this.playersConfirmed = [];

    // First handle iterating through list of players to choose a speaker
    this.setSpeaker();

    // Roll the dice to select which rule will be used, and then call the 
    // strategy/implementation for that rule
    this.rollDice();

    var playerTeam = this.getPlayerTeam(this.speakerSocket);
    var opposingTeam;
    var strNum;

    playerTeam === "team1" 
      ? (opposingTeam = this.team2, playerTeam = this.team1, strNum = "1")
      : (opposingTeam = this.team1, playerTeam = this.team2, strNum = "2");
    
    // Let all players know that they are ready to begin playing the round. Also provide
    // them with information about this particular round
    io.to("lobby" + this.id).emit(
      "response: new round", 
      this.strategyManager.name,
      this.strategyManager.description, 
      this.speakerSocket.player.name,
      strNum,
      this.strategyManager.seconds);

    io.to(this.speakerSocket.id).emit("update: role:", "speaker");


    // Let the player's teammate's clients know that they have the role of guesser
    for (var i = 0; i < playerTeam.length; i++) {
      // Don't emit to the speaker
      if (playerTeam[i] !== this.speakerSocket) {
        io.to(playerTeam[i].id).emit("update: role:", "guesser");
      }
    }

    // Let the other team know that they're the opposition
    for (var i = 0; i < opposingTeam.length; i++) {
      io.to(opposingTeam[i].id).emit("update: role:", "opposition");
    }
  }

  
  this.startRound = (socket) => {
    // Only start the round if the game is in the prepared state, and only allow the speaker
    // to start the round, since they will need to be ready.
    if (this.state === "prepared" && socket === this.speakerSocket) {
    
      this.state = "playing";

      this.strategyManager.runStrategy(this.speakerSocket, this, () => {
        // Let the players know the round is over, and don't allow the player to request words
        // until the next round starts
        this.speakerSocket.removeAllListeners("request: word");

        // Round is over
        this.endRound();
      });
    } else {
      return false;
    }
  }


  this.endRound = () => {
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
    var rand = Math.floor(Math.random() * 5);

    switch(rand) {
      case 0:
        this.strategyManager.setStrategy("standard");
        break;
      case 1:
        this.strategyManager.setStrategy("no body language");
        break;
      case 2:
        this.strategyManager.setStrategy("double");
        break;
      case 3:
        this.strategyManager.setStrategy("high difficulty");
        break;
      case 4:
        this.strategyManager.setStrategy("thief");
        break;
      default:
        this.strategyManager.setStrategy("standard");
        break;
    }
  }
  

  this.getPlayerTeam = (socket) => {
    var player = this.team1.find(s => s.id === socket.id);

    if (socket === undefined) {
      throw new Error("getPlayerTeam(): sockeet is undefined");
    }

    if (player !== undefined) {
      return "team1";
    } else {
      player = this.team2.find(s => s.id === socket.id);
      if (player !== undefined) {
        return "team2";
      }
    }

    // Throw an exception if somehow the player couldn't be found in either team
    throw `Socket ${socket.id} could not be found in either team`;
  }


  this.handleSpeakerClaimingPoints = (socket, amount) => {
    console.log("socket: request: earned points");
      
    // Don't allow the amount to be negative
    if (amount < 0) {
      throw "Amount of points earned can't be below 0";
    }

    // The speaker may alter the amount of points they believe they earned after they've initially
    // entered a number. Therefore, empty the array of players who have confirmed, as they must re-confirm.
    this.playersConfirmed = [];

    if (this.state === "tallying" && socket === this.speakerSocket && /^\d+$/.test(amount)) {
      console.log("socket claiming earned points is the speaker socket, so continue");

      socket.player.pointsClaimed = amount; // Add the points claimed as a property.

      this.playersConfirmed.push(this.speakerSocket);
      // Ask everyone to confirm the amount of points the speaker claims they've earned.
      // Except the speaker themselves of course.
      for (var i = 0; i < this.team1.length; i++) {
        if (this.team1[i] === socket) { continue; }

        console.log("emitting to " + this.team1[i].player.name + ". Speaker is: " + this.speakerSocket.player.name + ". Points: " + amount);
        io.to(this.team1[i].id).emit("request: confirm points claim", this.speakerSocket.player.name, amount);
      }
      for (var i = 0; i < this.team2.length; i++) {
        if (this.team2[i] === socket) { continue; }
        console.log("emitting to " + this.team2[i].player.name)
        io.to(this.team2[i].id).emit("request: confirm points claim", this.speakerSocket.player.name, amount);
      }
    }
  }


  this.handlePlayerConfirmingPoints = (socket) => {
    if (this.state === "tallying" && socket !== this.speakerSocket) {

      // Ignore any players who have already confirmed the current point claim
      if (this.playersConfirmed.indexOf(socket) != -1) {
        return;
      }

      // Add to array of confirmed players. Once all players have confirmed, the round is
      // considered over. Tally up the points and handle all score-related functionality
      this.playersConfirmed.push(socket);

      if (this.playersConfirmed.length === (this.team1.length + this.team2.length)) {
        console.log("Everyone has confirmed the points");

        var pointsAmount = parseInt(this.speakerSocket.player.pointsClaimed, 10);
        this.speakerSocket.player.pointsClaimed = undefined; // Remove the property once used.

        // Ask the strategy manager to handle the points. The strategy manager will
        // modify the points according to the rule chosen for the round.
        this.strategyManager.handlePoints(
          pointsAmount, 
          this.team1Points, 
          this.team2Points, 
          this.getPlayerTeam(this.speakerSocket),
          (currentTeamPoints, opposingTeamPoints) => {
            // Callback above is called by the strategy after it has tallied each team's points

            var currentTeam, opposingTeam;

            // Check which team the speaker and guesser were in for this round, so
            // the game can check if they have won.
            if (this.getPlayerTeam(this.speakerSocket) === "team1") {
              currentTeam = this.team1;
              opposingTeam = this.team2;
              this.team1Points = currentTeamPoints;
              this.team2Points = opposingTeamPoints;
            } else {
              currentTeam = this.team2;
              opposingTeam = this.team1;
              this.team2Points = currentTeamPoints;
              this.team1Points = opposingTeamPoints;
            }

            // Check if a team has won or not
            if (currentTeamPoints >= this.pointsToWin) {
              this.state = "gameover";

              for (var i = 0; i < currentTeam.length; i++) {
                io.to(currentTeam[i].id).emit(
                  "update: won", this.team1Points, this.team2Points, this.pointsToWin);
              }
              for (var i = 0; i < opposingTeam.length; i++) {
                io.to(opposingTeam[i].id).emit(
                  "update: lost", this.team1Points, this.team2Points, this.pointsToWin);
              }

              return; // Don't emit anything else after this point, as the game is already over
            }

            // Team hasn't won yet, so continue. Change state to waiting, so that players 
            // can begin the new round when they're ready
            io.to("lobby" + this.id).emit(
              "update: points: ", this.team1Points, this.team2Points, this.pointsToWin);
            this.state = "waiting";
          });
      }
    }
  }

  this.removeSocket = (socket) => {

  }
  
  this.startGame(); // Start the game when this object is initialised
};

module.exports = {
  Game: Game
}
