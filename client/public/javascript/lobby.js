function joinLobby(team1, team2, player) {
  displayTeams(team1, team2);
  // TODO: Remove the lines below later
}

function displayTeams(team1, team2) {
  var team1Div = $("#div-team1");
  var team2Div = $("#div-team2");

  // Completely 'redraw' the teams, by removing all child nodes from both team divs, then 
  // creating new DOM elements for both team divs. May be less efficient, but much less
  // DOM manipulation required.
  team1Div.empty();
  team2Div.empty();

  for (var i = 0; i < team1.length; i++) {
    var playerDiv = $("<div/>", { class: "div-team1 __player"});
    playerDiv.append(document.createTextNode(team1[i].name));
    team1Div.append(playerDiv);
  }
  for (var i = 0; i < team2.length; i++) {
    var playerDiv = $("<div/>", { class: "div-team2 __player"});
    playerDiv.append(document.createTextNode(team2[i].name));
    team2Div.append(playerDiv);
  }
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

socket.on("update: teams changed", (team1, team2) => {
  displayTeams(team1, team2);
});

socket.on("update: player left", (team1, team2) => {
  displayTeams(team1, team2);
});