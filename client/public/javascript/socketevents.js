/**
 * Miscellanious socket events
 */

// All socket that are in a lobby will receive this msg when a new player joins
socket.on("response: lobby joined", (id, player) => {
  $("#h2-lobby-id").text("Game PIN: " + id);
  changeScreen($("#form-join"), 'screen-lobby');

  // Add touch listeners to recognise when player wansts to swap teams
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