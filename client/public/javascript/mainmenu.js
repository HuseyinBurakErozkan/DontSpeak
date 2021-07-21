/**
 * Handles switching between the logically separated 'screens' in the menu section
 * of the app  
 * @param {String} toScreenId The Id of the html div element to display
 */
function changeScreen(toScreenId) {
  // TODO: Move changeScreen() to a more appropriate file

  // Use Jquery's implicit iteration to just hide every screen, then display the 
  // correct screen
  $(".screen").addClass("--display-hidden");
  $("#"+toScreenId).removeClass("--display-hidden");


  // TODO: Remove all touch listeners each time a screen is changed
  removeTouchListeners();
  
  // TODO: Remove any screen-specific ui elements. All these ui elements should have
  // a common class, to make removal easy


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
 * Handle user requesting to create a new game
 */
$("#form-create").submit((e) => {
  e.preventDefault()

  var name = $("#input-name-create").val().trim();

  if (name.replace(/\s/g, "") == "" || $("#input-name-create").val() == null) {
    // TODO: Display feedback to the user
    console.log("Need a valid username");
    flash("Need a valid username", "error");
  }
  else {
    console.log("Name is " + name);
    socket.emit("request: create lobby", name);
  
    // Once the server responds
    socket.on("response: lobby created", (player, lobbyId, team1, team2) => {
      $("#h2-lobby-id").text("Game PIN: " + lobbyId);
      changeScreen("screen-lobby");

      joinLobby(team1, team2, player);
    });
  }
});


/**
 * Hande user requesting to join a game
 */
$("#form-join").submit((e) => {
  e.preventDefault();

  var name = $("#input-name-join").val().trim();
  var lobbyId = $("#input-lobby-number").val().trim();

  if (name.replace(/\s/g, "") == "" || $("#input-name-join").val() == null) {
    // TODO: Display feedback
    console.log("Need a valid username");
    flash("Need a valid username", "error");

  } else if (lobbyId < 1000 || lobbyId > 9999) {
    // TODO: Display feedback
    console.log("Need a valid lobby number. 4 digits");
    flash("Need a valid lobby PIN", "error");
  } else {
    socket.emit("request: join lobby", name, lobbyId);
  }
});
