const connection = require('./mysql.controller');

//Create 
exports.crup = (req, res) => {

    if (!req.body.TaskId) {
        return res.status(400).send({
            message: "Task Id  cannot be empty"
        });
    }

    let crupQuery = req.body.CommentId ?
        `UPDATE comments set
                     TaskId ='${req.body.TaskId}',
                     CommentText ='${req.body.CommentText.replace(/'/g, "\\'")}',
                     LastUpdatedBy = '${req.body.LastUpdatedBy}'
                     where  CommentId = ${req.body.CommentId}` :
        `INSERT INTO  comments (TaskId,CommentText,CreatedBy)
                  VALUES ('${req.body.TaskId}',
                  '${req.body.CommentText.replace(/'/g, "\\'")}',
                  '${req.body.CreatedBy}')`;

    if (req.body.CommentId && req.query.delete) {
        crupQuery = `UPDATE comments set  Deleted ='Y',DeletedBy='${req.body.LastUpdatedBy}',DeletedDateTime=now() where CommentId = ${req.body.CommentId}`;
        console.log(crupQuery);
    }
    console.log(crupQuery);
    connection.query(crupQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

// list all comments By taskId

exports.listBytaskId = (req, res) => {

    // let listQuery = `SELECT CommentText FROM comments where TaskId = ${req.params.TaskId} `;
    let listQuery = `SELECT c.CommentId,c.CommentText,c.CreatedBy,c.CreatedDateTime,ep.ProfilePic ,e.FullName
                    FROM comments as c INNER JOIN employee as e ON c.CreatedBy = e.EmployeeId LEFT JOIN employee_profile as ep ON c.CreatedBy = ep.EmployeeId
                     where TaskId = ${req.params.TaskId} Order By c.CommentId desc `;

    console.log(listQuery);
    connection.query(listQuery, function (obj) {

        res.status(200).send({ success: true, message: null, data: obj.response });
    });
}

// Delete Comment By Comment Id

exports.delete_comment_by_id = (req, res) => {

    let query = `DELETE FROM comments WHERE CommentId ='${req.body.CommentId}' `;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });


}

