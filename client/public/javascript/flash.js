
socket.on('error', (msg) => {
  flashError(msg);
});

// Flash the error to the user
function flashError(msg) {
  // TODO: Add a flash message DOM element
  console.log("ERROR: " + msg);
}