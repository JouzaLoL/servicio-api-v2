'use strict';

const express = require('express');
var app = express();
module.exports = app;

// Modules
const chalk = require('chalk');

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

const cors = require('cors');
app.use(cors());

const cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'servicio-api',
  api_key: '456748836688146',
  api_secret: 'AVG1WDpm4oKu1u-wCeEf4OjcN7k'
});

const fileUpload = require('express-fileupload');
app.use(fileUpload());

const config = require('config');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
if (process.env.NODE_ENV == 'production') {
  console.log('Configuring server for production environment');
  mongoose.connect(process.env.DB_URL);
  app.set('superSecret', process.env.SECRET);
} else {
  mongoose.connect(config.db);
  app.set('superSecret', config.secret);
}

// Routes
const API = require('./routes/api.js');
app.use('/api/', API);

// Error handler
const errorHandler = require('./errors/error-handler.js');
app.use(errorHandler);

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(chalk.green('Server started') + " | NODE_ENV: " + config.util.getEnv('NODE_ENV'));
});