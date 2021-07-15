/**
 * Handle gestures and swipes for when the speaker swipes for the next card
 */
// var container = document.body.getElementsByClassName("screen-container")[0];
var container = $(".screen-container")[0];

// Use a handler with binded parameters to allow arguments to be used, and to allow
// the event listener to be deleted.
var newTouchHandler;
var eventHandler = (callbacks, e) => {
  moveTouch(e, callbacks);
}

/**
 * 
 * @param {Associative array} callbacks Contains optional callback functions for 
 * swipes in 4 directions. For example: callbacks.left will be called if a left
 * swipe is detected.
 */
function addTouchListeners(callbacks) {
  container.addEventListener("touchstart", startTouch, false);
  // Bind the callbacks array to the function, rather than using an anonymous
  // function, as otherwise it can't be removed.
  newTouchHandler = eventHandler.bind(this, callbacks);
  container.addEventListener("touchmove", newTouchHandler, false);
  container.addEventListener("touchend", endTouch, false);  
}

/**
 * Remove the eventlisteners for touch related events
 */
function removeTouchListeners() {
  container.removeEventListener("touchstart", startTouch, false);
  container.removeEventListener("touchmove", newTouchHandler, false);
  container.removeEventListener("touchend", endTouch, false);
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

  // If the user swipes left or right, that indicates that they're done with the current
  // card/word
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