const allTier1Words = [
  ['dog', ['cat', 'pet', 'woof', 'puppy']],
  ['cat', ['kitten', 'dog', 'pet', 'meow']],
  ['moon', ['earh', 'sun', 'satellite', 'sky']],
  ['house', ['home', 'live', 'shelter', 'residence']],
  ['car', ['vehicle', 'automobile', 'drive', 'transport']],
  ['watch', ['time', 'wrist', 'clock', 'time']],
  ['glacier', ['ice', 'water', 'snow', 'mountain']],
  ['summer', ['season', 'winter', 'spring', 'autumn']],
  ['beach', ['water', 'shore', 'sand', 'ocean']],
  ['umbrella', ['shade', 'rain', 'parasol', 'sun']],
  ['idea', ['plan', 'thought', 'design', 'think']]
];

const allTier2Words = [
  ['senior', ['citizen', 'old', 'gramps', 'junior']],
  ['woods', ['tree', 'forest', 'animals', 'timber']],
  ['oasis', ['desert', 'water', 'drink', '']],
  ['floodplains', ['flat', 'river', 'flat', 'land']],
  ['wetlands', ['marsh', 'water', 'marsh', 'swamp']],
  ['tundra', ['cold', 'ice', 'snow', 'moss']]
];

const allTier3Words = [
  ['anecdote', ['story', 'account', 'tale', 'experience']]
];


function Word() {

  // Create a deep copy of each of the original arrays of words
  this.remainingTier1Words = JSON.parse(JSON.stringify(allTier1Words));
  this.remainingTier2Words = JSON.parse(JSON.stringify(allTier2Words));
  
  
  this.getWord = (tier = 1) => {
     
    var words;

    switch(tier) {
      case 1:
        words = this.remainingTier1Words;
        break;
      case 2:
        words = this.remainingTier2Words;
        // TODO: Add a new, harder, tier of words
        break;
      default: // Default to the hardest tier, as the strategy handler doesn't stop incrementing
        words = this.remainingTier2Words;
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