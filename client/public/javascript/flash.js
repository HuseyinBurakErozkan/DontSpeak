var flashTimer;

function flash(msg, type) {

  // Check if a flash message has already been displayed. If not, create a new one.
  // If so, just reuse the existing flash elements
  var flashDialog = $("#flash-dialog");
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
    flashText = $("<p/>", { id: "flash-text" }).text(msg);
    $(".app-container").append(flashDialog);
    flashDialog.append(flashText);
  }

  if (type === "error") {
    console.log("ERROR: " + msg);
    flashDialog.addClass("--error");
    flashText.text(msg);
  } else if (type === "tip") {
    flashDialog.addClass("--tip");
    flashText.text(msg);
  }

  flashTimer = setTimeout(() => {
    flashDialog.addClass("--hide");
    clearTimeout(flashTimer);
  }, 4000);
}