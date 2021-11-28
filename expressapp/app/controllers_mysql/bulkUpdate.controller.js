const connection = require('./mysql.controller');

//save Bulk Update

exports.save = (req, res) => {
    console.log('Inside query');
   
    if (req.body.Items.length == 0) {
        return res.status(400).send({
            message: "Blank Data"
        });
    }
    console.log(req.body.Items);
    let query = ``;
    req.body.Items.forEach(e => {
        query += `UPDATE task SET TaskPriorityId = '${e.TaskPriorityId}', WorkitemStatusId = '${e.WorkitemStatusId}',
        AssigneeId = '${e.AssigneeId}'
        WHERE TaskId = '${e.TaskId}'; `
    })

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}