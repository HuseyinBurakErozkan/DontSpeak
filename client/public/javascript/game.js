socket.on("response: game started", () => {
  console.log("Response: Game started");

  // NOTE: TESTING PURPOSES ONLY. REMOVE LATER
  socket.emit("request: start round");
});

socket.on("update: rule:", (rule) => {
  // console.log("Rule for this round is: ", rule);
});

socket.on("update: speaker:", (speaker) => {
  // console.log("Speaker is: ", speaker);
});

socket.on("update: role: speaking", () => {
  alert("you're the speaker");
  // NOTE: TESTING ONLY
  // TODO: Remove the timer
  setInterval(() => {
    console.log("client: requesting word");
    socket.emit("request: word");
  }, 1500);
});

socket.on("test", () => {
  console.log("TEST RECEIVED");
})

socket.on("update: word: ", (word) => {

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

socket.on("update: Standard rules", () => {
  changeScreen($("#h2-lobby-id"), "screen-word");
  // alert("standard rules!");
})

socket.on("update: Time is doubled!", () => {
  changeScreen($("#h2-lobby-id"), "screen-word");
  // alert("double!");
})

socket.on("update: You cannot use body language", () => {
  changeScreen($("#h2-lobby-id"), "screen-word");
  // alert("statue!");
})

socket.on("update: Everybody except the speaker can answer for this round!", () => {
  changeScreen($("#h2-lobby-id"), "screen-word");
  // alert("everybody!");
})

// NOTE: Not expected to be used. Remove in future
// socket.on("update: seconds left: ", (seconds) => {
//   console.log(seconds + " seconds left");
// })

socket.on("update: round over:", () => {
  console.log("round over");
});