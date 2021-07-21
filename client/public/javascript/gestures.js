/**
 * Handle gestures and swipes for when the speaker swipes for the next card
 */
var container = $(".screen-container")[0];

// Use a handler with binded parameters to allow arguments to be used, and to allow
// the event listener to be deleted.
var newTouchHandler;

var eventHandler = (callbacks, e) => {
  moveTouch(e, callbacks);
  handleKeys(e, callbacks);
}

// Handle key events, to allow desktop players to play via keys
var keyHandler;

/**
 * Handle user key inputs, specifically for playing the game.
 * @param {Event} e The event that fired this function 
 * @param {Associative array} callbacks Callbacks provided for specific keys
 */
function handleKeys(e, callbacks) {
  
  // Handle different functionalities for certain keys by checking if a callback
  // was provided for them. If a callback was provided, also check if an argument
  // was provided
  switch (e.keyCode) {
    case 32: // Space key
      if (callbacks.spaceKey !== undefined) {
        if (callbacks.spaceKeyArgs !== undefined) {
          callbacks.spaceKey(callbacks.spaceKeyArgs);
        } else {
          callbacks.spaceKey(); 
        }
      }
      break;

    case 37: // Left key
      if (callbacks.leftKey !== undefined) { 
        if (callbacks.leftKeyArgs !== undefined) {
          callbacks.leftKey(callbacks.leftKeyArgs);
        } else {
          callbacks.leftKey(); 
        }
      }
      break;

    case 39: // Right key
      if (callbacks.rightKey !== undefined) { 
        if (callbacks.rightKeyArgs !== undefined) {
          callbacks.rightKey(callbacks.rightKeyArgs);
        } else {
          callbacks.rightKey(); 
        }
      }
      break;
  }
}

/**
 * 
 * @param {Associative array} callbacks Contains optional callback functions for 
 * swipes in 4 directions. For example: callbacks.left will be called if a left
 * swipe is detected.
 */
function addEventListeners(callbacks) {

  // First remove any listeners that may have been used for another screen
  removeEventListeners();

  container.addEventListener("touchstart", startTouch, false);
  // Bind the callbacks array to the function, rather than using an anonymous
  // function, as otherwise it can't be removed.
  newTouchHandler = eventHandler.bind(this, callbacks);
  container.addEventListener("touchmove", newTouchHandler, false);
  container.addEventListener("touchend", endTouch, false);

  // Since touch-related event don't work for every browser, allow the user
  // to perform some actions with specific keys
  keyHandler = eventHandler.bind(this, callbacks);
  document.addEventListener("keyup", keyHandler, false);
}

/**
 * Remove the eventlisteners for touch related events
 */
function removeEventListeners() {
  container.removeEventListener("touchstart", startTouch, false);
  container.removeEventListener("touchmove", newTouchHandler, false);
  container.removeEventListener("touchend", endTouch, false);
  document.removeEventListener("keyup", keyHandler, false);
}

var initialX = null;
var initialY = null;

function startTouch(e) {
  initialX = e.touches[0].clientX;
  initialY = e.touches[0].clientY;
}

/**
 * Detect swipe events, and call functions depending on the swipe direction
 * @param {Event} e 
 * @param {Associative array} callbacks Contains optional callback functions for 
 * swipes in 4 directions, as well as arguments. For example: callbacks.left will 
 * be called if a left swipe is detected. If callbacks.leftArgs is defined, it will
 * also pass those as arguments to the callback
 */
function moveTouch(e, callbacks) {
  if (initialX === null) {
    return;
  }

  if (initialY === null) {
    return;
  }

  var currentX = e.touches[0].clientX;
  var currentY = e.touches[0].clientY;
  var diffX = initialX - currentX;
  var diffY = initialY - currentY;

  // Used to determine if the user is trying to swipe, or merely touched the screen
  // Since device screens can be larger than others, set a minimum threshold that can
  // be either a fifth of the screen's width, or 50px
  var minSwipeDistance = Math.min(screen.width / 5, 50);

  var swiped = false;

  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > minSwipeDistance) {
      console.log("Swiped left")

      if (callbacks.left !== undefined) {

        // Check if any arguments are provided, and if so, pass them to the callback
        if (callbacks.leftArgs !== undefined) {
          callbacks.left(callbacks.leftArgs);
        } else {
          callbacks.left();
        }
      }
      swiped = true;

    } else if (diffX < -Math.abs(minSwipeDistance)) {
      console.log("Swiped right")

      if (callbacks.right !== undefined) {
        // Check if any arguments are provided, and if so, pass them to the callback
        if (callbacks.rightArgs !== undefined) {
          callbacks.right(callbacks.rightArgs);
        } else {
          callbacks.right();
        }
      }
      swiped = true;
    }
  } else {
    if (diffY > minSwipeDistance) {
      console.log("Swiped up");

      if (callbacks.up !== undefined) {
        // Check if any arguments are provided, and if so, pass them to the callback
        if (callbacks.upArgs !== undefined) {
          callbacks.up(callbacks.upArgs);
        } else {
          callbacks.up();
        }
      }
      swiped = true;

    } else if (diffY < -Math.abs(minSwipeDistance)) {
      console.log("Swiped down");

      if (callbacks.down !== undefined) {
        // Check if any arguments are provided, and if so, pass them to the callback
        if (callbacks.downArgs !== undefined) {
          callbacks.down(callbacks.downArgs);
        } else {
          callbacks.down();
        }
      }
      
      swiped = true;
    }
  }

  // Once its determined that the user has swiped, reset values to stop swipe-related 
  // functionality from continuously firing. Only once the user touches the screen
  // again, will they be able to swipe again.
  if (swiped === true) {
    initialX = null;
    initialY = null;
  }
  
  e.preventDefault();
}


function endTouch(e) {
  initialX = null;
  initialY = null;
}