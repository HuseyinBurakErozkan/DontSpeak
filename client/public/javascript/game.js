socket.on("response: game started", () => {
  console.log("Response: Game started");

  // NOTE: TESTING PURPOSES ONLY. REMOVE LATER
  socket.emit("request: start round");
});

socket.on("update: rule:", (rule) => {
  console.log("Rule for this round is: ", rule);
});

socket.on("update: speaker:", (speaker) => {
  console.log("Speaker is: ", speaker);
});

socket.on("update: role: speaking", () => {
  alert("You re the speaker");
});



socket.on("update: Standard rules", () => {
  alert("standard rules!");
})

socket.on("update: Time is doubled!", () => {
  alert("double!");
})

socket.on("update: You cannot use body language", () => {
  alert("statue!");
})

socket.on("update: Everybody except the speaker can answer for this round!", () => {
  alert("everybody!");
})



