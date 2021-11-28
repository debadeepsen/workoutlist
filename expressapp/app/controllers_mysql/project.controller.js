const connection = require('./mysql.controller');


// Creating a project
exports.crup = (req, res) => {

    console.log(req.body);
    // Validate request

    if (!req.body.ProjectName) {
        return res.status(400).send({
            success: false,
            message: "Project name cannot be empty",
            data: null
        });
    }

    if (!req.body.ProjectCode) {
        return res.status(400).send({
            success: false,
            message: "Project code cannot be empty",
            data: null
        });
    }

    if (!req.body.ProjectTypeId) {
        return res.status(400).send({
            success: false,
            message: "Project  type cannot be empty",
            data: null
        });
    }

    if (!req.body.ProjectManagerId) {
        return res.status(400).send({
            success: false,
            message: "Project  manager cannot be empty",
            data: null
        });
    }

    if (!req.body.ProjectMethodologyId) {
        return res.status(400).send({
            success: false,
            message: "Project Methodology cannot be empty",
            data: null
        });
    }

    if (!req.body.DefaultProjectCycleTypeId) {
        return res.status(400).send({
            success: false,
            message: "Project Cycle Type cannot be empty",
            data: null
        });
    }

    if (!req.body.OrganizationId) {
        return res.status(400).send({
            success: false,
            message: "Organization Id cannot be empty",
            data: null
        });
    }

    let ProjectDescription = req.body.ProjectDescription ? req.body.ProjectDescription : "";

    let duplicateQuery = `SELECT ProjectCode
                            FROM project  
                            where ProjectCode = '${req.body.ProjectCode}' and OrganizationId = '${req.body.OrganizationId}'
                            ${req.body.ProjectId ? " and ProjectId <> " + req.body.ProjectId : ""}`;

    console.log(duplicateQuery);

    connection.query(duplicateQuery, function (obj) {
        if (obj.response.length) {

            res.status(400).send({
                success: false,
                message: `The Project Code "${req.body.ProjectCode}" has already been assigned to another project in your organization.`,
                data: null
            });
        } else {
            let crupQuery = req.body.ProjectId ?
                `UPDATE project set 
                                    ProjectName = '${req.body.ProjectName.replace(/'/g, "\\'")}', 
                                    ProjectCode = '${req.body.ProjectCode.replace(/'/g, "\\'")}', 
                                    ProjectTypeId = '${req.body.ProjectTypeId}', 
                                    ProjectDescription = '${ProjectDescription.replace(/'/g, "\\'")}', 
                                    ManagerId = ${req.body.ManagerId ? req.body.ManagerId : 'NULL'},
                                    ProjectMethodologyId = ${req.body.ProjectMethodologyId ? req.body.ProjectMethodologyId : 'NULL'},
                                    DefaultAssigneeId = ${req.body.DefaultAssigneeId ? req.body.DefaultAssigneeId : 'NULL'},
                                    DefaultProjectCycleTypeId = ${req.body.DefaultProjectCycleTypeId ? req.body.DefaultProjectCycleTypeId : 'NULL'},
                                    DefaultProjectDuration = ${req.body.DefaultProjectDuration ? req.body.DefaultProjectDuration : 'NULL'}
                                    where ProjectId = ${req.body.ProjectId}` :
                `INSERT INTO project (ProjectName, ProjectCode, ProjectTypeId, ProjectDescription, ManagerId,ProjectMethodologyId,DefaultAssigneeId, DefaultProjectCycleTypeId, DefaultProjectDuration , OrganizationId)
                                    VALUES('${req.body.ProjectName.replace(/'/g, "\\'")}', 
                                    '${req.body.ProjectCode.replace(/'/g, "\\'")}', 
                                    '${req.body.ProjectTypeId}',
                                    '${ProjectDescription.replace(/'/g, "\\'")}',
                                    ${req.body.ManagerId ? req.body.ManagerId : 'NULL'},
                                    ${req.body.ProjectMethodologyId ? req.body.ProjectMethodologyId : 'NULL'},
                                    ${req.body.DefaultAssigneeId ? req.body.DefaultAssigneeId : 'NULL'},
                                    ${req.body.DefaultProjectCycleTypeId ? req.body.DefaultProjectCycleTypeId : 'NULL'},
                                    ${req.body.DefaultProjectDuration ? req.body.DefaultProjectDuration : 'NULL'},
                                    '${req.body.OrganizationId}')`;

            connection.query(crupQuery, function (obj) {
                if (obj.error != null) {
                    res.status(400).send({
                        success: false,
                        message: obj.message || `ERROR`,
                        data: null
                    });
                    return;
                }
                let NewProjectId = obj.response.insertId;
                let query = ``;
                if (req.body.ProjectId) {
                    query = `Update project_employee_map set
                           EmployeeId='${req.body.ProjectManagerId}'
                           WHERE ProjectId='${req.body.ProjectId}' AND ProjectRoleId='1'`;
                } else {
                    query = `INSERT INTO project_employee_map (ProjectId,EmployeeId,ProjectRoleId)
                          VALUES('${NewProjectId}','${req.body.ProjectManagerId}','1')`;
                }
                connection.query(query, function (obj) {

                    res.send({
                        success: obj.error == null,
                        message: obj.error || `Success`,
                        data: obj.response
                    });
                });
            });

        }

    });


}

exports.list = (req, res) => {

    if (!req.query.OrganizationId) {
        return res.status(400).send({
            success: false,
            message: "OrganizationId is required",
            data: null
        })
    }


    var query = (req.params.projectId) ? `SELECT DISTINCT  p.* from project  p
                                          JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                                          WHERE  Closed <> 'Y' 
                                          AND p.OrganizationId = ${req.query.OrganizationId} AND p.ProjectId = '${req.params.projectId}'` :
        `SELECT  DISTINCT  p.* FROM project p 
                                          JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                                          WHERE p.Closed <> 'Y'  AND  p.OrganizationId = ${req.query.OrganizationId}`;


    query += ` ORDER BY ProjectCode DESC`;

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: sortAlphabeticalOrder(obj.response)
        });
    });
}

exports.assignedList = (req, res) => {

    var queryIs = `SELECT Count(SystemRoleId) AS C FROM employee_system_role_map WHERE EmployeeId = '${req.params.assigneeId}' AND SystemRoleId = 1`;
    connection.query(queryIs, function (obj) {
        let adminRoleIdCount = obj.response[0].C;
        let query = ``;
        if (adminRoleIdCount == 1) {
            query = `SELECT * FROM project p WHERE p.Closed <> 'Y' ORDER BY p.ProjectCode`;
        } else {
            query = `SELECT p.* FROM project p 
                JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                WHERE p.Closed <> 'Y' AND pem.EmployeeId = ${req.params.assigneeId} ORDER BY p.ProjectCode`;
        }

        console.log({ query });

        connection.query(query, function (obj) {
            res.send({
                success: true,
                message: `Success`,
                data: obj.response
            });
        });
    });
}

exports.mainProjectList = (req, res) => {

    console.log('mainProjectList');

    var queryIs = `SELECT Count(SystemRoleId) AS C FROM employee_system_role_map WHERE EmployeeId = '${req.params.assigneeId}' AND SystemRoleId = 1`;
    connection.query(queryIs, function (obj) {
        let adminRoleIdCount = obj.response[0].C;
        let query = ``;
        if (adminRoleIdCount == 1) {
            query = `SELECT p.*, IFNULL(pem.ProjectHidden, 'N') AS ProjectHidden FROM project p
                        LEFT JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                        AND pem.EmployeeId = ${req.params.assigneeId} ORDER BY p.ProjectCode`;
        } else {
            query = `SELECT p.*, IFNULL(pem.ProjectHidden, 'N') AS ProjectHidden FROM project p 
                JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                WHERE p.Closed <> 'Y' AND pem.EmployeeId = ${req.params.assigneeId} ORDER BY p.ProjectCode`;
        }

        console.log({ query });

        connection.query(query, function (obj) {

            // console.log(obj.response);

            res.send({
                success: true,
                message: `Success`,
                data: obj.response
            });
        });
    });
}

function sortAlphabeticalOrder(project) {
    var sorted = project.sort(function (a, b) {
        var textA = a.ProjectCode;
        var textB = b.ProjectCode;
        return textA < textB ? -1 : textA > textB ? 1 : 0;
    });
    return sorted;
}

function sortNameAlphabeticalOrder(project) {
    var sorted = project.sort(function (a, b) {
        var textA = a.FullName;
        var textB = b.FullName;
        return textA < textB ? -1 : textA > textB ? 1 : 0;
    });
    return sorted;
}

exports.byManagerId = (req, res) => {

    var query = `SELECT p.* FROM project p 
                JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                WHERE p.Closed <> 'Y' AND pem.EmployeeId = '${req.params.managerId}'
                AND pem.ProjectRoleId IN (1, 3, 5)
                group by p.ProjectName, p.ProjectId`;

    // var query = `SELECT p.* FROM project p WHERE p.ManagerId = '${req.params.managerId}'`;

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: sortAlphabeticalOrder(obj.response)
        });
    });

}

exports.byQA_TesterId = (req, res) => {

    var query = `SELECT p.* FROM project p 
                JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                WHERE p.Closed <> 'Y' AND pem.EmployeeId = '${req.params.testerId}'
                AND pem.ProjectRoleId In (3,5) ORDER BY p.ProjectCode`;

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });

}
exports.listByCode = (req, res) => {
    var query = (req.params.projectCode) ?
        `SELECT p.ProjectId, p.ProjectName, p.ProjectCode, p.ProjectDescription, p.ProjectTypeId, o.*,
        mgr.ManagerId, mgr.FullName ManagerFullName , pt.ProjectTypeName ,pm.ProjectMethodologyName,
        pct.ProjectCycleTypeId,pct.ProjectCycleTypeName
        FROM project p JOIN organization o ON p.OrganizationId = o.OrganizationId
        JOIN project_type pt ON p.ProjectTypeId = pt.ProjectTypeId
        LEFT JOIN project_methodology pm ON p.ProjectMethodologyId = pm.ProjectMethodologyId
        LEFT JOIN project_cycle_type_master pct ON p.DefaultProjectCycleTypeId = pct.ProjectCycleTypeId
        LEFT JOIN
        (SELECT pem.ProjectId, em.FullName, em.EmployeeId ManagerId FROM project_employee_map pem
            JOIN employee em ON em.EmployeeId = pem.EmployeeId
            WHERE pem.ProjectRoleId = 1) mgr
        ON mgr.ProjectId = p.ProjectId
        WHERE p.ProjectCode = '${req.params.projectCode}'` :
        `SELECT * from project where 1 = 0`; // fetch a blank row

    // console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}


exports.hide = (req, res) => {

    let { ProjectId, EmployeeId, ProjectHidden } = req.body;

    if (!ProjectId) {
        return res.status(400).send({
            success: false,
            message: "ProjectId is required",
            data: null
        });
    }

    if (!EmployeeId) {
        return res.status(400).send({
            success: false,
            message: "EmployeeId is required",
            data: null
        });
    }

    if (!ProjectHidden) {
        return res.status(400).send({
            success: false,
            message: "ProjectHidden is required",
            data: null
        });
    }

    let checkQuery = `SELECT ProjectId FROM project_employee_map WHERE 
                        ProjectId = ${ProjectId} AND EmployeeId = ${EmployeeId}`;


    console.log("CHECKQUERY");
    console.log(checkQuery);

    connection.query(checkQuery, function (objCheck) {
        let query = ``;

        if (objCheck.response && objCheck.response.length) {
            query = `UPDATE project_employee_map SET 
                        ProjectHidden = '${ProjectHidden}', LastUpdatedBy = ${EmployeeId}
                        WHERE ProjectId = ${ProjectId} AND EmployeeId = ${EmployeeId}`;
        }
        else {
            query = `INSERT INTO project_employee_map (EmployeeId, ProjectId, ProjectHidden, CreatedBy)
                        VALUES (${EmployeeId}, ${ProjectId}, '${ProjectHidden}', ${EmployeeId})`;
        }

        console.log("HIDEQUERY");
        console.log(query);

        connection.query(query, function (obj) {
            res.send({
                success: obj.error == null,
                message: obj.error || `Success`,
                data: obj.response
            });
        });

    })


}

exports.unHide = (req, res) => {

    let { EmployeeId, ProjectHidden, projectsToUnHide } = req.body;

    if (!EmployeeId) {
        return res.status(400).send({
            success: false,
            message: "EmployeeId is required",
            data: null
        });
    }

    if (!ProjectHidden) {
        return res.status(400).send({
            success: false,
            message: "ProjectHidden is required",
            data: null
        });
    }

    let unHideProjectIds = ``;
    projectsToUnHide.forEach(e => {
        unHideProjectIds += `${e},`
    });
    unHideProjectIds = unHideProjectIds.substr(0, unHideProjectIds.length - 1) + ``

    let query = `UPDATE project_employee_map SET 
                        ProjectHidden = '${ProjectHidden}', LastUpdatedBy = ${EmployeeId}
                        WHERE ProjectId IN (${unHideProjectIds})`;

    console.log("UNHIDE QUERY");
    console.log(query);

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}


exports.projectEmployeeMap = (req, res) => {

    if (!req.query.OrganizationId) {
        return res.status(400).send({
            success: false,
            message: "OrganizationId is required",
            data: null
        });
    }

    let andClause = ``;
    if (req.query.EmployeeId) {
        andClause = ` AND pem.EmployeeId = ${req.query.EmployeeId}`;
    }

    var query = `SELECT A.ProjectId, A.ProjectCode, A.ProjectName, A.EmployeeDetails, B.ManagerId FROM 
                    (
                    SELECT
                        p.ProjectId, 
                        p.ProjectCode,
                        p.ProjectName,
                        
                        GROUP_CONCAT(
                            CONCAT_WS('---', 
                                pem.EmployeeId, 
                                e.FullName, 
                                e.EmployeeCode, 
                                pr.ProjectRoleId,
                                pr.ProjectRoleName,
                                (IF(pr.ProjectRoleId = 1, 'Y', 'N'))
                            )
                        SEPARATOR '|||')
                        EmployeeDetails
                        
                        FROM project_employee_map pem
                        
                        JOIN project p ON pem.ProjectId = p.ProjectId
                        JOIN employee e ON pem.EmployeeId = e.EmployeeId
                        JOIN project_role pr ON pem.ProjectRoleId = pr.ProjectRoleId
                        
                        WHERE
                        e.OrganizationId = ${req.query.OrganizationId}
                        
                        GROUP BY pem.ProjectId, p.ProjectCode, p.ProjectName) A
                        
                        JOIN 
                        
                        (SELECT ProjectId, ProjectRoleId, EmployeeId AS ManagerId FROM project_employee_map pem2) B
                        
                        ON A.ProjectId = B.ProjectId AND B.ProjectRoleId = 1`;

    console.log(query);

    connection.query(query, function (obj) {

        var response = [];

        obj.response.forEach(e => {

            var proj = {};
            proj.ProjectId = e.ProjectId;
            proj.ProjectCode = e.ProjectCode;
            proj.ProjectName = e.ProjectName;
            proj.ManagerId = e.ManagerId;
            proj.Details = [];

            // console.log(proj);


            var employees = e.EmployeeDetails.split('|||');
            // console.log(employees);

            employees.forEach(emp => {
                let details = emp.split('---');

                let detailsObj = {
                    EmployeeId: details[0],
                    EmployeeName: details[1],
                    EmployeeCode: details[2],
                    ProjectRoleId: details[3],
                    ProjectRoleName: details[4],
                    IsManager: details[5]
                };

                proj.Details.push(detailsObj);
            });

            response.push(proj);
        })

        //only send my projects if my employee id has been provided

        res.status(200).send({
            success: true,
            message: `Success`,
            data: response
        });
    });
}

exports.projectEmployeeMapV2 = (req, res) => {

    if (!req.query.OrganizationId) {
        return res.status(400).send({
            success: false,
            message: "OrganizationId is required",
            data: null
        });
    }

    let query = `SELECT p.ProjectId, p.ProjectCode, p.ProjectName, p.Closed ProjectClosed,
                    pem.ProjectRoleId, pem.ProjectRoleName, pem.IsManager, pem.EmployeeId, pem.FullName EmployeeName, pem.EmployeeCode
                    FROM project p 
                    JOIN 
                    
                    (SELECT e.EmployeeId, e.FullName, e.EmployeeCode, pem2.ProjectId, pr.ProjectRoleId, pr.ProjectRoleName,
                    IF(pem2.ProjectRoleId = 1, 'Y', 'N') IsManager
                    FROM
                    project_employee_map pem2 
                    JOIN employee e ON pem2.EmployeeId = e.EmployeeId
                    JOIN project_role pr ON pr.ProjectRoleId = pem2.ProjectRoleId
                    ) pem                    
                    
                    ON p.ProjectId = pem.ProjectId
                    
                    WHERE p.OrganizationId = ${req.query.OrganizationId}
                    
                    ORDER BY p.ProjectCode, pem.FullName`;


    connection.query(query, function (obj) {

        var returnObj = [];
        obj.response.forEach(e => {

            var currentProj = returnObj.find(o => o.ProjectId == e.ProjectId);
            if (!currentProj) {
                returnObj.push({
                    ProjectId: e.ProjectId,
                    ProjectCode: e.ProjectCode,
                    ProjectName: e.ProjectName,
                    ProjectClosed: e.ProjectClosed,
                    Details: [{
                        EmployeeId: e.EmployeeId,
                        EmployeeName: e.EmployeeName,
                        EmployeeCode: e.EmployeeCode,
                        ProjectRoleId: e.ProjectRoleId,
                        ProjectRoleName: e.ProjectRoleName,
                        IsManager: e.IsManager
                    }]
                })
            } else {
                currentProj.Details.push({
                    EmployeeId: e.EmployeeId,
                    EmployeeName: e.EmployeeName,
                    EmployeeCode: e.EmployeeCode,
                    ProjectRoleId: e.ProjectRoleId,
                    ProjectRoleName: e.ProjectRoleName,
                    IsManager: e.IsManager
                })
            }
        })

        if (req.query.EmployeeId) {
            returnObj = returnObj.filter(e => {
                for (let i = 0; i < e.Details.length; i++) {
                    let currentEmp = e.Details[i];
                    if (currentEmp.EmployeeId == req.query.EmployeeId)
                        return true;
                }
                return false;
            });
        }

        return res.status(200).send({
            success: true,
            message: 'Success',
            data: returnObj
        })
    })
}

exports.assignees = (req, res) => {

    if (!req.params.projectCode) {
        return res.status(400).send({
            success: false,
            message: "ProjectCode is required",
            data: null
        });
    }

    let query = `SELECT e.*, pr.ProjectRoleId, pr.ProjectRoleName FROM project p
                JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                JOIN employee e ON pem.EmployeeId = e.EmployeeId
                JOIN project_role pr ON pr.ProjectRoleId = pem.ProjectRoleId
                WHERE p.ProjectCode = '${req.params.projectCode}'`;


    connection.query(query, function (obj) {

        res.status(200).send({
            success: true,
            message: `Success`,
            data: sortNameAlphabeticalOrder(obj.response)
        });

    });

}


// Map projects to employees
exports.mapEmployees = (req, res) => {
    if (!req.body.CreatedBy) {
        return res.status(400).send({
            success: false,
            message: `CreatedBy is mandatory`,
            data: null
        });
    }

    if (!req.body.ProjectId) {
        return res.status(400).send({
            success: false,
            message: `ProjectId is mandatory`,
            data: null
        });
    }

    let query = `DELETE FROM project_employee_map WHERE ProjectId = '${req.body.ProjectId}'`;

    // query = `delete from project where ProjectId < 0`;

    connection.query(query, function (obj) {

        if (obj.error) {
            return res.status(400).send({
                success: false,
                message: `Error in query`,
                data: null
            });
        }

        let insertQuery = `INSERT INTO project_employee_map (ProjectId, EmployeeId, ProjectRoleId)
                            VALUES `;
        req.body.ProjectEmployeeMap.forEach(e => {
            insertQuery += `('${req.body.ProjectId}', '${e.EmployeeId}', '${e.ProjectRoleId}'),`;
        });

        insertQuery = insertQuery.substr(0, insertQuery.length - 1);

        connection.query(insertQuery, function (objIns) {
            res.status(200).send({
                success: objIns.error != null,
                message: objIns.error || `Success`,
                data: obj.response
            });
        });

    });

}


exports.releaseEmployee = (req, res) => {
    if (!req.body.EmployeeId) {
        return res.status(400).send({
            success: false,
            message: `Employee is required`,
            data: null
        })
    }

    if (!req.body.ProjectId) {
        return res.status(400).send({
            success: false,
            message: `Project is required`,
            data: null
        })
    }

    var deleteQuery = `DELETE FROM project_employee_map WHERE EmployeeId = ${req.body.EmployeeId} AND ProjectId = ${req.body.ProjectId}`;

    connection.query(deleteQuery, function (objDel) {

        var unassignQuery = `UPDATE task SET AssigneeId = NULL WHERE AssigneeId = ${req.body.EmployeeId} AND ProjectId = ${req.body.ProjectId}`;

        connection.query(unassignQuery, function (objUnassign) {
            return res.status(200).send({
                success: objDel.error == null && objUnassign.error == null,
                message: objDel.error || objUnassign.error || 'Success',
                data: {
                    objDel,
                    objUnassign
                }
            })
        })
    })
}

exports.releaseAll = (req, res) => {

    if (!req.body.ProjectId) {
        return res.status(400).send({
            success: false,
            message: `Project is required`,
            data: null
        })
    }

    var deleteQuery = `DELETE FROM project_employee_map WHERE ProjectRoleId <> 1 AND ProjectId = ${req.body.ProjectId}`;

    connection.query(deleteQuery, function (objDel) {
        return res.status(200).send({
            success: objDel.error == null,
            message: objDel.error || 'Success',
            data: objDel.response
        })
    })
}

exports.assignRole = (req, res) => {

    if (!req.body.EmployeeId) {
        return res.status(400).send({
            success: false,
            message: `Employee is required`,
            data: null
        })
    }

    if (!req.body.ProjectId) {
        return res.status(400).send({
            success: false,
            message: `Project is required`,
            data: null
        })
    }

    if (!req.body.ProjectRoleId) {
        return res.status(400).send({
            success: false,
            message: `Project Role is required`,
            data: null
        })
    }

    var query = `UPDATE project_employee_map SET ProjectRoleId = ${req.body.ProjectRoleId}
                WHERE EmployeeId = ${req.body.EmployeeId} AND ProjectId = ${req.body.ProjectId}`;

    connection.query(query, function (obj) {

        res.status(200).send({
            success: obj.error == null,
            message: obj.error || 'Success',
            data: obj.response
        })
    })

}

exports.project_teammates = (req, res) => {

    if (!req.params.managerId) {
        return res.status(400).send({
            success: false,
            message: `managerId is required`,
            data: null
        })
    }

    var query = `SELECT pem.EmployeeId, e.EmployeeCode, e.FullName, ep.ProfilePic FROM 
                (SELECT pem.ProjectId FROM project_employee_map pem WHERE pem.EmployeeId = ${req.params.managerId} AND pem.ProjectRoleId = 1) project_ids
                JOIN project_employee_map pem ON project_ids.ProjectId = pem.ProjectId AND pem.EmployeeId <> ${req.params.managerId}
                JOIN employee e ON pem.EmployeeId = e.EmployeeId
                LEFT JOIN employee_profile ep ON e.EmployeeId = ep.EmployeeId
                GROUP BY 1,2,3,4 `;

    connection.query(query, function (obj) {

        res.status(200).send({
            success: obj.error == null,
            message: obj.error || 'Success',
            data: obj.response
        })
    })
}


exports.byProjectManagerId = (req, res) => {

    var query = `SELECT p.* FROM project p 
                JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                WHERE pem.EmployeeId = '${req.params.managerId}'
                AND pem.ProjectRoleId = 1 AND pem.ProjectHidden = 'N' AND p.Closed = 'N'
                group by p.ProjectName, p.ProjectId`;

    // var query = `SELECT p.* FROM project p WHERE p.ManagerId = '${req.params.managerId}'`;

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: sortAlphabeticalOrder(obj.response)
        });
    });

}
// Work logs  Project Manager Id
// exports.worklogs_byManagerId = (req, res) => {

// this Api fetch only QA and QTL data best on parameter
exports.byQA_And_QTL = (req, res) => {

    var query = `SELECT p.*, pem.ProjectRoleId FROM project p 
                JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                WHERE pem.EmployeeId = '${req.query.EmployeeId}'
                AND p.ProjectId='${req.query.ProjectId}'
                AND pem.ProjectRoleId IN (3,5)
                group by p.ProjectName, p.ProjectId, pem.ProjectRoleId`;

    // var query = `SELECT p.* FROM project p WHERE p.ManagerId = '${req.params.managerId}'`;
    console.log(query)
    connection.query(query, function (obj) {
        console.log(obj);
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });

}


// this function gets the projects
// for which the user has work item
// creation rights
exports.projectsWithCreationRights = (req, res) => {
    console.log('projectsWithCreationRights');
    let sysRoleQuery = `SELECT GROUP_CONCAT(SystemRoleId) Ids FROM employee_system_role_map WHERE EmployeeId = ${req.params.EmployeeId}`;

    connection.query(sysRoleQuery, function (objSR) {
        // console.log( objSR.response[0].Ids);
        let systemRoleIds = objSR.response[0].Ids.split(",");


        let query = ``;

        // is this person a sysadmin?
        // if (systemRoleIds.includes("1") || systemRoleIds.includes("13")) {
        //     query = `SELECT * FROM project p 
        //             WHERE p.Closed <> 'Y'
        //             AND p.OrganizationId = ${req.params.OrganizationId}
        //             ORDER BY p.ProjectCode`;
        // }

        // is this person a development team lead 
        if (systemRoleIds.includes("3")) {
            query = `SELECT p.*,pem.ProjectRoleId FROM project p JOIN project_employee_map pem
                        ON p.ProjectId = pem.ProjectId
                        AND pem.EmployeeId = ${req.params.EmployeeId}
                        AND pem.ProjectRoleId IN (2,9)
                        WHERE p.Closed <> 'Y' AND pem.ProjectHidden <> 'Y'
                        ORDER BY p.ProjectCode`;
        }
        // is this person a manager in some projects?
        // is this person a QA/QTL in some projects?
        else {
            query = `SELECT p.*,pem.ProjectRoleId FROM project p JOIN project_employee_map pem
                        ON p.ProjectId = pem.ProjectId
                        AND pem.EmployeeId = ${req.params.EmployeeId}
                        AND pem.ProjectRoleId IN (1,3,5,9,2)
                        WHERE p.Closed <> 'Y' AND pem.ProjectHidden <> 'Y'
                        ORDER BY p.ProjectCode`;
        }


        connection.query(query, function (obj) {
            return res.status(200).send({
                success: obj.error != null,
                message: obj.error || 'Success',
                data: obj.response
            })
        })

    })
}

exports.type_list = (req, res) => {


    let query = `SELECT pt.* FROM project_type pt WHERE pt.Deleted='N'`;


    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });

}

exports.methodology_list = (req, res) => {

    console.log(req.query.ProjectTypeId);

    let query = `SELECT pm.* FROM  projecttype_defaultmethodology_map ptm_map
                JOIN  project_methodology pm ON  ptm_map.ProjectMethodologyId=pm.ProjectMethodologyId
                Where ptm_map.ProjectTypeId=${req.query.ProjectTypeId}`;

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });

}

exports.projectDetails_By_ProjectId = (req, res) => {


    let query = `SELECT  p.*,pem.EmployeeId as ProjectManagerId FROM project p
                INNER JOIN  project_employee_map pem ON p.ProjectId=pem.ProjectId
                WHERE p.ProjectId = '${req.params.ProjectId}' AND pem.ProjectRoleId='1'`;

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });

}


exports.allProjects = (req, res) => {

    if (!req.query.OrganizationId) {
        return res.status(400).send({
            success: false,
            message: `OrganizationId is required`,
            data: null
        })
    }


    let query =
        `SELECT 
                    p.ProjectId, p.ProjectCode, p.ProjectName,
                    COUNT(pem.EmployeeId) ResourceCount,
                    GROUP_CONCAT(e.FullName SEPARATOR '____') ResourceList
                    FROM project p 
                    LEFT JOIN project_employee_map pem
                        ON p.ProjectId = pem.ProjectId AND pem.ProjectRoleId <> 1
                    LEFT JOIN employee e 
                        ON e.EmployeeId = pem.EmployeeId
                    WHERE p.Closed <> 'Y'
                    AND p.OrganizationId = '${req.query.OrganizationId}'
                    GROUP BY p.ProjectId, p.ProjectCode, p.ProjectName
                    ORDER BY ResourceCount;
                    
                SELECT p.ProjectId, p.ProjectCode, p.ProjectName
                    FROM project p 
                    WHERE p.Closed = 'Y'
                    AND p.OrganizationId = '${req.query.OrganizationId}';
                `;

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: {
                activeProjects: obj.response[0],
                inactiveProjects: obj.response[1]
            }
        });
    });
}



exports.close = (req, res) => {

    if (!req.body.ProjectId) {
        return res.status(400).send({
            success: false,
            message: "ProjectId is required",
            data: null
        });
    }

    if (!req.body.ClosedBy) {
        return res.status(400).send({
            success: false,
            message: "ClosedBy is required",
            data: null
        });
    }

    var query = `UPDATE project SET Closed = 'Y', ClosedBy = '${req.body.ClosedBy}' where ProjectId = '${req.body.ProjectId}'`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}



exports.reopen = (req, res) => {

    if (!req.body.ProjectId) {
        return res.status(400).send({
            success: false,
            message: "ProjectId is required",
            data: null
        });
    }

    var query = `UPDATE project SET Closed = 'N' where ProjectId = '${req.body.ProjectId}'`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}


exports.get_Hidden_And_Closed_Project_List = (req, res) => {

    let query = `SELECT  pem.ProjectId,pem.ProjectHidden   FROM project_employee_map pem WHERE pem.ProjectHidden ='Y' AND pem.EmployeeId='${req.params.loggedInEmployee}'
                UNION
                SELECT  p.ProjectId,p.Closed FROM project p WHERE p.Closed ='Y'`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

exports.assigned_And_Supervisors_List = (req, res) => {

    var queryIs = `SELECT Count(SystemRoleId) AS C FROM employee_system_role_map WHERE EmployeeId = '${req.params.assigneeId}' AND SystemRoleId = 1`;
    connection.query(queryIs, function (obj) {
        let adminRoleIdCount = obj.response[0].C;
        let query = ``;

        let quertList = `SELECT  esm.SuperviseeId FROM employee_supervisor_map esm
        WHERE esm.SupervisorId=${req.params.assigneeId}`;

        let masterString = ``;
        connection.query(quertList, function (obj) {

            if (obj.response.length != 0) {
                masterString = req.params.assigneeId
                obj.response.forEach((element) => {
                    masterString += ',' + element.SuperviseeId
                })
                console.log('Full supervisor id list: ' + masterString)

            } else {
                masterString = req.params.assigneeId
            }
            console.log("Enter location")


            if (adminRoleIdCount == 1) {

                query = `SELECT * FROM project p WHERE p.Closed <> 'Y' ORDER BY p.ProjectCode`;
            } else {

                query = `SELECT DISTINCT p.* FROM project p 
            JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
            WHERE p.Closed <> 'Y' AND pem.EmployeeId IN (${masterString}) ORDER BY p.ProjectCode`;

            }

            console.log({ query });

            connection.query(query, function (obj) {
                res.send({
                    success: true,
                    message: `Success`,
                    data: obj.response
                });
            });
        });
    });
}

exports.project_assigned_by_employeeId = (req, res) => {

    let query = `SELECT p.* FROM project p 
                 JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                 WHERE pem.EmployeeId= ${req.params.assigneeId} AND p.Closed <>'Y' and  pem.ProjectHidden <>'Y'`;

    console.log({ query });

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}


exports.byProjectManagerId_or_AnalystId = (req, res) => {

    var query = `SELECT p.* FROM project p 
                JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                WHERE pem.EmployeeId = '${req.params.managerId}'
                AND (pem.ProjectRoleId = 1  OR pem.ProjectRoleId = 9) AND pem.ProjectHidden = 'N' AND p.Closed = 'N'
                group by p.ProjectName, p.ProjectId`;

    // var query = `SELECT p.* FROM project p WHERE p.ManagerId = '${req.params.managerId}'`;

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: sortAlphabeticalOrder(obj.response)
        });
    });

}

exports.project_by_creationaccess_employeeId = (req, res) => {

    let query = ` SELECT p.*,pem.ProjectRoleId FROM project p
                  JOIN project_employee_map pem ON p.ProjectId  = pem.ProjectId
                  AND pem.EmployeeId = ${req.params.assigneeId}
                  AND pem.ProjectRoleId IN (1,2,3,5,9)
                  WHERE p.Closed <>'Y' and  pem.ProjectHidden <>'Y'
                  UNION
                  SELECT p.*,pem.ProjectRoleId FROM project p
                  JOIN project_employee_map pem ON p.ProjectId  = pem.ProjectId
                  JOIN employee_system_role_map esrm ON pem.EmployeeId = esrm.EmployeeId
                  AND pem.EmployeeId = ${req.params.assigneeId}
                  WHERE esrm.SystemRoleId='1' OR esrm.SystemRoleId='13' AND  p.Closed <>'Y' and  pem.ProjectHidden <>'Y';`


    console.log({ query });

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}

// Logged IN User Projects Roles List 
exports.loggedInUser_projects_roles = (req, res) => {

    let query = `SELECT p.*,pem.ProjectRoleId,pem.EmployeeId
    FROM  project p 
    JOIN  project_employee_map pem ON p.ProjectId = pem.ProjectId
    AND pem.EmployeeId = ${req.params.assigneeId}
    AND pem.ProjectRoleId IN (1,9)
    WHERE p.Closed <>'Y' and  pem.ProjectHidden <>'Y'`;

    console.log({ query });

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });

}

// Assigend and  Supervisors List
exports.Project_Assigned_And_Supervisors_List = (req, res) => {

    var queryIs = `SELECT Count(SystemRoleId) AS C FROM employee_system_role_map WHERE EmployeeId = '${req.params.assigneeId}' AND SystemRoleId = 1`;
    connection.query(queryIs, function (obj) {
        let adminRoleIdCount = obj.response[0].C;
        let query = ``;

        let quertList = `SELECT  esm.SuperviseeId FROM employee_supervisor_map esm
        WHERE esm.SupervisorId=${req.params.assigneeId}`;

        let masterString = ``;
        connection.query(quertList, function (obj) {

            if (obj.response.length != 0) {
                // masterString = req.params.assigneeId
                obj.response.forEach((element) => {

                    if (masterString) {
                        masterString += ',' + element.SuperviseeId
                    } else {
                        masterString = element.SuperviseeId
                    }
                })
                console.log('Full supervisor id list: ' + masterString)

            } else {
                masterString = req.params.assigneeId
            }
            console.log("Enter location")

            // query = `SELECT DISTINCT p.*,IFNULL(pem.ProjectHidden, 'N') AS ProjectHidden FROM project p 
            //          JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
            //          WHERE  pem.ProjectHidden != 'Y' AND pem.EmployeeId IN (${masterString})
            //          UNION
            //          SELECT p.*, IFNULL(pem.ProjectHidden, 'N') AS ProjectHidden FROM project p 
            //          JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
            //          WHERE p.Closed <> 'Y' AND pem.EmployeeId = ${req.params.assigneeId}  `;

            query = `SELECT p.*, IFNULL(pem.ProjectHidden, 'N') AS ProjectHidden FROM project p
                     LEFT JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                     AND pem.EmployeeId = ${req.params.assigneeId} ORDER BY p.ProjectCode`


            console.log({ query });

            connection.query(query, function (obj) {
                res.send({
                    success: true,
                    message: `Success`,
                    data: obj.response
                });
            });
        });
    });
}
