/**
 * This file stores all non-user game-related routes and methods.
 */

const path = require('path');

const CLIENT_DIR = path.join(__dirname, '../client');

module.exports = function(app) {

  app.get('/', (req, res) => {
    res.sendFile(path.join(CLIENT_DIR, '/index.html'));
  });


}

