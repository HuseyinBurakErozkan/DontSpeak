/**
 * Miscellanious socket events
 */

// The player that has requested to join a lobby will receive message
socket.on("response: lobby joined", (id, player) => {

  flash("This is the lobby. Once everyone joins, click on start to confirm that you're ready\n\n" +
    "The game will start once everyone confirms that they are ready\n\n" +
    "To swap teams, swipe left or right\n\n" +
    "Once start is clicked, one of the teams will be randomly chosen to start\n\n" +
    "You can click the '?' button below to disable/enable these tips any time", "information");

  $("#h2-lobby-id").text("Game PIN: " + id);
  changeScreen($("#form-join"), 'screen-lobby');

  // Add touch listeners to recognise when player wants to swap teams
  addTouchListeners({ 
    left: moveToTeam, // Left indicates that player wants to move to team 1
    leftArgs: { team: 1 },
    right: moveToTeam, // Right indicates that player wants to move to team 2
    rightArgs: { team: 2 } });
});


socket.on("error:", (msg) => {
  flash(msg, "error");
});

socket.on("disconnect", () => {
  flash("Lost connection to the server. Please refresh the page to start again", "error");
});