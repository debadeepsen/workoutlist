const connection = require('./mysql.controller');


exports.getAll = (req, res) => {
    if (!req.params.month) {
        return res.status(400).send({
            success: false,
            message: `Month is required`,
            data: null
        })
    }

    if (req.params.month > 12) {
        return res.status(400).send({
            success: false,
            message: `Invalid value of month: ${req.params.month}`,
            data: null
        })
    }

    if (!req.params.year) {
        return res.status(400).send({
            success: false,
            message: `Year is required`,
            data: null
        })
    }

    if (req.params.year.toString().length != 4) {
        return res.status(400).send({
            success: false,
            message: `Invalid value of year: ${req.params.year}`,
            data: null
        })
    }

    let year = req.params.year;
    let month = req.params.month < 9 ? "0" + req.params.month : req.params.month;

    let query = `SELECT 
                    t.*, (CONCAT(p.ProjectCode, '-', t.WorkItemKey)) AS \`Key\`, tt.TaskTypeId, tt.TaskTypeName, tt.IconClass, ts.TaskStatusId, ts.StatusText
                    FROM task t 
                    JOIN task_status ts ON t.TaskStatusId = ts.TaskStatusId
                    JOIN task_type tt ON t.TaskTypeId = tt.TaskTypeId
                    JOIN project p ON t.ProjectId = p.ProjectId
                    WHERE t.CreatedDateTime > '${year}-${month}-01'
                    AND (t.ProjectId = 4 OR t.ProjectId = 11) 
                    ORDER BY t.CreatedDateTime ASC `;

    connection.query(query, function (obj) {
        return res.status(200).send({
            success: obj.error != null,
            message: 'Success',
            data: obj.response
        })
    })
}