const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const fileUpload = require('express-fileupload');

// create express app
const app = express();


// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// enable cors
app.use(cors())

// enable file upload
app.use(fileUpload())

// connect to the database
// Configuring the database
const dbConfig = require('./config/mysql.config.js');


// MongoDB connection, commented for now

/*
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
// Connecting to the database
mongoose.connect(dbConfig.url, {
    useNewUrlParser: true, useUnifiedTopology: true
}).then(() => {
    console.log("Successfully connected to the database");
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});
*/

var connection = mysql.createConnection(dbConfig);
connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected to MySQL!");
});


// define a simple route
app.get('/', (req, res) => {
    res.json({ "message": "Welcome to the application. Express JS is outputting this JSON. " });
});

// ........

// Require routes
require('./app/routes/routes.js')(app);

// ........


// listen for requests
app.listen(9000, () => {
    console.log("Server is listening on port 9000");
});