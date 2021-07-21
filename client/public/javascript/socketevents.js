/**
 * Miscellanious socket events
 */

socket.on("error:", (msg) => {
  flash(msg, "error");
});

socket.on("disconnect", () => {
  flash("Lost connection to the server. Please refresh the page to start again", "error");
});