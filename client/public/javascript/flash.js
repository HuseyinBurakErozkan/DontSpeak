var flashTimer;


function flash(msg, type) {

  // Check if a flash message has already been displayed. If not, create a new one.
  // If so, just reuse the existing flash elements
  var flashDialog = $("#flash-dialog");
  var flashTextContainer = $("#flash-text-container");
  var flashText = $("#flash-text");

  if (flashDialog.length) { // Flash element exists.

    // Remove all previously attached flash types
    flashDialog.removeClass("--error");
    flashDialog.removeClass("--tip");
    
    // Remove the --hide class which is used for the opacity transition
    flashDialog.removeClass("--hide");

    // Clear any timeouts that may exist, as not doing so would mean that the flash
    // message will be hidden quicker than normal, since the previous timer will still
    // be running and therefore hide the flash once complete.
    if (flashTimer !== undefined) {
      clearTimeout(flashTimer);
    }
  } else {

    // Create the flash element
    flashDialog = $("<div/>", { id: "flash-dialog", class: "flash-dialog" });

    // Need to also add the hide class at the beginning, so it can be removed and
    // therefore the flash be animated.
    flashDialog.addClass("--hide");

    flashTextContainer = $("<div/>", { id: "flash-text-container", class: "flash-text-container" });
    flashText = $("<p/>", { id: "flash-text" }).text(msg);
    $(".app-container").append(flashDialog);
    
    flashDialog.append(flashTextContainer);
    flashTextContainer.append(flashText);

    setTimeout(() => {
      flashDialog.removeClass("--hide");
    }, 200);

  }

  if (type === "error") {
    console.log("ERROR: " + msg);
    flashDialog.addClass("--error");
    flashText.text(msg);
  } else if (type === "information") {
    flashDialog.addClass("--tip");
    flashText.text(msg);
  }

  flashTimer = setTimeout(() => {
    flashDialog.addClass("--hide");
    clearTimeout(flashTimer);
  }, 400000); // TODO: SET TO 4 SECONDS ONCE TESTING IS DONE
}