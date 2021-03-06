$(":input").attr("autocomplete", "off");

// Initially instruct the user on how to understand and use the UI. Display the flash
// message after a short delay so the user clearly see's that it's a flash message
setTimeout(() => {
  flash(tutorialMsgs.intro, "information");
}, 500);

var role; // Used to define what role the current player has in each round

var t1CurrentPoints = 0; // Team 1's current points
var t2CurrentPoints = 0; // Team 2's current points

var toggleHelpOn = true; // Whether to display helpful hints or not. On by default.


/**
 * Handles switching between the logically separated 'screens' throughout the app
 * of the app  
 * @param {String} toScreenId The Id of the html div element to display
 */
function changeScreen(toScreenId) {
  // Use Jquery's implicit iteration to just hide every screen, then display the 
  // correct screen
  $(".screen").addClass("--display-hidden");
  $("#"+toScreenId).removeClass("--display-hidden");

  removeEventListeners();

  // Scroll to the bottom - useful on Android browsers. When displaying cards however,
  // the screen should scroll to the top, otherwise, the player may have a hard time
  // seeing the word at first
  if (toScreenId !== "screen-word") {
    window.scrollTo(0,document.body.scrollHeight);
  } else {
    window.scrollTo(0, 0);
  }
}


/**
 * Called once players have asked to start a game and the server has responded
 */
socket.on("response: game started", () => {
  socket.emit("request: new round");
});

/**
 * Called when a server starts a new round.
 */
socket.on("response: new round", (ruleName, ruleDesc, speaker, speakerTeam, seconds) => {
  changeScreen("screen-round-ready");
  $("#p-rule-name").text(ruleName);
  $("#p-rule-description").text(ruleDesc);
  $("#p-speaker").text(`${speaker} from team ${speakerTeam} is the speaker!`);
  $("#p-seconds").html(`<b>${seconds}</b> seconds`);
});

/**
 * Called after the server has started a new round and assigned roles to players 
 */
socket.on("update: role:", (playerRole) => {

  switch (playerRole) {
    /**
     * Only the speaker is allowed to start the game. Therefore, add a button specifically
     * for when the player is a speaker, which sends a request to the server.
     */
    case "speaker":
      role = "speaker";
      // Instruct the speaker on what they need to do for the round
      flash(tutorialMsgs.speakerInstruction, "information");
    
      // Alter the text on the ready screen to address the speaker directly
      $("#p-speaker").text(`You're the speaker!`);
    
      // Add a start button only the speaker can click, for when they're ready to start
      // describing the words
      var button = $("<button/>")
        .text("Start!")
        .addClass("button-primary")
        .click(() => {
          socket.emit("request: start round");
        });
      button.attr("id", "speaker-start-button");
    
      $("#div-ready-container").append(button);
      break;

    case "guesser":
      role = "guesser";
      // Instruct the guessers on what they need to do
      flash(tutorialMsgs.guesserInstruction, "information");  
      break;

    case "opposition":
      role = "opposition";
      // Instruct the opposition on what they need to do
      flash(tutorialMsgs.oppositionInstruction, "information");
      break;
    
    default:
      flash("Error: There was an issue with the server");
  }
});

/**
 * Called when a word has been chosen by the server
 */
socket.on("update: word: ", (word) => {

  /**
   * Check if the round has just started. If so, add the touch listeners to allow
   * the player to swipe left or right for a new card.
   */

   // The screen is not being displayed, meaning the round has just started
  if ($("#screen-word").hasClass("--display-hidden")) {
    changeScreen("screen-word");

    if (role === "speaker") {
      // Add touch listeners to recognise when speaker swipes for a new card
      // Also listen for when a user hits space bar - the default key for requesting a card
      addEventListeners({ 
        left: () => { socket.emit("request: word"); }, 
        right: () => { socket.emit("request: word"); },
        spaceKey: () => { socket.emit("request: word"); }
      });

    }
  }
  
  // Clear the card of words
  var card = $("#div-word-card-container");
  card.empty();
  var primaryDiv = $("<div/>", { id: "div-word-primary", class: "word-primary" });
  var secondaryDiv = $("<div/>", { id: "div-word-secondary", class: "word-secondary" });
  card.append(primaryDiv);
  card.append(secondaryDiv);

  // Display the primary taboo word to be said
  var element = $("<p></p>").text(word[0]);
  $("#div-word-primary").append(element);

  // Now display all the words that the player can't say
  var secondaryWords = word[1];
  for (var i = 0; i < secondaryWords.length; i++) {
    var elementSecondaryWord = $("<p></p>").text(secondaryWords[i]);
    $("#div-word-secondary").append(elementSecondaryWord);
  }
});


/**
 * Emitted by the sever once the round is finished. 
 */
socket.on("update: round over", (wordsPlayed) => {

  /**
   * Display a screen showing all the cards the speaker has looked at, so that
   * the players and speaker can review them and input the amount of words they
   * got right or wrong
   */
  var reviewScreen = $("#screen-review");
  reviewScreen.empty(); // Empty the review screen of previous words that may have been displayed
  changeScreen("screen-review");
  
  // Explain to the speaker what they have to do in this step
  if (role === "speaker") {
    flash(tutorialMsgs.roundOverSpeakerInstruction, "information");
  } else if (role === "guesser") { 
    flash(tutorialMsgs.roundOverGuesserInstruction, "information");
  } else {
    flash(tutorialMsgs.roundOverOppositionInstruction, "information"); 
  }

  // Display all the cards/words played this round
  for (var i = 0; i < wordsPlayed.length; i++) {
    var wordCard = $("<div/>")
      .addClass("word-card");

    var primaryWord = $("<p/>")
      .text(wordsPlayed[i][0])
      .addClass("word__primary");   
    wordCard.append(primaryWord);
    reviewScreen.append(wordCard);

    for (var j = 0; j < 4; j++) {
      wordCard.append(
        $("<p/>")
          .text(wordsPlayed[i][1][j])
          .addClass("word__secondary"));
    }
  }

  /**
   * The speaker will have to input the amount of points they believe they scored,
   * so display an input field and button if the player is this round's speaker
   */
  if (role === "speaker") {
    // Display the ui input where the user can enter the amount of points they've earned
    $("#speaker-enter-points").removeClass("--display-hidden");   

    var inputField = $("#input-points-earned");
    var claimPointsButton = $("#button-confirm-points");

    // Speaker hits enter
    inputField.on("keydown", (e) => {
      if(e.which == 13) {
        // Tell the server the amount of points that the speaker has claimed they earned
        sendPointClaim(inputField.val());
      } else {
        // If the user is reentering a value in the input field, check if the button
        // is showing the tick, indicating that the previous input was confirmed. If
        // so, change the button back to a non-confirmed state to indicate that the
        // the user must confirm again
        if (claimPointsButton.text() === "???") {
          claimPointsButton.text("Confirm");
          claimPointsButton.removeClass("--confirmed");
        }
      }
    });

    // Speaker clicks the confirm button
    claimPointsButton.on("click", (e) => {
      // Tell the server the amount of points that the speaker has claimed they earned
      sendPointClaim(inputField.val());
    });
  }
});


/**
 * Handle the speaker asserting the amount of points they earned for a round, by
 * send a request to the server.
 * @param {number} pointsAmt The amount of points the speaker claims they earned
 */
function sendPointClaim(pointsAmt) {
  // Only try emit if the inputted value is an integer that is above 0.
  if (/^\d+$/.test(pointsAmt)) {
    console.log("emitted");

    // Send a request to the server to update the points by the amoun the player has earned
    socket.emit("request: earned points amount", pointsAmt);

    // Since the input is valid the request was emitted to server, toggle the confirm
    // button so that it displays a tick - Should be useful as visual feedback
    var claimPointsButton = $("#button-confirm-points");
    claimPointsButton.text("???");
    claimPointsButton.addClass("--confirmed");
  } else {
    flash("Error: You need to input a positive whole number. Minimum score must be 0 as you can't lose points", "error");
  }
}

/**
 * Emitted by the server, to request all non-speaker players to confirm the amount
 * of points the speaker claims they earned.
 * @param {string} speaker The speaker's name
 * @param {number} amount The amount of points the speaker claims they earned
 */
socket.on("request: confirm points claim", (speaker, amount) => {

  /**
   * As the speaker may input a new value after they have already requested the
   * server to update their points, check if the confirm button is already 'toggled'.
   * If so, ask the player to re-confirm the new point amount the speaker has claimed
   * to earn.
   */
  var confirmButton = $("#button-confirm-claim");
  if (confirmButton.text() === "???") {
    confirmButton.removeClass("--confirmed");
    confirmButton.text("Confirm");
  }

  // Remove and reattach the listener each time the server asks to confirm
  $("#button-confirm-claim").off("click", "**");

  // Show the confirm ui element
  $("#player-confirm-points").removeClass("--display-hidden");
  $("#confirm-text").text(`Did ${speaker} earn ${amount} points?`);

  /**
   * If the player agrees that the speaker has earned the amount of points they claimed,
   * send a response to the server confirming it.
   */
  $("#button-confirm-claim").on("click", (e) => {
    socket.emit("response: confirm points");

    // Change the button to display a tick - Nice for visual feedback
    confirmButton.addClass("--confirmed");
    confirmButton.text("???");
  });
});

/**
 * Emitted by the server after the speaker's score has been confirmed
 */
socket.on("update: points: ", (t1Points, t2Points, pointsNeeded) => {
  handlePointUpdate(t1Points, t2Points, pointsNeeded);
});

/**
 *
 * @param {number} t1Points Team 1's current points
 * @param {number} t2Points Team 2's current points
 * @param {number} pointsNeeded Amount of points needed to win the game
 */
function handlePointUpdate(t1Points, t2Points, pointsNeeded) {
  
  // Hide the ui elements that were instantiated for the previous round
  $("#speaker-enter-points").addClass("--display-hidden"); // The speaker's enter point dialog
  $("#player-confirm-points").addClass("--display-hidden"); // The 'confirm points' dialog
  $("#speaker-start-button").remove(); // Remove the start button that displays for the speaker

  // Change state of the 'confirmable' buttons from the review screen, so they're no
  // longer confirmed.
  $("#button-confirm-claim").removeClass("--confirmed");
  $("#button-confirm-points").text("Confirm");
  $("#button-confirm-points").removeClass("--confirmed");
  // Clear the input field where the user enters the amount of points they earned
  $("#input-points-earned").val("");

  changeScreen("screen-scores");

  console.log(`team1 points: ${t1Points} \nteam2 points: ${t2Points} \npoints needed to win: ${pointsNeeded}`)

  // Increment or decrement the scores, as players will more easily understand 
  // what they're looking at when they see scores actively changing
  var t1PrevPoints = $("#t1-scores").first().text();
  var t2PrevPoints = $("#t2-scores").first().text();

  // Set the text of each team's scores to the PREVIOUS point amount
  $("#t1-scores").text(`Team 1 score: ${t1CurrentPoints}`);
  $("#t2-scores").text(`Team 2 score: ${t2CurrentPoints}`);
  $("#points-needed").html(`Score needed to win: <b>${pointsNeeded}</b>`);

  
  // Update the displayed scores for both teams
  updateScoreDisplay(t1Points, t1CurrentPoints, 1);
  updateScoreDisplay(t2Points, t2CurrentPoints, 2);

  // Update the point values
  t1CurrentPoints = t1Points;
  t2CurrentPoints = t2Points;
}

/**
 * 
 * @param {number} newPoints The team's score before the current round
 * @param {number} prevPoints The team's score after the current round
 * @param {number} teamNumber The team whose score is being updted - either 1 or 2 
 */
function updateScoreDisplay(newPoints, prevPoints, teamNumber) {

  var textElement = $("#t" + teamNumber + "-scores");
  var scoreText = `Team ${teamNumber} score: `;
  var i = prevPoints;

  // Add a small delay before incrementing or decrementing, otherwise the user 
  // may not notice it
  var delay = setTimeout(() => {
    clearTimeout(delay);

    // As some rules may decrease a team's score, must check to see if the team 
    // has gained or lost points this round
    if (newPoints > prevPoints) {
      var scoreUpdater = setInterval(() => {    
        i++;
        textElement.html(`${scoreText} <b>${i}</b`); // Display the incrementing score

        // The text now displays the team's current score, so stop incrementing
        if (i === newPoints) {
          clearInterval(scoreUpdater);
        }
      }, 100);
    } else if (newPoints < prevPoints) {
      var scoreUpdater = setInterval(() => {    
        i--;
        textElement.html(`${scoreText} <b>${i}</b`); // Display the decrementing score

        if (i === newPoints) {
          clearInterval(scoreUpdater);
        }
      }, 100);
    } else { // Handle the edge where a team may get no points
      // By default, nothing needs to be done, as it will show the previous score
      // But maybe add some visual feedback to show the players that no points were earned
    }
  }, 500);
}

/**
 * Send request to the server to start another round.
 */
function nextRound() {
  socket.emit("request: new round");
}

/**
 * Emitted by the server when the player's team has lost
 */
socket.on("update: lost", (t1Points, t2Points, pointsNeeded) => {
  handlePointUpdate(t1Points, t2Points, pointsNeeded);

  // Hide the next round button, as the game is over
  $("#button-next-round").addClass("--display-hidden");
  $("#gameover-text").html("<b>You lost :(</b>");
});

socket.on("update: won", (t1Points, t2Points, pointsNeeded) => {
  handlePointUpdate(t1Points, t2Points, pointsNeeded);

  $("#button-next-round").addClass("--display-hidden");
  $("#gameover-text").html("<b>Congratulations! You won!</b>");
});


/**
 * On receiving notification that the round is starting, display the timer on the ui
 */
socket.on("update: starting", (seconds) => {
  showTimer(seconds);

  // Hide any open flash messages, so they don't cover any of the words as the user
  // starts the round
  $(".flash-dialog").addClass("--hide");

  // Display the countdown screen for the guesser, as they will not be shown 
  // the word screen
  if (role === "guesser") {
    changeScreen("screen-countdown");
    var secondsLeft = seconds - 1;
    
    var countdown = setInterval(() => {
      $("#seconds-left").text(secondsLeft);
      secondsLeft--;

      if (secondsLeft === 0) {
        clearInterval(countdown);
      }
    }, 1000);
  }
});


function showTimer(startingSeconds) {
  var secondsLeft = startingSeconds;
  
  // Create the ui element
  var timerDiv = $("<div/>", { 
    id: "div-game-ui-timer",
    class: "game-ui-timer-container"  
  });

  var secondsText = $("<p/>", { id: "game-ui-timer-text"})

  // Add the ui elements to the DOM
  $(".app-container").append(timerDiv);
  timerDiv.append(secondsText);
  $("#game-ui-timer-text").text(secondsLeft);

  var countdown = setInterval(() => {
    secondsLeft--;
    $("#game-ui-timer-text").text(secondsLeft);

    // Make the seconds flash red when near the end of a round to indicate urgency
    if (secondsLeft < 6) {
      timerDiv.addClass("--red-attention-text")
      setTimeout(() => {
        timerDiv.removeClass("--red-attention-text");
      }, 100);
    }

    if (secondsLeft === 0) {
      clearInterval(countdown);
      timerDiv.remove(); // Remove the ui element after the round has concluded
    }
  }, 1000);
}

/**
 * This function handles toggling helpful flash messages on or off
 */
function toggleHelp() {
  if (toggleHelpOn) {
    $(".game-ui-help-toggle-container").addClass("--toggle-off");
    toggleHelpOn = false;
    $("#flash-dialog-information").addClass("--toggled-off");

    // Add cookie to prevent from help being displayed again after new session
    document.cookie = "toggleHelpOn=false; Secure; path=/";
  } else {
    $(".game-ui-help-toggle-container").removeClass("--toggle-off");
    toggleHelpOn = true;
    $("#flash-dialog-information").removeClass("--toggled-off");

    document.cookie = "toggleHelpOn=true; Secure; path=/";

    // Display the previous help message when the user wants to see it again
    if (currentTutorialMsg !== undefined) {
      flash(currentTutorialMsg, "information");
    }
  }

  // Add a small animation to the button show so the user clearly understands where
  // to click to enable/disable help
  animateHelpButton();
}

/**
 * Animate the help toggle button whenever an event related to it is performed. This
 * should help make it easier for a player to notice the button and relate it to what
 * is going on in the ui.
 */
function animateHelpButton() {
  // Add a small animation to the button show so the user clearly understands where
  // to click to enable/disable help
  setTimeout(() => {
    $(".game-ui-help-toggle-container").css({ "transform" : "rotate(30deg)" });

    setTimeout(() => {
      $(".game-ui-help-toggle-container").css({ "transform" : "rotate(-30deg)" });

      setTimeout(() => {
        $(".game-ui-help-toggle-container").css({ "transform" : "rotate(0deg)" });
      }, 100);
    }, 100);
  }, 100);
}


// Check whether the user has toggled help off in a previous session, and if so,
// don't display any helpful flash messages
var cookie = document.cookie
  .split("; ")
  .find(row => row.startsWith("toggleHelpOn="));

if(cookie !== undefined) {
  cookie = cookie.split("=")[1];

  if (cookie === "false") {
    // Just call toggleHelp, as the default is set to true and calling it will set
    // the toggle boolean to false.
    toggleHelp();
  }
}