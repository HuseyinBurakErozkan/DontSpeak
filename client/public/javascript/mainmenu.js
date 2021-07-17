/**
 * Handles switching between the logically separated 'screens' in the menu section
 * of the app
 * @param {HTMLElement} from The button element that called this function  
 * @param {String} toClassId The Id of the html div element to display
 */
function changeScreen(from, toClassId) {
  // TODO: Move changeScreen() to a more appropriate file

  // Get the ancestor screen element and hide it, then show the new screen
  $(from).closest(".screen").addClass("--display-hidden");

  // If no previous screen child element isn't provided, use Jquery's implicit iteration
  // to just hide every screen, then display the correct screen
  if (from === null) {
    $(".screen").addClass("--display-hidden");
  }
  $("#"+toClassId).removeClass("--display-hidden");
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
      changeScreen($("#form-create"), "screen-lobby");

      flash("This is the lobby. Once everyone joins, click on start to confirm that you're ready\n\n" +
        "The game will start once everyone confirms that they are ready\n\n" +
        "To swap teams, swipe left or right\n\n" +
        "Once start is clicked, one of the teams will be randomly chosen to start\n\n" +
        "You can click the '?' button below to disable/enable these tips any time", "information");
      
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