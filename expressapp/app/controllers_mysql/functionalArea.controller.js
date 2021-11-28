const connection = require('./mysql.controller');

exports.bulk_save = (req, res) => {
    console.log("Enter...here")


    var duplicates = ``;
    var query = `INSERT INTO functional_area (FunctionalAreaCode,Description, ProjectId, CreatedBy) VALUES `;
    var duplicatesCount = ``;
    var duplicateQuery = ``;

    req.body.Items.forEach(e => {
        duplicatesCount += "'" + e.FunctionalAreaCode + "',";
        query += `('${e.FunctionalAreaCode.replace(/'/g, '\\\'')}','${e.Description.replace(/'/g, '\\\'')}','${req.body.ProjectId}','${req.body.EmployeeId}'),`;


    });

    duplicatesCount = duplicatesCount.substr(0, duplicatesCount.length - 1);
    console.log(duplicatesCount)

    duplicateQuery = `SELECT FunctionalAreaCode FROM functional_area where FunctionalAreaCode  IN (${duplicatesCount}) and ProjectId='${req.body.ProjectId}' `;

    console.log(duplicateQuery)

    connection.query(duplicateQuery, function (obj) {
        if (obj.response.length) {
            obj.response.forEach(e => {
                duplicates += e.FunctionalAreaCode + ",";
            })
        } else {
            query = query.substr(0, query.length - 1);
            console.log(query);
            connection.query(query, function (obj) {

                return res.status(200).send({
                    success: obj.error == null,
                    message: `Functional Area Created Successfully`,
                    data: obj.response
                });


            });
        }
        if (duplicates) {
            duplicates = duplicates.substr(0, duplicates.length - 1);
            return res.status(400).send({
                success: false,
                message: `The codes '${duplicates}' have already been assigned to other Functional Areas in this project.`,
                data: null
            });


        }

    });

}


exports.functional_list = (req, res) => {

    let listQuery = `SELECT FA.*,p.ProjectCode FROM functional_area FA INNER JOIN project p On FA.ProjectId=p.ProjectId
    where FA.ProjectId='${req.params.ProjectId}' AND FA.Deleted='N'`;

    connection.query(listQuery, function (obj) {
        res.status(200).send({
            success: true,
            message: null,
            data: obj.response
        });

    });
}
exports.functionalArea_edit = (req, res) => {

    let duplicateQuery = `SELECT FunctionalAreaCode FROM functional_area where FunctionalAreaCode='${req.body.FunctionalAreaCode.replace(/'/g, '\\\'')}'
    and ProjectId='${req.body.ProjectId}' ${req.body.FunctionalAreaId ? " and FunctionalAreaId <> " + req.body.FunctionalAreaId : ""}`;

    console.log(duplicateQuery);
    connection.query(duplicateQuery, function (obj) {
        if (obj.response.length) {

            return res.status(400).send({
                success: false,
                message: `The code '${req.body.FunctionalAreaCode}' has already been assigned to another Functional Area in this project.`,
                data: null
            });
        } else {

            editQuery = `Update functional_area set Description='${req.body.Description}',
               FunctionalAreaCode='${req.body.FunctionalAreaCode}'
               where ProjectId='${req.body.ProjectId}' and FunctionalAreaId='${req.body.FunctionalAreaId}'`;

            connection.query(editQuery, function (obj) {
                res.send({
                    success: obj.error == null,
                    message: obj.error || `Success`,
                    data: obj.response
                });
            });
        }
    });

}

exports.functional_list_byWorkItemProjectId = (req, res) => {

    let listQuery = `SELECT FA.* FROM functional_area FA Where FA.ProjectId='${req.params.ProjectId}' or FA.FunctionalAreaId = 1`;

    console.log(listQuery);

    connection.query(listQuery, function (obj) {
        res.status(200).send({
            success: true,
            message: null,
            data: obj.response
        });

    });
}