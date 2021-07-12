/**
 * Miscellanious socket events
 */

// All socket that are in a lobby will receive this msg when a new player joins
socket.on("response: lobby joined", (id, player) => {
  $("#h2-lobby-id").text("Game PIN: " + id);
  changeScreen($("#form-join"), 'screen-lobby');
});


socket.on("error:", (msg) => {
  flashError(msg);
});
