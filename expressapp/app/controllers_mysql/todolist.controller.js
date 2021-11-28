const connection = require('./mysql.controller');

// to do list 
exports.todolist_list = (req, res) => {

    if (!req.query.EmployeeId) {
        res.status(400).send({
            success: false,
            message: `EmployeeId is required`,
            data: null
        });

        return;
    }

    let listQuery = `SELECT *, -DATEDIFF(NOW(), ToDoListDueDate) As DaysLeft
                         FROM to_do_list WHERE CreatedBy = '${req.query.EmployeeId}' and Deleted='N'
                         ORDER BY ToDoListDueDate`;

    connection.query(listQuery, function (obj) {

        res.status(200).send({
            success: true,
            message: null,
            data: obj.response
        });

    });
}

// to do list Create 
exports.todolist_crup = (req, res) => {

    console.log(req.body)

    let crupQuery = req.body.ToDoListId ?
        `UPDATE to_do_list set 
                    ToDoListItem = '${req.body.ToDoListItem.replace(/'/g, '\\\'')}',
                    ToDoListDescription = '${req.body.ToDoListDescription ? req.body.ToDoListDescription.replace(/'/g, '\\\'') : ""}',
                    ToDoListDueDate = '${req.body.ToDoListDueDate}',
                    LastUpdatedBy = '${req.body.LastUpdatedBy}'
                    where ToDoListId =${req.body.ToDoListId}` :
        `INSERT INTO to_do_list (ToDoListItem, ToDoListDescription,ToDoListDueDate,CreatedBy)
                    VALUES('${req.body.ToDoListItem.replace(/'/g, '\\\'')}', 
                    '${req.body.ToDoListDescription.replace(/'/g, '\\\'')}',
                    '${req.body.ToDoListDueDate}',
                    '${req.body.CreatedBy}')`;

    if (req.body.ToDoListId && req.query.delete) {

        crupQuery = `UPDATE to_do_list set  Deleted ='Y',DeletedBy='${req.body.LastUpdatedBy}',DeletedDateTime=now() where ToDoListId = ${req.body.ToDoListId}`;

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


//check
exports.todolist_check = (req, res) => {
    let query = `UPDATE to_do_list set Done ='${req.body.Done}' where ToDoListId = ${req.body.ToDoListId}`;
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}


// bulk save
exports.bulk_save = (req, res) => {
    let query = `INSERT INTO to_do_list (ToDoListItem, ToDoListDueDate, CreatedBy) VALUES `;

    // build the query
    req.body.Items.forEach(e => {
        if (e.ToDoListItem)
            query += `('${e.ToDoListItem.replace(/'/g, '\\\'')}','${e.ToDoListDueDate}','${req.body.EmployeeId}'),`;
    });

    // trim the ending comma
    query = query.substr(0, query.length - 1);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

// delete to-do list item best on id
exports.delete_to_do_list = (req, res) => {

    let query = `UPDATE to_do_list SET
                     Deleted = 'Y',
                     DeletedBy= '${req.body.EmployeeId}',
                     DeletedDateTime = now()
                     where ToDoListId =${req.body.ToDoListId}`;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}