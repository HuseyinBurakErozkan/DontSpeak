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
  var wordScreen = document.getElementById("screen-word");
  while (wordScreen.firstChild) {
    wordScreen.removeChild(wordScreen.lastChild);
  }

  var primaryDiv = document.createElement("div");
  primaryDiv.classList.add("word-primary");

  var secondaryDiv = document.createElement("div");
  secondaryDiv.classList.add("word-secondary");
  wordScreen.appendChild(primaryDiv);
  wordScreen.appendChild(secondaryDiv);

  console.log(word)
  console.log("The word is : " + word[0] + ", can't say: ");
  console.log(word[1], word[2], word[3], word[4]);
  
  var element = document.createElement("p");
  element.appendChild(document.createTextNode(word[0]));
  document.getElementsByClassName("word-primary")[0].appendChild(element);

  var secondaryWords = word[1];

  for (var i = 0; i < secondaryWords.length; i++) {
    var wordElement = document.createElement("p");
    wordElement.appendChild(document.createTextNode(secondaryWords[i]));
    document.getElementsByClassName("word-secondary")[0].appendChild(wordElement)
  }
})


function displayWordScreen() {
  changeScreen(document.getElementById("h2-lobby-id"), "screen-word");
}

socket.on("update: Standard rules", () => {
  displayWordScreen()
  // alert("standard rules!");
})

socket.on("update: Time is doubled!", () => {
  displayWordScreen()
  // alert("double!");
})

socket.on("update: You cannot use body language", () => {
  displayWordScreen()
  // alert("statue!");
})

socket.on("update: Everybody except the speaker can answer for this round!", () => {
  displayWordScreen()
  // alert("everybody!");
})


socket.on("update: seconds left: ", (seconds) => {
  console.log(seconds + " seconds left");
})

socket.on("update: round over:", () => {
  console.log("round over");
});