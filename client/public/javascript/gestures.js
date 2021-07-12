/**
 * Handle gestures and swipes for when the speaker swipes for the next card
 */
// var container = document.body.getElementsByClassName("screen-container")[0];
var container = $(".screen-container")[0];

function addTouchListeners() {
  container.addEventListener("touchstart", startTouch, false);
  container.addEventListener("touchmove", moveTouch, false);
  container.addEventListener("touchend", endTouch, false);  
}

function removeTouchListeners() {
  container.removeEventListener("touchstart", startTouch, false);
  container.removeEventListener("touchmove", moveTouch, false);
  container.removeEventListener("touchend", endTouch, false);  
}

var initialX = null;
var initialY = null;

function startTouch(e) {
  initialX = e.touches[0].clientX;
  initialY = e.touches[0].clientY;
}

function moveTouch(e) {
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
  // be either the quarter of the screen's width, or 100px
  var minSwipeDistance = Math.min(screen.width / 3, 150);

  var swiped = false;

  // If the user swipes left or right, that indicates that they're done with the current
  // card/word
  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > minSwipeDistance) {
      console.log("Swiped left")
      console.log("client: requesting word");

      socket.emit("request: word");

      swiped = true;
    } else if (diffX < -Math.abs(minSwipeDistance)) {
      console.log("Swiped right")
      console.log("client: requesting word");
      
      socket.emit("request: word");

      swiped = true;
    }
  } else {
    if (diffY > minSwipeDistance) {
      console.log("Swiped up");
      swiped = true;
    } else if (diffY < -Math.abs(minSwipeDistance)) {
      console.log("Swiped down");
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