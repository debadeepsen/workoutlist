const connection = require('./mysql.controller');

// Create a Project Role
exports.crup = (req, res) => {

    console.log(req.body);

    // Validate request
    if (!req.body.ProjectRoleName) {
        return res.status(400).send({
            success: false, message: "Project Role name cannot be empty", data: null
        });
    }

    if (!req.body.OrganizationId) {
        return res.status(400).send({
            success: false, message: "Organization Id cannot be empty", data: null
        });
    }

    let crupQuery = req.body.ProjectRoleId ?
        `UPDATE project_role set 
                             ProjectRoleName ='${req.body.ProjectRoleName}',
                             ProjectRoleDescription = '${req.body.ProjectRoleDescription}',
                             OrganizationId = '${req.body.OrganizationId}',
                             LastUpdatedBy = '${req.body.LastUpdatedBy}'
                             where ProjectRoleId = ${req.body.ProjectRoleId} ` :
        `INSERT INTO  project_role (ProjectRoleName,ProjectRoleDescription,OrganizationId,CreatedBy)
                            VALUES('${req.body.ProjectRoleName}',
                            '${req.body.ProjectRoleDescription}',
                            '${req.body.OrganizationId}',
                            '${req.body.CreatedBy}')`;


    if (req.body.ProjectRoleId && req.query.delete) {

        crupQuery = `UPDATE project_role set  Deleted ='Y',DeletedBy='${req.body.LastUpdatedBy}',DeletedDateTime=now() where ProjectRoleId = ${req.body.ProjectRoleId}`;
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

exports.list = (req, res) => {

    if (!req.query.OrganizationId) {
        return res.status(400).send({
            message: "Organization Id cannot be empty"
        });
    }

    connection.query(`SELECT *
                        FROM project_role p
                        JOIN organization o ON p.OrganizationId = p.OrganizationId                      
                        ORDER BY p.ProjectRoleName
                        `, function (obj) {
        if (obj.response.length)
            res.status(200).send({ success: true, message: null, data: obj.response });
        else
            res.status(400).send({ success: false, message: ``, data: null });
    });

}

exports.supervisorsInproject = (req, res) => {
    if (!req.query.ProjectId) {
        return res.status(400).send({
            message: "Organization Id cannot be empty"
        });
    }

    var query = `SELECT Distinct sem.SupervisorId, CONCAT(E1.FirstName,'  ',E1.LastName)
    as SupervisorName FROM employee_supervisor_map sem join employee 
    E1 on sem.SupervisorId = E1.EmployeeId join project_employee_map pem on sem.SupervisorId = pem.EmployeeId
    where pem.ProjectId = ${req.query.ProjectId} ;`
    connection.query(query, function (obj) {
        if (obj.response.length)
            res.status(200).send({ success: true, message: null, data: obj.response });
        else
            res.status(400).send({ success: false, message: ``, data: null });
    })
}