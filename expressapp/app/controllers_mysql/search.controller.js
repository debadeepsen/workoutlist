const connection = require('./mysql.controller');

exports.search = (req, res) => {
    let searchQuery = `SELECT * FROM task t
                    JOIN project p ON t.ProjectId = p.ProjectId
                    WHERE TaskName LIKE '%${req.query.s}%' OR TaskDescription LIKE '%${req.query.s}%'`;

    console.log(searchQuery);

    connection.query(searchQuery, function (obj) {
        res.send({
            success: true,
            message: ``,
            data: obj.response
        })
    })
}