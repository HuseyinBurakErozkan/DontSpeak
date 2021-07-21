var flashTimer;
var currentTutorialMsg;

var tutorialMsgs = {
  intro: 
    "Hi!\n\nI will guide you throughout the game. If you want to turn off hints, " +
    "click the red button on the bottom right corner.\n\nYou can click it again to toggle " +
    "hints on, or to see the tip again.",

  lobbyInstruction:
    "This is the lobby. Once everyone joins, click on start to confirm that you're ready\n\n" +
    "The game will start once everyone confirms that they are ready\n\n" +
    "To swap teams, swipe left or right\n\n" +
    "Once start is clicked, one of the teams will be randomly chosen to start\n\n" +
    "You can click the '?' button below to disable/enable these tips any time",
    
  speakerInstruction: 
    "You're the speaker for this round. As the speaker, you have to describe to your " +
    "teammates what the taboo word is and have them say the taboo word out loud. The taboo " +
    "word is the word on the top of the card with a green background. You can not say any " +
    "of the other similar words on the card, unless your teammate says it, in which case " +
    "you can say them.\n\nIf you accidentally say any of the taboo words, you have to forfeit " +
    "the card and move on the next.\n\nYou can also move on to the next card if you find it " +
    "too difficult or not worth doing.\n\nSwipe left or right to get a new card.\n\n" +
    "Once you and your teammates are ready, click start",

  guesserInstruction: 
    "Your teammate will be the speaker. They're going to describe the taboo word " +
    "and you will have to guess what the word is and say it out loud.\n\nEach taboo word " +
    "also has 4 similar words that can't be said by your teammate, unless you say the word " +
    "first.\n\nTry help your teammate by saying any words that are similar to what you think " +
    "your teammate is describing to you, as they will then have an easier time describing the " +
    "word once they're able to use the other similar taboo words!\n\nGood luck! And stop " +
    "looking at the screen!",

  oppositionInstruction: 
    "Your team is the opposing team for this round.\n\nAs the speaker describes the taboo " +
    "word, which is at the top of the card, you have to make sure that they don't " +
    "accidentally say any of the the 5 words listed on the card.\n\nIf the guesser guesses " +
    "one of the other 4 similar words, the speaker is allowed to use them afterwards.\n\n" +
    "If the speaker says one of the taboo words before the guesser guesses it, you must " +
    "call it out and they will have to forfeit the card and move on the next.\n\nThe speaker " +
    "is allowed to skip as many words as they want if they think the word is too difficult.\n\n" +
    "Good luck! And make sure to call out the speaker if they say a taboo word, otherwise they " +
    "may get a free point!",

  roundOverSpeakerInstruction: 
    "The round is over!\n\nEverybody now needs to review how many taboo words " +
    "(the primary word in green) the guesser or guessers got right and how many you got disqualified for.\n\n" +
    "Discuss how many words the guesser or guessers got right with everybody, and then enter the amount in the " +
    "dialog box at the bottom.\n\nEach word your team got right = 1 point.\nEach word you got " +
    "disqualified for = -1 point.\n\nIf your points for this round are below 0, enter 0 as " +
    "you can't lose points.\n\nOnce you enter the amount of points you've earned, " +
    "everybody else needs to confirm it before the game can continue.\n\nYou can always " +
    "re-enter a new value if you realised you entered the wrong amount.",

  roundOverGuesserInstruction:
    "The round is over!\n\nReview the taboo words (the words in green) you and the speaker " +
    "got right and which words the speaker got disqualified for.\n\nEach word your team got " +
    "right = 1 point.\nEach word your team got disqualified = -1 point.\n\nYou can't score " +
    "below 0 points, so the speaker will enter 0 in that case.\n\nOnce the speaker enters the " +
    "amount of points they believe they earned, everybody must confirm it.\n\nClick the button " +
    "to confirm.",

  roundOverOppositionInstruction:
    "The round is over!\n\nHave a look at all the words listed and discuss with everbody " +
    "the amount of taboo words (the words in green) that the speaker and guessers got right, as well as how many words " +
    "the speaker got disqualified for.\n\nEach word the guessers got right = 1 point.\n" +
    "Each word the speaker got disqualified for = -1 point.\n\nIf the speaker and guessers got " +
    "below 0 points, they will enter 0, as negative points aren't allowed.\n\n Once everybody " +
    "agrees, the speaker will enter the amount of points you got and you will then need to " +
    "confirm.\n\nIf the speaker entered the wrong amount of points, let them know so they can " +
    "change their answer." 
}

// When the 'x' button is pressed for any of the flash messages, hide its parent 
// flash message
$(".flash-button-close").click((e) => {
  $(e.target).closest(".flash-dialog").addClass("--hide");

  // If the flash message the user is clicking 'x' on is a informational flash message,
  // add a little animation to help them understand the button's function/relevance
  if ($(e.target).closest(".--tip")) {
    // Animate the help button to help the player understand
    animateHelpButton();
  }
});

/**
 * Flash a message, using the type to determine how the flash would look and behave
 * @param {String} msg The message to flash 
 * @param {String} type The type of message, which can be "error" or "information"
 */
function flash(msg, type) {

  var flashElement;

  // Errors will be displayed for a few seconds, before disappearing
  if (type === "error") {
    flashElement = $("#flash-dialog-error");

    // Clear any timeouts that may exist, as not doing so would mean that the flash
    // message will be hidden quicker than normal, since the previous timer will still
    // be running and therefore hide the flash once complete.
    if (flashTimer !== undefined) {
      clearTimeout(flashTimer);
    }

    flashTimer = setTimeout(() => {
      flashElement.addClass("--hide");
      clearTimeout(flashTimer);
    }, 5000);

  // Information or hints will be displayed until the user hits 'x' or the toggleable button
  } else if (type === "information") {
    flashElement = $("#flash-dialog-information");

    // Save the msg so that the user can view it again if they need to
    currentTutorialMsg = msg;

    // Animate the help button to indicate to the user that they can click on that
    // to disable/enable the flash message
    animateHelpButton();
  }

  flashElement.find(".flash-text").text(msg);
  flashElement.removeClass("--hide");
}
