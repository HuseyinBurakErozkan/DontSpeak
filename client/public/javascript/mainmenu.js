
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
    socket.emit("request: create lobby", name);

    
    // Once the server responds
    socket.on("response: lobby created", (player, lobbyId, team1, team2) => {
      document.getElementById('h2-lobby-id').innerHTML = "Game id: " + lobbyId;
      
      changeScreen(createForm, 'screen-lobby');
      joinLobby(team1, team2, player);
    });
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

  var lobbyId = document.getElementById("input-lobby-number").value.trim();

  if (name.replace(/\s/g, "") == "" || nameInput.value == null) {
    // TODO: Display feedback
    console.log("Need a valid username");
  }
  else if (lobbyId < 1000 || lobbyId > 9999) {
    // TODO: Display feedback
    console.log("Need a valid lobby number. 4 digits");
  }
  else {
    socket.emit("request: join lobby", name, lobbyId);

    // Once the server responds
    socket.on("response: lobby joined", (id, player) => {

      document.getElementById('h2-lobby-id').innerHTML = "Game id: " + id;

      changeScreen(joinForm, 'screen-lobby');
      
      // TODO: Remove the lines below later
      var nameDisplay = document.createElement("p");
      nameDisplay.appendChild(document.createTextNode("hi " + player.name));
      document.getElementsByClassName("screen-container")[0].insertBefore(nameDisplay, document.getElementById("screen-lobby"));
    });
  }
});
