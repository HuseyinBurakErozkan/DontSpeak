function joinLobby(team1, team2) {
  displayTeams(team1, team2);
}



socket.on("update: player joined", (player, team1, team2) => {
  console.log("new player joined");
  displayTeams(team1, team2);
})


socket.on("update: teams changed", (team1, team2) => {

});


function displayTeams(team1, team2) {
  var team1Div = document.getElementById("div-team1");
  var team2Div = document.getElementById("div-team2");

  // Completely 'redraw' the teams, by removing all child nodes from both team divs, then 
  // creating new DOM elements for both team divs
  team1Div.innerHTML = "";
  team2Div.innerHTML = "";

  for (var i = 0; i < team1.length; i++) {
    var playerDiv = document.createElement("div");
    playerDiv.appendChild(document.createTextNode(team1[i].name));
    team1Div.appendChild(playerDiv);
  }

  for (var i = 0; i < team2.length; i++) {
    var playerDiv = document.createElement("div");
    playerDiv.appendChild(document.createTextNode(team2[i].name));
    team2Div.appendChild(playerDiv);
  }
}




