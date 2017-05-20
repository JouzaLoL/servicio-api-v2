'use strict';

let express = require('express');
var app = express();
module.exports = app;

// Modules
let chalk = require('chalk');

let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

let cors = require('cors');
app.use(cors());

let config = require('config');
let mongoose = require('mongoose');
mongoose.Promise = global.Promise;
if (process.env.NODE_ENV == 'production') {
  console.log('Configuring server for production environment');
  mongoose.connect(process.env.DB_URL);
  app.set('superSecret', process.env.SECRET);
} else {
  mongoose.connect(config.db);
  app.set('superSecret', config.secret);
}
mongoose.connect(dbUrl);

// Routes
let API = require('./routes/api.js');
app.use('/api/', API);

// Error handler
let errorHandler = require('./errors/error-handler.js');
app.use(errorHandler);

// Start server
let port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(chalk.green('Server started') + " | NODE_ENV: " + config.util.getEnv('NODE_ENV'));
});