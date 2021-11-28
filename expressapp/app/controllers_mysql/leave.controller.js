const connection = require('./mysql.controller');

exports.saveLeaveApplication = (req, res) => {
    let query = `INSERT INTO leave_record ( EmployeeId, LeaveDate, Reason, CreatedBy) VALUES `

    if (req.body.Items) {
        req.body.Items.forEach(e => {
            query += `('${req.body.CreatedBy}','${e.LeaveDate}','${e.Reason.replace(/'/g, "''")}', ${req.body.CreatedBy}),`
        });
    }
    console.log(query);

    // trim the ending comma
    query = query.substr(0, query.length - 1);

    console.log(query)

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

//Get Leave Record by Employee Id
exports.leave_record_list = (req, res) => {

    let listQuery = `SELECT lr.* FROM  leave_record lr WHERE lr.EmployeeId = '${req.params.EmployeeId}';`

    console.log(listQuery);
    connection.query(listQuery, function (obj) {

        res.status(200).send({ success: true, message: null, data: obj.response });
    });

}

// delete leave record by leave record id 

exports.delete_leave_record = (req, res) => {
    let query = ` DELETE FROM leave_record WHERE LeaveId ='${req.body.LeaveId}' `;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

// Check Leave record 
exports.check_leave_record = (req, res) => {

    let Query = `SELECT lr.* FROM leave_record lr WHERE lr.LeaveDate = '${req.query.EntryDate}' AND lr.EmployeeId='${req.query.EmployeeId}'`;

    console.log(Query);
    connection.query(Query, function (obj) {
        res.send({
            success: obj.error == null,
            message: "success",
            data: obj.response
        });
    });
}