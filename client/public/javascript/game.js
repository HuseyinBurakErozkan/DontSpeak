socket.on("response: game started", () => {
  console.log("Response: Game started");

  // NOTE: TESTING PURPOSES ONLY. REMOVE LATER
  socket.emit("request: new round");
});

socket.on("response: new round", (ruleName, ruleDesc, speaker) => {
  changeScreen(null , "screen-round-ready");
  $("#p-rule-name").text(ruleName);
  $("#p-rule-description").text(ruleDesc);
  $("#p-speaker").text("Speaker is " + speaker)
});

socket.on("update: role: speaking", () => {

  // Add a start button only the speaker can click, for when they're ready to start
  // describing the words
  var button = $("<button/>")
    .text("Start!")
    .click(() => {
      socket.emit("request: start round");
    });
  
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


// socket.on("update: Standard rules", () => {
//   changeScreen($("#h2-lobby-id"), "screen-word");
//   // alert("standard rules!");
// })

// socket.on("update: Time is doubled!", () => {
//   changeScreen($("#h2-lobby-id"), "screen-word");
//   // alert("double!");
// })

// socket.on("update: You cannot use body language", () => {
//   changeScreen($("#h2-lobby-id"), "screen-word");
//   // alert("statue!");
// })

// socket.on("update: Everybody except the speaker can answer for this round!", () => {
//   changeScreen($("#h2-lobby-id"), "screen-word");
//   // alert("everybody!");
// })

// NOTE: Not expected to be used. Remove in future
// socket.on("update: seconds left: ", (seconds) => {
//   console.log(seconds + " seconds left");
// })

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
});