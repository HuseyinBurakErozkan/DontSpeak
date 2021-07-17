var flashTimer;
var currentTutorialMsg;

// When the 'x' button is pressed for any of the flash messages, hide its parent 
// flash message
$(".flash-button-close").click((e) => {
  $(e.target).closest(".flash-dialog").addClass("--hide");
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
  }

  flashElement.find(".flash-text").text(msg);
  flashElement.removeClass("--hide");
}
