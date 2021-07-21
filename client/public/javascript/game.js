// Initially instruct the user on how to understand and use the UI
flash(tutorialMsgs.intro, "information");

var role; // Used to define what role the current player has in each round

/**
 * Called once players have asked to start a game and the server has responded
 */
socket.on("response: game started", () => {
  // Remove the lobby's touch listeners
  // removeTouchListeners();
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
      addTouchListeners({ 
        left: () => { socket.emit("request: word"); }, 
        right: () => { socket.emit("request: word"); }
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


// If this player is the speaker, display a button asking them how many points they believed
// they earned. Once they enter, emit this amount to the server
socket.on("update: round over", (wordsPlayed) => {
  
  // Explain to the speaker what they have to do in this step
  if (role === "speaker") {
    flash(tutorialMsgs.roundOverSpeakerInstruction, "information");
  } else if (role === "guesser") { 
    flash(tutorialMsgs.roundOverGuesserInstruction, "information");
  } else {
    flash(tutorialMsgs.roundOverOppositionInstruction, "information"); 
  }

  // Stop listening to touch-related events, as the user be able to swipe without unnecessary
  // calls being made
  removeTouchListeners();

  console.log("round over");
  console.log(wordsPlayed);

  var reviewScreen = $("#screen-review");
  reviewScreen.empty(); // Empty the review screen of previous words that may have been displayed

  changeScreen("screen-review");

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

  if (role === "speaker") {
    console.log("this client is the speaker");

    // Display the ui input where the user can enter the amount of points they've earned
    $("#speaker-enter-points").removeClass("--display-hidden");   

    var inputField = $("#input-points-earned");
    var claimPointsButton = $("#button-confirm-points");

    inputField.on("keydown", (e) => {
      if(e.which == 13) {
        console.log("claiming points ", inputField.val())
        sendClaimPoints(inputField.val());
      } else {
        // If the user is reentering a value in the input field, check if the button
        // is showing the tick, indicating that the previous input was confirmed. If
        // so, change the button back to a non-confirmed state to indicate that the
        // the user must confirm again
        if (claimPointsButton.text() === "✓") {
          claimPointsButton.text("Confirm");
          claimPointsButton.removeClass("--confirmed");
        }
      }
    });

    claimPointsButton.on("click", (e) => {
      console.log("claiming points ", inputField.val())
      sendClaimPoints(inputField.val());
    });
  }
});

function sendClaimPoints(pointsAmt) {
  console.log("sendClaimPoints called");
  console.log(pointsAmt, " typeof: ", typeof(pointsAmt));
  // Only try emit if the inputted value is an integer that is above 0.
  if (/^\d+$/.test(pointsAmt)) {
    console.log("emitted");
    socket.emit("request: earned points amount", pointsAmt);

    // Since the input is valid the request was emitted to server, toggle the confirm
    // button so that it displays a tick - Should be useful as visual feedback
    var claimPointsButton = $("#button-confirm-points");
    claimPointsButton.text("✓");
    claimPointsButton.addClass("--confirmed");

  } else {
    flash("Error: You need to input a positive whole number. Minimum score must be 0 as you can't lose points", "error");
  }
}

socket.on("request: confirm points claim", (speaker, amount) => {

  // Check if the button is in the 'confirmed' state when a new request has come in, 
  // and if so, change it.
  var confirmButton = $("#button-confirm-claim");
  if (confirmButton.text() === "✓") {
    confirmButton.removeClass("--confirmed");
    confirmButton.text("Confirm");
  }

  // Remove and reattach the listener each time the server asks to confirm
  $("#button-confirm-claim").off("click", "**");

  console.log("speaker claims to have earned: ", speaker, amount)

  // Show the confirm dialog
  $("#player-confirm-points").removeClass("--display-hidden");
  $("#confirm-text").text(`Did ${speaker} get ${amount} points?`);


  $("#button-confirm-claim").on("click", (e) => {
    socket.emit("response: confirm points");

    // Change the button to display a tick - Nice for visual feedback
    confirmButton.addClass("--confirmed");
    confirmButton.text("✓");
  });
});


var t1CurrentPoints = 0;
var t2CurrentPoints = 0;

socket.on("update: points: ", (t1Points, t2Points, pointsNeeded) => {
  handlePointUpdate(t1Points, t2Points, pointsNeeded);
});


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

function nextRound() {
  socket.emit("request: new round");
}

socket.on("update: lost", (t1Points, t2Points, pointsNeeded) => {
  removeTouchListeners();

  handlePointUpdate(t1Points, t2Points, pointsNeeded);

  // Hide the next round button, as the game is over
  $("#button-next-round").addClass("--display-hidden");
  $("#gameover-text").html("<b>You lost :(</b>");
});

socket.on("update: won", (t1Points, t2Points, pointsNeeded) => {
  removeTouchListeners();

  handlePointUpdate(t1Points, t2Points, pointsNeeded);

  $("#button-next-round").addClass("--display-hidden");
  $("#gameover-text").html("<b>Congratulations! You won!</b>");
});


/**
 * On receiving notification that the round is starting, display the timer on the ui
 */
socket.on("update: starting", (seconds) => {
  console.log("update: starting: seconds = " + seconds);
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



var toggleHelpOn = true;


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
}


function displayHelpButton() {
  // Create the ui element
  var helpButtonToggle = $("<button/>", { 
    id: "div-game-ui-help-toggle",
    class: "game-ui-help-toggle-container",
    onClick: "toggleHelp()"  
  });
  
  helpButtonToggle.append($("<p>?</p>"));
  $(".app-container").append(helpButtonToggle);
}

displayHelpButton();


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
