const connection = require('./mysql.controller');

exports.feedback_crup = (req, res) => {

    let crupQuery = `INSERT INTO feedback (FeedbackTitle,${req.body.FeedbackDescription ? "FeedbackDescription," : ""}EmployeeId,CreatedBy)
                     VALUES('${req.body.FeedbackTitle.replace(/'/g, "\\'")}',
                     ${req.body.FeedbackDescription ? "'" + req.body.FeedbackDescription.replace(/'/g, "\\'") + "'" + "," : ""}
                     '${req.body.EmployeeId}',
                    '${req.body.CreatedBy}' )`;

    console.log(crupQuery);
    connection.query(crupQuery, function (obj) {

        if (obj.error != null) {
            res.status(400).send({
                success: false,
                message: obj.message || `ERROR`,
                data: null
            });
            return;
        }

        let feedbackId = obj.response.insertId;

        var attachments = (req.body.attachments) ? req.body.attachments : [];

        let attachmentFileNames = ``;
        attachments.forEach(e => {
            attachmentFileNames += `(${feedbackId},'${e}', ${req.body.EmployeeId}),`
        });

        attachmentFileNames = attachmentFileNames.substr(0, attachmentFileNames.length - 1) + `;`;

        let filesQuery = `DELETE FROM feedback_files WHERE FeedbackId = ${feedbackId};`


        if (attachments.length) {
            filesQuery += `INSERT INTO feedback_files (FeedbackId, FileURL, CreatedBy) VALUES ${attachmentFileNames}`; //do nothing if no files are getting uploaded
        }

        let tasks = req.body.tasks;
        let feedbackFileNames = ``;
        tasks.forEach(e => {
            feedbackFileNames += `(${feedbackId},${e.TaskId}),`
        });
        feedbackFileNames = feedbackFileNames.substr(0, feedbackFileNames.length - 1) + `;`;

        if (tasks.length) {
            filesQuery += `INSERT INTO feedback_task_map (FeedbackId, TaskId) VALUES ${feedbackFileNames}`; //do nothing if no files are getting map
        }

        console.log(filesQuery);
        connection.query(filesQuery, function (obj) {
            return res.status(200).send({
                success: obj.error == null && obj.error == null,
                message: obj.error || obj.error || `Success`,
                data: obj.response
            });

        });


    })


}

exports.feedback_list = (req, res) => {

    let query = `SELECT f.*,e.* from feedback f
                JOIN  employee e ON f.EmployeeId = e.EmployeeId Where f.Deleted='N'`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}