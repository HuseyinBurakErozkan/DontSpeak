function joinLobby(team1, team2, player) {
  displayTeams(team1, team2);

  flash("This is the lobby. Once everyone joins, click on start to confirm that you're ready\n\n" +
    "The game will start once everyone confirms that they are ready\n\n" +
    "To swap teams, swipe left or right\n\n" +
    "Once start is clicked, one of the teams will be randomly chosen to start\n\n" +
    "You can click the '?' button below to disable/enable these tips any time", "information");


  // Add touch listeners to recognise when player wansts to swap teams
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
  console.log("requesting to move to team " + args.team);
  socket.emit("request: move to team", args.team);
}


$("#form-start-game").submit((e) => {
  e.preventDefault();
  socket.emit("request: start game");
});



/**
 * Server emit events
 */
socket.on("update: player joined", (player, team1, team2) => {
  displayTeams(team1, team2);
})

socket.on("update: player left", (team1, team2) => {
  displayTeams(team1, team2);
});

socket.on("update: teams updated", (team1, team2) => {
  displayTeams(team1, team2);
});