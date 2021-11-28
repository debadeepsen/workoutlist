const connection = require('./mysql.controller');


exports.send = (req, res) => {

    if (!req.body.From) {
        res.status(400).send({ Error: 'From cannot be empty.' });
    }

    if (!req.body.To) {
        res.status(400).send({ Error: 'To cannot be empty.' });
    }

    let msg = req.body.MessageText.replace(/'/g, "\\'");

    let chatQuery = `INSERT INTO messages (FromId, ToId, MessageText) 
    VALUES ('${req.body.From}', '${req.body.To}', '${msg}')`;

    connection.query(chatQuery,
        function (obj) {
            res.send({
                success: obj.error == null,
                message: obj.error || `Success`,
                data: obj.response
            });
        });
}

exports.list = (req, res) => {

    if (!req.query.From) {
        res.status(400).send({ Error: 'From cannot be empty.' });
    }

    if (!req.query.To) {
        res.status(400).send({ Error: 'To cannot be empty.' });
    }

    let chatQuery = `SELECT 
            m.MessageId, m.FromId, ef.FullName FromName, m.ToId, et.FullName ToName, m.MessageText, m.CreatedTimeStamp
            
            FROM messages m
            JOIN employee ef ON ef.EmployeeId = m.FromId
            JOIN employee et ON et.EmployeeId = m.ToId
            WHERE 
            (m.FromId = ${req.query.From} AND m.ToId = ${req.query.To})
            OR
            (m.ToId = ${req.query.From} AND m.FromId = ${req.query.To})
            ORDER BY m.CreatedTimeStamp`;

    // console.log(chatQuery);

    connection.query(chatQuery,
        function (obj) {
            res.send({
                success: obj.error == null,
                message: obj.error || `Success`,
                data: {
                    chats: obj.response,
                    lastUpdated: new Date()// obj.response.length ? obj.response[obj.response.length - 1].CreatedTimeStamp : null
                }
            });
        });
}

exports.check = (req, res) => {

    if (!req.query.From) {
        res.status(400).send({ Error: 'From cannot be empty.' });
    }

    if (!req.query.To) {
        res.status(400).send({ Error: 'To cannot be empty.' });
    }

    if (!req.query.CreatedTimeStamp || req.query.CreatedTimeStamp == undefined) {
        res.status(200).send({
            success: true,
            message: `Success`,
            data: {
                NeedsUpdate: true
            }
        });
        return;
    }

    let chatQuery = `SELECT 
        COUNT(m.MessageId) NewRows
        FROM messages m
        WHERE 
        (
            (m.FromId = ${req.query.From} AND m.ToId = ${req.query.To})
            OR
            (m.ToId = ${req.query.From} AND m.FromId = ${req.query.To})
        )
        AND
        m.CreatedTimeStamp > CONVERT_TZ('${req.query.CreatedTimeStamp}','+00:00','+05:30');`;

    // console.log(chatQuery);

    connection.query(chatQuery,
        function (obj) {
            res.send({
                success: obj.error == null,
                message: obj.error || `Success`,
                data: {
                    NewRows: obj.response[0].NewRows,
                    NeedsUpdate: obj.response[0].NewRows > 0
                }
            });
        });
}