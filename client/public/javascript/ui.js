var socket = io();

/**
 * Handles switching between the logically separated 'screens' in the menu section
 * of the app
 * @param {HTMLElement} from The button element that called this function  
 * @param {String} toClassId The Id of the html div element to display
 */
function changeScreen(from, toClassId) {
  var parentScreen = from.parentNode;
  parentScreen.hidden = true;
  
  var toScreen = document.getElementById(toClassId);
  toScreen.hidden = false;
}

/**
 * Handle user requesting to create a new game
 */
var createForm = document.getElementById("form-create");
createForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  var nameInput = document.getElementById("input-name-create");
  var name = nameInput.value.trim();

  if (name.replace(/\s/g, "") == "" || nameInput.value == null) {
    // TODO: Display feedback to the user
    console.log("Need a valid username");
  }
  else {
    console.log("Name is " + name);
    socket.emit("request create game", name);
  }
});


/**
 * Hande user requesting to join a game
 */
var joinForm = document.getElementById("form-join");
joinForm.addEventListener("submit", (e) => {
  e.preventDefault();

  var nameInput = document.getElementById("input-name-join");
  var name = nameInput.value.trim();

  var roomId = document.getElementById("input-room-number").value.trim();

  if (name.replace(/\s/g, "") == "" || nameInput.value == null) {
    // TODO: Display feedback
    console.log("Need a valid username");
  }
  else if (roomId < 1000 || roomId > 9999) {
    // TODO: Display feedback
    console.log("Need a valid room number. 4 digits");
  }
  else {
    console.log("Joining room " + roomId + " as " + name);
    socket.emit("request join game", name, roomId);
  }
  
});