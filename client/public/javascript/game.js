// Initially instruct the user on how to understand and use the UI
flash(
  "Hi!\n\nI will guide you throughout the game. If you want to turn off hints, " +
  "click the red button on the bottom right corner.\n\nYou can click it again to toggle " +
  "hints on, or to see the tip again.", "information");

var role; // Used to define what role the current player has in each round

socket.on("response: game started", () => {
  console.log("Response: Game started");

  // Remove the lobby's touch listeners
  removeTouchListeners();

  // NOTE: TESTING PURPOSES ONLY. REMOVE LATER
  socket.emit("request: new round");
});

socket.on("response: new round", (ruleName, ruleDesc, speaker, speakerTeam, seconds) => {

  // var teamNumber = speakerTeam.slice(-1); // Get the last char, which is the number 1 or 2

  changeScreen(null , "screen-round-ready");
  $("#p-rule-name").text(ruleName);
  $("#p-rule-description").text(ruleDesc);
  $("#p-speaker").text(`${speaker} from team ${speakerTeam} is the speaker!`);
  $("#p-seconds").html(`<b>${seconds}</b> seconds`);
});

socket.on("update: role: speaking", () => {
  role = "speaker";

  flash("You're the speaker for this round. As the speaker, you have to describe to your " +
    "teammates what the taboo word is and have them say the taboo word out loud. The taboo " +
    "word is the word on the top of the card with a green background. You can not say any " +
    "of the other similar words on the card, unless your teammate says it, in which case " +
    "you can say them.\n\nIf you accidentally say any of the taboo words, you have to forfeit " +
    "the card and move on the next.\n\nYou can also move on to the next card if you find it " +
    "too difficult or not worth doing.\n\nSwipe left or right to get a new card.\n\n" +
    "Once you and your teammates are ready, click start", "information");

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

  // Add touch listeners to recognise when speaker swipes for a new card
  addTouchListeners({ 
    left: requestWord, 
    right: requestWord});
});


socket.on("update: role: guesser", (seconds) => {

  role = "guesser";

  flash("Your teammate will be the speaker. They're going to describe the taboo word " +
    "and you will have to guess what the word is and say it out loud.\n\nEach taboo word " +
    "also has 4 similar words that can't be said by your teammate, unless you say the word " +
    "first.\n\nTry help your teammate by saying any words that are similar to what you think " +
    "your teammate is describing to you, as they will then have an easier time describing the " +
    "word once they're able to use the other similar taboo words!\n\nGood luck! And stop " +
    "looking at the screen!", "information");
});

socket.on("update: role: opposition", () => {

  role = "opposition";

  flash(
    "Your team is the opposing team for this round.\n\nAs the speaker describes the taboo " +
    "word, which is at the top of the card, you have to make sure that they don't " +
    "accidentally say any of the the 5 words listed on the card.\n\nIf the guesser guesses " +
    "one of the other 4 similar words, the speaker is allowed to use them afterwards.\n\n" +
    "If the speaker says one of the taboo words before the guesser guesses it, you must " +
    "call it out and they will have to forfeit the card and move on the next.\n\nThe speaker " +
    "is allowed to skip as many words as they want if they think the word is too difficult.\n\n" +
    "Good luck! And make sure to call out the speaker if they say a taboo word, otherwise they " +
    "may get a free point!", "information");
});


socket.on("update: word: ", (word) => {

  changeScreen(null, "screen-word");
  console.log("WORD IS : ", word)
  // Clear the card of words
  var card = $("#div-word-card-container");
  card.empty();
  // wordScreen.addClass("screen")
  var primaryDiv = $("<div/>", { id: "div-word-primary", class: "word-primary" });
  var secondaryDiv = $("<div/>", { id: "div-word-secondary", class: "word-secondary" });
  card.append(primaryDiv);
  card.append(secondaryDiv);

  // Display the word to be said
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
    flash(
      "The round is over!\n\nEverybody now needs to review how many taboo words " +
      "(the primary word in green) the guesser or guessers got right and how many you got disqualified for.\n\n" +
      "Discuss how many words the guesser or guessers got right with everybody, and then enter the amount in the " +
      "dialog box at the bottom.\n\nEach word your team got right = 1 point.\nEach word you got " +
      "disqualified for = -1 point.\n\nIf your points for this round are below 0, enter 0 as " +
      "you can't lose points.\n\nOnce you enter the amount of points you've earned, " +
      "everybody else needs to confirm it before the game can continue.\n\nYou can always " +
      "re-enter a new value if you realised you entered the wrong amount.", "information");
  } else if (role === "guesser") { 
    flash(
      "The round is over!\n\nReview the taboo words (the words in green) you and the speaker " +
      "got right and which words the speaker got disqualified for.\n\nEach word your team got " +
      "right = 1 point.\nEach word your team got disqualified = -1 point.\n\nYou can't score " +
      "below 0 points, so the speaker will enter 0 in that case.\n\nOnce the speaker enters the " +
      "amount of points they believe they earned, everybody must confirm it.\n\nClick the button " +
      "to confirm.", "information");
  }
  else {
    flash(
      "The round is over!\n\nHave a look at all the words listed and discuss with everbody " +
      "the amount of taboo words (the words in green) that the speaker and guessers got right, as well as how many words " +
      "the speaker got disqualified for.\n\nEach word the guessers got right = 1 point.\n" +
      "Each word the speaker got disqualified for = -1 point.\n\nIf the speaker and guessers got " +
      "below 0 points, they will enter 0, as negative points aren't allowed.\n\n Once everybody " +
      "agrees, the speaker will enter the amount of points you got and you will then need to " +
      "confirm.\n\nIf the speaker entered the wrong amount of points, let them know so they can " +
      "change their answer.", "information"); 
  }

  // Stop listening to touch-related events, as the user be able to swipe without unnecessary
  // calls being made
  removeTouchListeners();

  console.log("round over");
  console.log(wordsPlayed);

  var reviewScreen = $("#screen-review");
  reviewScreen.empty(); // Empty the review screen of previous words that may have been displayed

  changeScreen(null, "screen-review");

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

  changeScreen(null, "screen-scores");

  console.log(`team1 points: ${t1Points} \nteam2 points: ${t2Points} \npoints needed to win: ${pointsNeeded}`)

  // Increment or decrement the scores, as players will more easily understand 
  // what they're looking at when they see scores actively changing
  var t1PrevPoints = $("#t1-scores").first().text();
  var t2PrevPoints = $("#t2-scores").first().text();

  // Set the text of each team's scores to the PREVIOUS point amount
  $("#t1-scores").text(`Team 1 score: ${t1CurrentPoints}`);
  $("#t2-scores").text(`Team 2 score: ${t2CurrentPoints}`);
  $("#points-needed").text(`Score needed to win: ${pointsNeeded}`);

  
  // Update the displayed scores for both teams
  updateScoreDisplay(t1Points, t1CurrentPoints, 1);
  updateScoreDisplay(t2Points, t2CurrentPoints, 2);

  // Update the point values
  t1CurrentPoints = t1Points;
  t2CurrentPoints = t2Points;
});


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

socket.on("update: lost", () => {

  removeTouchListeners();

  changeScreen(null, "screen-gameover");
  // Hide the ui elements that were instantiated for the previous round
  $("#speaker-enter-points").addClass("--display-hidden"); // The speaker's enter point dialog
  $("#player-confirm-points").addClass("--display-hidden"); // The 'confirm points' dialog
  $("#speaker-start-button").remove(); // Remove the start button that displays for the speaker
  
  $("#game-over-text").text("You lost :(.\nBetter luck next time!");
});

socket.on("update: won", () => {

  removeTouchListeners();
  
  changeScreen(null, "screen-gameover");
  // Hide the ui elements that were instantiated for the previous round
  $("#speaker-enter-points").addClass("--display-hidden"); // The speaker's enter point dialog
  $("#player-confirm-points").addClass("--display-hidden"); // The 'confirm points' dialog
  $("#speaker-start-button").remove(); // Remove the start button that displays for the speaker
  
  $("#game-over-text").text("Congratulations!\nYou won!");
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
    changeScreen(null, "screen-countdown");
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

function requestWord() {
  socket.emit("request: word");
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
