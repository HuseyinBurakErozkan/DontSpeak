
/**
 * Handle user requesting to create a new lobby
 */
$("#form-create").submit((e) => {
  e.preventDefault()

  var name = $("#input-name-create").val().trim();

  if (name.replace(/\s/g, "") == "" || $("#input-name-create").val() == null) {
    flash("Need a valid username", "error");
  } else {
    socket.emit("request: create lobby", name);
  }
});


/**
 * Hande user requesting to join a lobby
 */
$("#form-join").submit((e) => {
  e.preventDefault();

  var name = $("#input-name-join").val().trim();
  var lobbyId = $("#input-lobby-number").val().trim();

  if (name.replace(/\s/g, "") == "" || $("#input-name-join").val() == null) {
    flash("Need a valid username", "error");
  } else if (lobbyId < 1000 || lobbyId > 9999) {
    flash("Need a valid lobby PIN", "error");
  } else {
    socket.emit("request: join lobby", name, lobbyId);
  }
});


function joinLobby(team1, team2, player) {
  displayTeams(team1, team2);

  // Add touch listeners to recognise when player wants to swap teams
  addTouchListeners({ 
    left: moveToTeam, // Left indicates that player wants to move to team 1
    leftArgs: { team: 1 },
    right: moveToTeam, // Right indicates that player wants to move to team 2
    rightArgs: { team: 2 } });
}

function displayTeams(team1, team2) {
  var team1Div = $("#div-team1");
  var team2Div = $("#div-team2");

  // Completely 'redraw' the teams, by removing all child nodes from both team divs, then 
  // creating new DOM elements for both team divs. May be less efficient, but much less
  // DOM manipulation required.
  team1Div.empty();
  team2Div.empty();

  if (team1 !== undefined) {  
    for (var i = 0; i < team1.length; i++) {
      var playerDiv = $("<div/>", { class: "div-team1 __player"});
      playerDiv.append(document.createTextNode(team1[i].name));
      team1Div.append(playerDiv);
    }
  }
  if (team2 !== undefined) {
    for (var i = 0; i < team2.length; i++) {
      var playerDiv = $("<div/>", { class: "div-team2 __player"});
      playerDiv.append(document.createTextNode(team2[i].name));
      team2Div.append(playerDiv);
    }
  }
}

function moveToTeam(args) {
  socket.emit("request: move to team", args.team);
}

$("#form-start-game").submit((e) => {
  e.preventDefault();
  socket.emit("request: start game");
});


/**
 * Server emit events
 */

// Server has responded that the lobby the user wanted to create was indeed created
  socket.on("response: lobby created", (player, lobbyId, team1, team2) => {
  $("#h2-lobby-id").text("Game PIN: " + lobbyId);
  changeScreen("screen-lobby");

  joinLobby(team1, team2, player);
});

// Server has emitted that the player has joined the lobby
socket.on("response: lobby joined", (id, player) => {

  flash(tutorialMsgs.lobbyInstruction, "information");

  $("#h2-lobby-id").text("Game PIN: " + id);
  changeScreen("screen-lobby");

  // Add touch listeners to recognise when player wants to swap teams
  addTouchListeners({ 
    left: moveToTeam, // Left indicates that player wants to move to team 1
    leftArgs: { team: 1 },
    right: moveToTeam, // Right indicates that player wants to move to team 2
    rightArgs: { team: 2 } });
});

//Server has let this client know that another player has joined the lobby 
socket.on("update: player joined", (player, team1, team2) => {
  displayTeams(team1, team2);
})

// Server has let this client know that another player has left the lobby
socket.on("update: player left", (team1, team2) => {
  displayTeams(team1, team2);
});

// Server emits this whenever the teams have changed (i.e; a player moves team)
socket.on("update: teams updated", (team1, team2) => {
  displayTeams(team1, team2);
});