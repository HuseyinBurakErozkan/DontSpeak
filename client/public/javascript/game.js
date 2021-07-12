var isSpeaker = false;

socket.on("response: game started", () => {
  console.log("Response: Game started");

  // NOTE: TESTING PURPOSES ONLY. REMOVE LATER
  socket.emit("request: new round");
});

socket.on("response: new round", (ruleName, ruleDesc, speaker) => {
  changeScreen(null , "screen-round-ready");
  $("#p-rule-name").text(ruleName);
  $("#p-rule-description").text(ruleDesc);
  $("#p-speaker").text(`${speaker} is the speaker!`)
});

socket.on("update: role: speaking", () => {

  isSpeaker = true;

  // Add a start button only the speaker can click, for when they're ready to start
  // describing the words
  var button = $("<button/>")
    .text("Start!")
    .addClass("button-primary")
    .click(() => {
      socket.emit("request: start round");
    });
  button.attr("id", "speaker-start-button");

  $("#screen-round-ready").append(button);
});

// socket.on("update: rule:", (rule) => {
//   // console.log("Rule for this round is: ", rule);
// });

// socket.on("update: speaker:", (speaker) => {
//   // console.log("Speaker is: ", speaker);
// });


socket.on("update: role: guesser", (seconds) => {
  changeScreen(null, "screen-countdown");

  isSpeaker = false;

  var secondsLeft = seconds;
  
  var countdown = setInterval(() => {
    $("#seconds-left").text(secondsLeft);
    secondsLeft--;

    if (secondsLeft === 0) {
      clearInterval(countdown);
    }
  }, 1000);
});


socket.on("test", () => {
  console.log("TEST RECEIVED");
})

socket.on("update: word: ", (word) => {
  changeScreen(null, "screen-word");
  console.log("WORD IS : ", word)
  // Clear the word screen
  var wordScreen = $("#screen-word");
  wordScreen.empty();
  // wordScreen.addClass("screen")
  var primaryDiv = $("<div/>", { id: "div-word-primary", class: "word-primary" });
  var secondaryDiv = $("<div/>", { id: "div-word-secondary", class: "word-secondary" });
  wordScreen.append(primaryDiv);
  wordScreen.append(secondaryDiv);

  // Display the word to be said
  var element = $("<p></p>").text(word[0]);
  $("#div-word-primary").append(element);

  // Now display all the words that the player can't say
  var secondaryWords = word[1];
  for (var i = 0; i < secondaryWords.length; i++) {
    var elementSecondaryWord = $("<p></p>").text(secondaryWords[i]);
    $("#div-word-secondary").append(elementSecondaryWord);
  }
})


// If this player is the speaker, display a button asking them how many points they believed
// they earned. Once they enter, emit this amount to the server
socket.on("update: round over", (wordsPlayed) => {
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

  if (isSpeaker) {
    console.log("this client is the speaker");
    isSpeaker = false;

    // Display the ui input where the user can enter the amount of points they've earned
    $("#speaker-enter-points").removeClass("--display-hidden");   

    var inputField = $("#input-points-earned");
    var claimPointsButton = $("#button-confirm-points");

    inputField.on("keypress", (e) => {
      if(e.which == 13) {
        console.log("claiming points ", inputField.val())
        sendClaimPoints(inputField.val());
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
  // Only try emit if the inputted value is an integer
  if (/^\d+$/.test(pointsAmt)) {
    console.log("emitted");
    socket.emit("request: earned points amount", pointsAmt);  
  }
}

socket.on("request: confirm points claim", (speaker, amount) => {

  // Remove and reattach the listener each time the server asks to confirm
  $("#button-confirm-claim").off("click", "**");

  console.log("speaker claims to have earned: ", speaker, amount)

  // Show the confirm dialog
  $("#player-confirm-points").removeClass("--display-hidden");
  $("#confirm-text").text(speaker + " claims to have gussed " + amount + ".\nIs this correct?");


  $("#button-confirm-claim").on("click", (e) => {
    socket.emit("response: confirm points");
  });
});

socket.on("update: points: ", (t1Points, t2Points, pointsNeeded) => {

  // Hide the ui elements that were instantiated for the previous round
  $("#speaker-enter-points").addClass("--display-hidden"); // The speaker's enter point dialog
  $("#player-confirm-points").addClass("--display-hidden"); // The 'confirm points' dialog
  $("#speaker-start-button").remove(); // Remove the start button that displays for the speaker

  console.log(`team1 points: ${t1Points} \n team2 points: ${t2Points} \n points needed to win: ${pointsNeeded}`)

  changeScreen(null, "screen-scores");
  $("#t1-scores").text("Team 1 is currently at: " + t1Points);
  $("#t2-scores").text("Team 2 is currently at: " + t2Points);
  $("#points-needed").text(pointsNeeded + " needed to win");
});

function nextRound() {
  socket.emit("request: new round");
}

socket.on("update: lost", () => {
  changeScreen(null, "screen-gameover");
  $("#game-over-text").text("You lost :(.\nBetter luck next time!");
})

socket.on("update: won", () => {
  changeScreen(null, "screen-gameover");
  $("#game-over-text").text("Congratulations!\nYou won!");
})