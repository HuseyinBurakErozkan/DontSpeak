const fs = require('fs');
const readline = require('readline');

async function addWordToArray(array, file) {
  const fileStream = fs.createReadStream("./assets/" + file);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    
    // Line must have text
    if (line === "") {
      continue;
    }

    // Must split each word using ',' as the delimiter, as each line
    // in the file looks like so: dog,cat,puppy,pet,woof
    var words = line.split(",");

    // Ensure that each line has 5 words - 1 Taboo word and 4 secondary words
    if (words.length !== 6) {
      continue;
    }

    var tabooWord = words[0]; // The primary word the speaker can't say
    words.shift(); // Remove the primary word from the array
    var formattedWord = [tabooWord, words];
    array.push(formattedWord);
  }
}

function initialiseWordArray(array, file) {
  addWordToArray(array, file);
}

var allTier1Words = [];
initialiseWordArray(allTier1Words, "wordstier1.txt");
var allTier2Words = [];
initialiseWordArray(allTier2Words, "wordstier2.txt");
var allTier3Words = [];
initialiseWordArray(allTier3Words, "wordstier3.txt");


function Word() {

  // Create a deep copy of each of the original arrays of words
  this.remainingTier1Words = JSON.parse(JSON.stringify(allTier1Words));
  this.remainingTier2Words = JSON.parse(JSON.stringify(allTier2Words));
  this.remainingTier3Words = JSON.parse(JSON.stringify(allTier3Words));
  
  this.getWord = (tier = 1) => {
     
    var words;

    switch(tier) {
      case 1:
        words = this.remainingTier1Words;
        break;
      case 2:
        words = this.remainingTier2Words;
        break;
      case 3:
        words = this.remainingTier3Words;
        break;
      default: // Default to the hardest tier, as the strategy handler doesn't stop incrementing
        words = this.remainingTier3Words;
        break;
    }

    /**
     * If an array of a specific tier is somehow exhausted of words, repopulate it using the
     * original words. Even if the words are repeated, there should be a low chance of the
     * same person receiving the word.
     * 
     * With enough words for each tier, this will almost never be a problem.
     */
    if (words.length === 0) {
      if (words === this.remainingTier1Words) {
        this.remainingTier1Words = JSON.parse(JSON.stringify(allTier1Words));
        words = this.remainingTier1Words;
      } else if (words === this.remainingTier2Words) {
        this.remainingTier2Words = JSON.parse(JSON.stringify(allTier2Words));
        words = this.remainingTier2Words;
      } else if (words === this.remainingTier3Words) {
        this.remainingTier3Words = JSON.parse(JSON.stringify(allTier3Words));
        words = this.remainingTier3Words;
      }
    }

    // Get a random word from the array, then remove it so it can't be chosen again during the game
    randIndex = Math.floor(Math.random() * (words.length - 1));
    var word = words[randIndex];
    words.splice(randIndex, 1); // Deletes and returns an ARRAY of the deleted elements

    return word;
  }
}

module.exports = {
  Word: Word
}