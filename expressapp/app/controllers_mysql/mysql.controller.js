const mysql = require('mysql');

// connect to the database
// Configuring the database
const dbConfig = require('../../config/mysql.config');

exports.query = (queryText, callback) => {
    try {
        var conn = mysql.createConnection(dbConfig);
        conn.connect(function (err) {
            if (err) throw err;

            conn.query(queryText, function (err, res, fld) {
                if (err) {
                    console.error(err);
                    throw err;
                }

                conn.end();

                callback({ error: err, response: res, fields: fld });
            });
        });
    }
    catch (ex) {
        console.log(ex);
    }
}