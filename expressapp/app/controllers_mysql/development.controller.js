const connection = require('./mysql.controller');
const mail = require('./mail.controller');
var moment = require('moment');


// Creating an iteration
exports.iteration_crup = (req, res) => {
    console.log('crupQuery');

    // Validate request
    if (!req.body.ProjectId) {
        return res.status(400).send({
            success: false,
            message: "Please select a project",
            data: null
        });
    }

    if (!req.body.IterationNumber) {
        return res.status(400).send({
            success: false,
            message: "Iteration Number cannot be empty",
            data: null
        });
    }

    let duplicateQuery = `SELECT IterationNumber FROM development_iteration WHERE 
    ProjectId ='${req.body.ProjectId}' and IterationNumber = '${req.body.IterationNumber}'${req.body.IterationId ? " and IterationId <> " + req.body.IterationId : ""} `;

    console.log(duplicateQuery);

    connection.query(duplicateQuery, function (obj) {
        if (obj.response.length)
            return res.status(400).send({
                success: false,
                message: `This Development Cycle Number "${req.body.IterationNumber}" has already been assigned  in your organization.`,
                data: null
            });
    });

    let crupQuery = req.body.IterationId ?
        `UPDATE development_iteration set 
                                    IterationNumber = '${req.body.IterationNumber.replace(/'/g, '\\\'')}', 
                                    IterationType = '${req.body.IterationType.replace(/'/g, '\\\'')}',
                                    LastUpdatedBy = '${req.body.LastUpdatedBy}'
                                    where IterationId = ${req.body.IterationId}` :
        `INSERT INTO development_iteration (ProjectId,IterationNumber, IterationType,CreatedBy)
                                    VALUES('${req.body.ProjectId}',
                                    '${req.body.IterationNumber.replace(/'/g, '\\\'')}', 
                                    '${req.body.IterationType.replace(/'/g, '\\\'')}',
                                    '${req.body.CreatedBy}')`;

    console.log(crupQuery);

    connection.query(crupQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

// iteration List
exports.iteration_list = (req, res) => {

    let listQuery = `SELECT * FROM development_iteration where ProjectId =${req.params.ProjectId}`;

    console.log(listQuery);

    connection.query(listQuery, function (obj) {

        // if (obj.response.length)
        res.status(200).send({
            success: true,
            message: null,
            data: obj.response
        });
        // else
        //     res.status(400).send({ success: false, message: ``, data: null });
    });
}

// Get all task types
exports.task_types = (req, res) => {
    let query = `SELECT * FROM task_type where Deleted='N'`;

    connection.query(query, function (obj) {

        if (obj.response.length)
            res.status(200).send({
                success: true,
                message: null,
                data: obj.response
            });
        else
            res.status(400).send({
                success: false,
                message: `Bad request`,
                data: null
            });
    });
}

// Get all task priorities
exports.task_priorities = (req, res) => {
    let query = `SELECT * FROM task_priority`;

    connection.query(query, function (obj) {

        if (obj.response.length)
            res.status(200).send({
                success: true,
                message: null,
                data: obj.response
            });
        else
            res.status(400).send({
                success: false,
                message: `Bad request`,
                data: null
            });
    });
}

// Get all task statuses
exports.task_statuses = (req, res) => {
    let query = `SELECT ws.* FROM workitem_status ws`;

    // if (req.query.TaskTypeId) {
    //     var typeId = req.query.TaskTypeId == 2 ? 2 : 1;
    //     query = `SELECT * FROM task_status WHERE TaskTypeId = ${typeId}`;
    // }

    console.log(query);

    connection.query(query, function (obj) {

        if (obj.response.length)
            res.status(200).send({
                success: true,
                message: null,
                data: obj.response
            });
        else
            res.status(400).send({
                success: false,
                message: `Bad request`,
                data: null
            });
    });

}

// Creating a task
exports.task_crup = (req, res) => {

    console.log(req.body);

    // Validate request
    if (!req.body.TaskName) {
        return res.status(400).send({
            success: false,
            message: "Title cannot be empty",
            data: null
        });
    }

    if (!req.body.TaskTypeId) {
        return res.status(400).send({
            success: false,
            message: "Item Type cannot be empty",
            data: null
        });
    }

    if (!req.body.ProjectId) {
        return res.status(400).send({
            success: false,
            message: "Project Type cannot be empty",
            data: null
        });
    }

    // var assigneeId = req.body.AssigneeId;// ? req.body.AssigneeId : null;
    if (!req.body.TaskPriorityId) {
        return res.status(400).send({
            success: false,
            message: " Priority cannot be empty",
            data: null
        });
    }

    let duplicateQuery = `SELECT TaskName
                            FROM task  
                             where TaskName = '${req.body.TaskName.replace(/'/g, '\\\'')}' and ProjectId = '${req.body.ProjectId}'
                            ${req.body.TaskId ? " and TaskId <> " + req.body.TaskId : ""}`;

    console.log(duplicateQuery);
    connection.query(duplicateQuery, function (obj) {
        if (obj.response.length) {

            res.status(400).send({
                success: false,
                message: `The Work Item Name  "${req.body.TaskName}" has already been assigned to another Work Item in your organization.`,
                data: null
            });
        } else {


            let query = `SELECT IFNULL(MAX(WorkItemKey), 0) AS MaxKey FROM task WHERE ProjectId =${req.body.ProjectId}`;
            console.log(query)
            connection.query(query, function (obj) {
                var Max = obj.response[0].MaxKey;

                let crupQuery = req.body.TaskId ?
                    `UPDATE task set 
                                    TaskName = '${req.body.TaskName.replace(/'/g, "\\'")}',
                                    ${ req.body.TaskDescription ? "TaskDescription = '" + req.body.TaskDescription.replace(/'/g, "\\'") + "'," : ""} 
                                    ProjectId = '${req.body.ProjectId}', 
                                    ${ req.body.AssigneeId ? "AssigneeId = '" + req.body.AssigneeId + "'," : ""}
                                    ${ req.body.ReviewerId ? "ReviewerId = '" + req.body.ReviewerId + "'," : ""}
                                    ${ req.body.ParentTaskId ? "ParentTaskId = '" + req.body.ParentTaskId + "'," : ""}
                                    ${ req.body.TaskStatusId ? "TaskStatusId = '" + req.body.TaskStatusId + "'," : ""} 
                                    ${ req.body.FunctionalAreaId ? "FunctionalAreaId = '" + req.body.FunctionalAreaId + "'," : ""}
                                    ${ req.body.WorkitemStatusId ? "WorkitemStatusId = '" + req.body.WorkitemStatusId + "'," : ""}
                                    ${ req.body.EstimatedEffort ? "EstimatedEffort = '" + req.body.EstimatedEffort + "'," : ""}
                                    TaskTypeId = '${req.body.TaskTypeId}', 
                                    TaskPriorityId = '${req.body.TaskPriorityId}'
                                    ${ req.body.TaskStartDate ? ",TaskStartDate = '" + req.body.TaskStartDate + "'" : ""}
                                    ${ req.body.Deadline ? ",Deadline = '" + req.body.Deadline + "'" : ""}
                                    where TaskId = ${req.body.TaskId}` :
                    `INSERT INTO task (TaskName,  ${req.body.TaskDescription ? "TaskDescription," : ""}  ProjectId, 
                                    ${req.body.AssigneeId ? "AssigneeId," : ""} 
                                    ${req.body.ReviewerId ? "ReviewerId," : ""}
                                    ${req.body.ParentTaskId ? "ParentTaskId," : ""} 
                                    ${req.body.TaskStatusId ? "TaskStatusId," : ""}
                                    TaskTypeId, TaskPriorityId,
                                    ${req.body.EstimatedEffort ? "EstimatedEffort," : ""}
                                    ${req.body.TaskStartDate ? "TaskStartDate," : ""}
                                    ${req.body.FunctionalAreaId ? "FunctionalAreaId," : ""}
                                    ${req.body.WorkitemStatusId ? "WorkitemStatusId," : ""}
                                    ${req.body.Deadline ? "Deadline," : ""}
                                    ReportedBy, CreatedBy,WorkItemKey)
                                    VALUES('${req.body.TaskName.replace(/'/g, "\\'")}', 
                                    ${req.body.TaskDescription ? "'" + req.body.TaskDescription.replace(/'/g, "\\'") + "'" + "," : ""} 
                                    '${req.body.ProjectId}',
                                    ${req.body.AssigneeId ? req.body.AssigneeId + "," : ""}
                                    ${req.body.ReviewerId ? req.body.ReviewerId + "," : ""}
                                    ${req.body.ParentTaskId ? req.body.ParentTaskId + "," : ""}
                                    ${req.body.TaskStatusId ? req.body.TaskStatusId + "," : ""}
                                    '${req.body.TaskTypeId}',
                                    '${req.body.TaskPriorityId}',
                                    ${req.body.EstimatedEffort ? req.body.EstimatedEffort + "," : ""}
                                    ${req.body.TaskStartDate ? "'" + req.body.TaskStartDate + "'" + "," : ""}
                                    ${req.body.FunctionalAreaId ? req.body.FunctionalAreaId + "," : ""}
                                    ${req.body.WorkitemStatusId ? req.body.WorkitemStatusId + "," : ""}
                                    ${req.body.Deadline ? "'" + req.body.Deadline + "'" + "," : ""}
                                    '${req.body.ReportedBy}',
                                    '${req.body.ReportedBy}',
                                    '${parseInt(Max + 1)}')`;


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

                    let taskId = req.body.TaskId ? req.body.TaskId : obj.response.insertId;

                    var attachments = (req.body.attachments) ? req.body.attachments : [];

                    var requirements = (req.body.SystemRequirementIds) ? req.body.SystemRequirementIds : [];

                    let attachmentFileNames = ``;
                    attachments.forEach(e => {
                        attachmentFileNames += `(${taskId},'${e}', ${req.body.ReportedBy}),`
                    });

                    attachmentFileNames = attachmentFileNames.substr(0, attachmentFileNames.length - 1) + `;`;

                    let filesQuery = `DELETE FROM task_files WHERE TaskId = ${taskId};`

                    let requirementFileNames = ``;
                    requirements.forEach(e => {
                        requirementFileNames += `(${taskId},'${e}'),`
                    });

                    requirementFileNames = requirementFileNames.substr(0, requirementFileNames.length - 1) + `;`;

                    filesQuery += `DELETE FROM system_requirement_workitem_map WHERE TaskId = ${taskId};`

                    if (req.body.ProjectCycleId) {
                        console.log("testing -- " + req.body.ProjectCycleId)
                        filesQuery += `DELETE FROM task_iteration_map WHERE TaskId = ${taskId};`
                        filesQuery += `INSERT INTO task_iteration_map (TaskId,IterationId) VALUES ('${taskId}','${req.body.ProjectCycleId}');`
                    } else {
                        filesQuery += `DELETE FROM task_iteration_map WHERE TaskId = ${taskId};`
                    }

                    if (requirements.length) {
                        console.log("testing -- ")

                        filesQuery += `INSERT INTO system_requirement_workitem_map (TaskId,SystemRequirementId) VALUES ${requirementFileNames};`
                    }

                    if (attachments.length) {
                        filesQuery += `INSERT INTO task_files (TaskId, FileURL, CreatedBy) VALUES ${attachmentFileNames};` //do nothing if no files are getting uploaded
                    }

                    if (req.body.StatusRemarks) {
                        filesQuery += req.body.StatusRemarkId ?
                            `UPDATE status_remarks SET Remarks='${req.body.StatusRemarks}', LastUpdatedBy='${req.body.ReportedBy}' WHERE StatusRemarkId=${req.body.StatusRemarkId}`
                            : `INSERT INTO status_remarks (TaskId , Remarks ,CreatedBy) VALUES ('${taskId}','${req.body.StatusRemarks}','${req.body.ReportedBy}'); `
                    }

                    let searchProjectCode = `SELECT ProjectCode FROM  project WHERE ProjectId=${req.body.ProjectId}`
                    let ProjectCode = ``;
                    let key = `${req.body.WorkItemKey ? req.body.WorkItemKey : parseInt(Max + 1)}`;

                    connection.query(filesQuery, function (objFiles) {

                        // add comments if there are any
                        if (req.body.TaskId && req.body.CommentText) {
                            let commentQuery = `INSERT INTO comments (TaskId, CommentText, CreatedBy)
                                                VALUES ('${req.body.TaskId}',
                                                '${req.body.CommentText.replace(/'/g, "\\'")}',
                                                '${req.body.CreatedBy}')`;

                            connection.query(commentQuery, function (objComments) {
                                connection.query(searchProjectCode, function (objProject) {
                                    ProjectCode = objProject.response[0].ProjectCode;
                                    if (ProjectCode.length) {
                                        res.send({
                                            success: obj.error == null && objFiles.error == null && objComments.error == null,
                                            message: ProjectCode + "-" + key,
                                            data: obj.response
                                        });
                                    }
                                });
                            })
                        } else {
                            connection.query(searchProjectCode, function (objProject) {
                                ProjectCode = objProject.response[0].ProjectCode;
                                if (ProjectCode.length) {
                                    res.send({
                                        success: obj.error == null && objFiles.error == null,
                                        message: ProjectCode + "-" + key,
                                        data: obj.response
                                    });
                                }
                            });
                        }
                    });

                });
            });
        }
    });
}

// Get task
exports.task_list = (req, res) => {
    var query = `SELECT 
                    t.TaskId, t.TaskName, t.TaskDescription, t.EstimatedEffort, t.RemainingEffort,t.TaskStartDate,
                    t.CreatedBy, t.LastUpdatedBy, t.CreatedDateTime, t.LastUpdatedDateTime,
                    t.ParentTaskId, t2.TaskName ParentTaskName,
                    tt.TaskTypeId, tt.TaskTypeName, tt.TaskTypeDescription, tt.IconClass,
                    tp.TaskPriorityId, tp.PriorityText,
                    ts.TaskStatusId, ts.StatusText,it.IterationNumber,
                    p.ProjectId, p.ProjectName, p.ProjectCode, p.ProjectTypeId, pt.ProjectTypeName, p.OrganizationId,
                    em.EmployeeId ManagerId,
                    em.FirstName ManagerFirstName, em.MiddleName ManagerMiddleName, em.LastName ManagerLastName, 
                    em.FullName ManagerFullName,
                    ea.EmployeeId AssigneeId, ea.FirstName, ea.MiddleName, ea.LastName, 
                    ea.FullName AssigneeFullName, 
                    ec.FullName CreatorFullName, 
                    eu.FullName LastEditorFullName,
                    w.Hours as EffortSpent
                FROM task t
                JOIN project p ON t.ProjectId = p.ProjectId
                JOIN project_type pt ON p.ProjectTypeId = pt.ProjectTypeId
                JOIN task_type tt ON tt.TaskTypeId = t.TaskTypeId
                JOIN task_priority tp ON tp.TaskPriorityId = t.TaskPriorityId
                JOIN task_status ts ON ts.TaskStatusId = t.TaskStatusId and ts.IsActive = 'Y'
                JOIN employee ec ON t.CreatedBy = ec.EmployeeId
                JOIN employee eu ON t.CreatedBy = eu.EmployeeId
                LEFT JOIN employee ea ON t.AssigneeId = ea.EmployeeId
                LEFT JOIN task t2 ON t.ParentTaskId = t2.TaskId
                LEFT JOIN work_log w ON t.TaskId = w.TaskId
                LEFT JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId 
                LEFT JOIN 
					 (SELECT ez.*, pem.ProjectId FROM project_employee_map pem JOIN employee ez ON pem.EmployeeId = ez.EmployeeId) em
                     ON t.ProjectId = em.ProjectId 
                LEFT JOIN task_iteration_map tim ON t.TaskId = tim.TaskId
                LEFT JOIN  
                (SELECT i.*, tim.TaskId FROM task_iteration_map tim JOIN development_iteration i ON tim.IterationId = i.IterationId) it
                                 ON t.TaskId = it.TaskId`;


    var whereList = [];

    if (req.params.taskId)
        whereList.push({
            item: 't.TaskId',
            value: req.params.taskId
        });

    if (req.params.projectCode)
        whereList.push({
            item: 'p.ProjectCode',
            value: req.params.projectCode
        });

    if (req.query.AssigneeId)
        whereList.push({
            item: 't.AssigneeId',
            value: req.query.AssigneeId
        });

    if (req.query.ProjectsOf)
        whereList.push({
            item: 'pem.EmployeeId',
            value: req.query.ProjectsOf
        });

    if (req.query.OrganizationId)
        whereList.push({
            item: 'ea.OrganizationId',
            value: req.query.OrganizationId
        });

    // console.log(whereList);return;

    var whereClause = ``;
    whereList.forEach(function (elem, index) {
        whereClause += ` ${index == 0 ? 'WHERE' : 'AND'} `;
        whereClause += ` ${elem.item} = '${elem.value}' `;
    });


    query += whereClause + ` GROUP BY t.TaskId
                                    , t.TaskName, t.TaskDescription, t.EstimatedEffort, t.RemainingEffort,t.TaskStartDate,
                                t.CreatedBy, t.LastUpdatedBy, t.CreatedDateTime, t.LastUpdatedDateTime,
                                t.ParentTaskId, t2.TaskName,
                                tt.TaskTypeId, tt.TaskTypeName, tt.TaskTypeDescription, tt.IconClass,
                                tp.TaskPriorityId, tp.PriorityText,
                                ts.TaskStatusId, ts.StatusText,it.IterationNumber,
                                p.ProjectId, p.ProjectName, p.ProjectCode, p.ProjectTypeId, pt.ProjectTypeName, p.OrganizationId,
                                em.EmployeeId,
                                em.FirstName, em.MiddleName, em.LastName, 
                                em.FullName,
                                ea.EmployeeId, ea.FirstName, ea.MiddleName, ea.LastName, 
                                ea.FullName, 
                                ec.FullName, 
                                eu.FullName`;

    console.log(query);

    connection.query(query, function (objTask) {

        if (objTask.error) {
            res.status(400).send({
                success: false,
                message: objTask.error,
                data: objTask.response
            });
            return;
        }

        if (!req.params.taskId) {
            console.log('NO TASK ID');
            res.status(200).send({
                success: true,
                message: `Success`,
                data: objTask.response
            });
            return;
        }

        let subTaskQuery = `SELECT * FROM task WHERE ParentTaskId = '${req.params.taskId}'`;
        console.log(req.params);

        connection.query(subTaskQuery, function (objSubtask) {
            res.send({
                success: true,
                message: objSubtask.error || `Success`,
                data: {
                    task: objTask.response,
                    subTasks: objSubtask.response
                }
            });
        });
    });
}

// Task by project id, for dropdown
exports.task_list_by_project_id = (req, res) => {

    var query = `SELECT * FROM task WHERE ProjectId = ${req.query.ProjectId}`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

exports.task_list_by_project_ids = (req, res) => {

    var query = `SELECT t.*,p.* FROM task t 
     JOIN project p ON t.ProjectId=p.ProjectId
     WHERE t.ProjectId = ${req.query.ProjectId}`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

// Task by assignee
exports.task_list_by_assignee = (req, res) => {
    if (!req.params.assigneeId) {
        return res.status(400).send({
            success: false,
            message: `assigneeId is required`,
            data: null
        });
    }

    var query = `SELECT t.*,ts.IsActive FROM task t JOIN workitem_status ts ON t.WorkitemStatusId = ts.WorkitemStatusId
    JOIN project p ON t.ProjectId = p.ProjectId
    WHERE ts.IsActive= 'Y' and AssigneeId = '${req.params.assigneeId}' `;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

// Task by assignee
exports.timesheet_task_list_by_assignee = (req, res) => {

    if (!req.params.assigneeId) {
        return res.status(400).send({
            success: false,
            message: `assigneeId is required`,
            data: null
        });
    }

    var query = `SELECT t.*,ts.IsActive FROM task t JOIN task_status ts ON t.TaskStatusId = ts.TaskStatusId
    WHERE ts.IsActive= 'Y' and t.TaskStatusId NOT IN (2,11,12) and AssigneeId = ${req.params.assigneeId} `;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

//
exports.task_list_by_org = (req, res) => {
    if (!req.params.OrganizationId) {
        return res.status(400).send({
            success: false,
            message: `OrganizationId is required`,
            data: null
        });
    }

    let whereClause = "";

    if (req.query.ProjectsOfAssignee) {
        whereClause += ` AND p.ProjectId IN (SELECT ProjectId FROM project_employee_map WHERE EmployeeId = ${req.query.ProjectsOfAssignee})`;
    }

    if (req.query.ProjectsOfManager) {
        whereClause += ` AND p.ProjectId IN (SELECT ProjectId FROM project_employee_map WHERE EmployeeId = ${req.query.ProjectsOfManager} AND ProjectRoleId = 1)`;
    }

    if (req.query.ProjectCode) {
        whereClause += ` AND p.ProjectCode = '${req.query.ProjectCode}'`;
    }

    var query = `SELECT * FROM task t JOIN project p ON t.ProjectId = p.ProjectId 
                 JOIN workitem_status ts ON t.WorkitemStatusId = ts.WorkitemStatusId AND ts.IsActive = 'Y'
                 JOIN task_priority tp ON t.TaskPriorityId = tp.TaskPriorityId
                 AND p.OrganizationId = ${req.params.OrganizationId}
                 ${whereClause}
                 LEFT JOIN employee ea ON t.AssigneeId = ea.EmployeeId
                 ORDER BY p.ProjectCode, t.WorkItemKey`;

    console.log(query);

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}


// Get all task status
exports.task_status_list = (req, res) => {

    var query = `SELECT * FROM task_status WHERE IsActive = 'Y' AND Deleted = 'N'`;
    if (req.params.TaskTypeId) {
        var typeId = req.params.TaskTypeId;

        if (typeId == 1 || typeId == 3 || typeId == 4) {
            query = `SELECT * FROM task_status WHERE IsActive = 'Y' AND Deleted ='N' AND TaskTypeId = 1`;
        }
        else {
            query = `SELECT * FROM task_status WHERE IsActive = 'Y' AND Deleted ='N' AND TaskTypeId = 2`;
        }
    }

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}


// Get all task types
exports.task_type_list = (req, res) => {

    let query = req.params.TaskTypeId ?
        `SELECT * FROM task_type WHERE TaskTypeId = ${req.params.TaskTypeId} AND Deleted='N'` :
        `SELECT * FROM task_type WHERE  Deleted='N'`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}


// save tasks to iteration
exports.assigntaskstoiteration = (req, res) => {

    if (!req.body.IterationId) {
        return res.status(400).send({
            success: false,
            message: "IterationId cannot be empty",
            data: null
        });
    }

    let taskIds = ``;
    req.body.selectedTasks.forEach((e, i) => {
        taskIds += `'${e}',`;
    });

    taskIds = taskIds.substr(0, taskIds.length - 1)
    console.log(taskIds)


    let query = `DELETE FROM task_iteration_map WHERE IterationId = '${req.body.IterationId}' ;  DELETE FROM task_iteration_map WHERE TaskId IN (${taskIds});`;
    console.log(query)

    connection.query(query, function (objDel) {

        if (objDel.error != null) {
            res.status(400).send({
                success: false,
                message: "Error: Code 90001. Please contact your system admin with this code.",
                data: null
            });
        }

        let query = `INSERT INTO task_iteration_map (IterationId, TaskId) VALUES `;

        req.body.selectedTasks.forEach((e, i) => {
            query += `('${req.body.IterationId}','${e}'),`;
        });

        query = query.substr(0, query.length - 1) + `;`;

        console.log(query);
        // res.send(query);
        // return;

        connection.query(query, function (obj) {
            res.send({
                success: obj.error == null,
                message: obj.error || `Success`,
                data: obj.response
            });
        });

    });
}


// get tasks assigned to iteration
exports.tasksbyiteration = (req, res) => {

    if (!req.query.IterationId) {
        return res.status(400).send({
            success: false,
            message: "IterationId cannot be empty",
            data: null
        });
    }

    let query = `SELECT * FROM task_iteration_map WHERE IterationId = ${req.query.IterationId}`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

// assign tasks to resources
exports.assigntaskstoresources = (req, res) => {

    if (!req.body.EmployeeId) {
        return res.status(400).send({
            success: false,
            message: "EmployeeId is required",
            data: null
        });
    }

    if (!req.body.Tasks || !req.body.Tasks.length) {
        return res.status(200).send({
            success: true,
            message: "No tasks assigned",
            data: null
        });
    }

    // TODO: NEED TO UPDATE THE TASK_ASSIGNMENT TABLE TOO    

    let query = `UPDATE task SET AssigneeId = '${req.body.EmployeeId}' 
                    WHERE TaskId IN (${req.body.Tasks.join()})`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}
exports.iteration_details_id = (req, res) => {

    var query = `SELECT d.*,p.* FROM development_iteration d JOIN project p ON
                 d.ProjectId = p.ProjectId where d.IterationId='${req.params.IterationId}'`;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });

}

// // assign tasks to resources by email
// exports.assigntaskstoresourcesEmail = (req, res) => {

//     if (!req.body.EmployeeId) {
//         return res.status(400).send({
//             success: false, message: "EmployeeId is required", data: null
//         });
//     }

//     if (!req.body.Tasks || !req.body.Tasks.length) {
//         return res.status(200).send({
//             success: true, message: "No tasks assigned", data: null
//         });
//     }

//     if (!req.body.CreatedId) {
//         return res.status(400).send({
//             success: false, message: "CreatedId is required", data: null
//         });
//     }

//     var employeeId = req.body.EmployeeId;
//     let EmailId = ``;
//     let query = `SELECT Email FROM employee where EmployeeId=${employeeId}`;
//     connection.query(query, function (obj) {

//         employeEmail = obj.response;
//         EmailId = employeEmail[0].Email;
//     });

//     let employee = ``;
//     let AssignerName = ``;
//     let assignquery = `SELECT * FROM employee where EmployeeId=${req.body.CreatedId}`;
//     connection.query(assignquery, function (obj) {

//         employee = obj.response;
//         AssignerName = employee[0].FullName;
//     });


//     for (var i = 0; i < req.body.Tasks.length; i++) {

//         let query = `SELECT t.*,p.* FROM task as t INNER JOIN project as p 
//              ON t.ProjectId = p.ProjectId Where t.TaskId=${req.body.Tasks[i]}`;

//         // let query = `SELECT t*,p.* FROM task as t INNER JOIN project as p 
//         // ON t.ProjectId = p.ProjectId 
//         // Where TaskId=${req.body.Tasks[i]}`;
//         let taskis = ``;
//         taskName = ``;
//         taskDescription = ``;
//         taskStartDate = ``;
//         EstimatedEffort = ``;
//         projectCode = ``;
//         connection.query(query, function (obj) {

//             taskis = obj.response;
//             taskName = taskis[0].TaskName;
//             taskDescription = taskis[0].TaskDescription;
//             taskStartDate = taskis[0].TaskStartDate;
//             // EstimatedEffort = taskis[0].EstimatedEffort;
//             projectCode = taskis[0].ProjectCode;
//             if (taskis[0].EstimatedEffort == 1) {
//                 EstimatedEffort = taskis[0].EstimatedEffort + "hour";
//             } else {
//                 EstimatedEffort = taskis[0].EstimatedEffort + " hours";
//             }
//             let emailObj = {
//                 message: {
//                     from: "\"🔔 SEPM Admin\"  sepm.management@gmail.com",
//                     to: [
//                         EmailId
//                     ],
//                     subject: `${AssignerName} has assigned you a task in the project ${projectCode}`,
//                     html: `<div 
//                         style="
//                             width:55%;
//                             padding:35px;
//                             font-family:Verdana,Tahoma,Arial,sans-serif;
//                             background:#eee;
//                             border:1px solid #777;
//                             margin:10px auto
//                         ">
//                         <h1 style="color:#7ad;font-family:Tahoma,Arial,sans-serif;font-weight:200">${taskName}</h1>
//                         <p>${taskDescription}</p>
//                         <p>
//                         Start Date &nbsp;
//                         <span style="font-size:15px;color:#699;font-weight:bold"> ${moment(taskStartDate).format('LLL').slice(0, 16)}</span>
//                         </p>
//                         <p>
//                         Due Date &nbsp; <span style="font-size:15px;color:#699;font-weight:bold">${moment(taskStartDate).format('LLL').slice(0, 16)}</span>
//                         </p>
//                         <p>
//                         Estimated Effort &nbsp;<span style="font-size:15px;color:#699;font-weight:bold">${EstimatedEffort} </span>
//                         </p>
//                     </div>`,
//                 }
//             };

//             mail.sendgmailfunction(emailObj);
//         });


//     }
// }

// assign tasks to resources by email
exports.assigntaskstoresourcesEmail = (req, res) => {


    if (!req.body.EmployeeId) {
        return res.status(400).send({
            success: false,
            message: "EmployeeId is required",
            data: null
        });
    }

    if (!req.body.Tasks || !req.body.Tasks.length) {
        return res.status(200).send({
            success: true,
            message: "No tasks assigned",
            data: null
        });
    }

    if (!req.body.CreatedId) {
        return res.status(400).send({
            success: false,
            message: "CreatedId is required",
            data: null
        });
    }

    var employeeId = req.body.EmployeeId;
    let EmailId = ``;
    let query = `SELECT Email FROM employee where EmployeeId=${employeeId}`;
    connection.query(query, function (obj) {

        employeEmail = obj.response;
        EmailId = employeEmail[0].Email;
    });

    let employee = ``;
    let AssignerName = ``;
    let assignquery = `SELECT * FROM employee where EmployeeId=${req.body.CreatedId}`;
    connection.query(assignquery, function (obj) {

        employee = obj.response;
        AssignerName = employee[0].FullName;
    });

    var taskList = [];
    for (var i = 0; i < req.body.Tasks.length; i++) {

        let query = `SELECT t.*,p.* FROM task as t INNER JOIN project as p 
        ON t.ProjectId = p.ProjectId Where t.TaskId=${req.body.Tasks[i]}`;


        let taskis = ``;
        connection.query(query, function (obj) {
            var task = {};

            taskis = obj.response;
            // console.log("_____");
            //console.log(taskis);
            task.taskName = taskis[0].TaskName;
            console.log('Hi');
            console.log(taskis);
            task.taskDescription = taskis[0].TaskDescription;
            task.taskStartDate = taskis[0].TaskStartDate;
            // EstimatedEffort = taskis[0].EstimatedEffort;
            task.projectCode = taskis[0].ProjectCode;
            if (taskis[0].EstimatedEffort == 1) {
                task.EstimatedEffort = taskis[0].EstimatedEffort + "hour";
            } else {
                task.EstimatedEffort = taskis[0].EstimatedEffort + " hours";
            }

            var count = taskList.push(task);
            if (req.body.Tasks.length == count) {
                console.log(taskList);


                var emailBody = ``;
                taskList.forEach(function (list) {
                    var taskName = ``;
                    var taskDescription = ``;
                    var taskStartDate = ``;
                    var taskDueDate = ``;
                    var EstimatedEffort = ``;
                    taskName = '<h2 style="color:#7ad;font-family:Tahoma,Arial,sans-serif;font-weight:200">' + list.taskName + '</h2>';
                    taskDescription = '<p>' + list.taskDescription + '</p>';
                    taskStartDate = '<p>Start Date &nbsp;<span style="font-size:15px;color:#699;font-weight:bold">' + moment(list.taskStartDate).format('LLL').slice(0, 16) + '</span>' + '</p>';
                    taskDueDate = '<p>Due Date &nbsp; <span style="font-size:15px;color:#699;font-weight:bold">' + moment(list.taskStartDate).format('LLL').slice(0, 16) + '</span></p>';
                    EstimatedEffort = '<p>Estimated Effort &nbsp;<span style="font-size:15px;color:#699;font-weight:bold">' + list.EstimatedEffort + '</span></p>'
                    emailBody += taskName + taskDescription + taskStartDate + taskDueDate + EstimatedEffort;
                });

                emailBody += '<hr>';




                let emailObj = {
                    message: {
                        from: "\"🔔 SEPM Admin\"  sepm.management@gmail.com",
                        to: [
                            EmailId
                        ],
                        subject: `${AssignerName} has assigned you a task in the Project `,
                        html: `<div style="
                        width:55%;
                        padding:35px;
                        font-family:Verdana,Tahoma,Arial,sans-serif;
                        background:#eee;
                        border:1px solid #777;
                        margin:10px auto
                        ">
                        ${emailBody}
                
                        </div>`,
                    }
                };
                mail.sendgmailfunction(emailObj);
                return;

            }

        });


    }

    // if (req.body.Tasks.length == count) {
    //     console.log("--------------------");
    //     console.log(taskList);
    //     taskList.forEach(function (item, index) {
    //         console.log(item.taskDescription);
    //     })
    // }

}

// list of assigned task By Employee Id 
// TODO: APPEARS TO BE A DUPLICATE FUNCTION WHICH IS NOT IN USE
exports.list_of_assigneeTask = (req, res) => {

    let query =
        `SELECT t.*,ws.* FROM task as t
            INNER JOIN workitem_status as ws ON ws.WorkitemStatusId = t.WorkitemStatusId and ws.IsActive = 'Y'
            and t.AssigneeId = ${req.params.EmployeeId} and t.Deadline < NOW() + INTERVAL 1 DAY`;
    // `SELECT * FROM task where AssigneeId = ${req.params.EmployeeId} and task.TaskStartDate < NOW() + INTERVAL 1 DAY`;
    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}
exports.getTasksForMyProjects = (req, res) => {

    if (!req.params.resourceId) {
        return res.status(400).send({
            success: false,
            message: "ResourceId cannot be empty",
            data: null
        });
    }

    let query = `SELECT * FROM task t 
                JOIN project p ON t.ProjectId = p.ProjectId 
                JOIN project_employee_map pem ON pem.ProjectId = p.ProjectId
                WHERE pem.EmployeeId = ${req.params.resourceId}`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

//Get All Task Status 
exports.getTaskStatusList = (req, res) => {

    let query = `Select * From task_status`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

//change task status best on taskId
exports.changeTaskStatus = (req, res) => {

    let crupQuery = `UPDATE task set 
                    WorkitemStatusId ='${req.body.WorkitemStatusId}',
                    LastUpdatedBy = '${req.body.LastUpdatedBy}',
                    RemainingEffort = NULL
                     where TaskId =${req.body.TaskId}`;

    connection.query(crupQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

//change Parent task status best on ParentTaskId
exports.changeParentTaskStatus = (req, res) => {
    let crupQuery = ``;
    if (req.body.TaskStatusId == 2) {

        crupQuery = `UPDATE task set 
                    TaskStatusId ='${req.body.TaskStatusId}',
                    LastUpdatedBy = '${req.body.LastUpdatedBy}'
                    where TaskId =${req.body.TaskId}`;

    } else {
        return;
    }

    connection.query(crupQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

exports.filter_task_list_by_org = (req, res) => {
    if (!req.params.OrganizationId) {
        return res.status(400).send({
            success: false,
            message: `OrganizationId is required`,
            data: null
        });
    }

    let whereClause = "";

    if (req.query.ProjectsOfAssignee) {
        whereClause += ` AND p.ProjectId IN (SELECT ProjectId FROM project_employee_map WHERE EmployeeId = ${req.query.ProjectsOfAssignee})`;
    }

    if (req.query.ProjectsOfManager) {
        whereClause += ` AND p.ProjectId IN (SELECT ProjectId FROM project_employee_map WHERE EmployeeId = ${req.query.ProjectsOfManager} AND ProjectRoleId = 1)`;
    }

    if (req.query.ProjectCode) {
        whereClause += ` AND p.ProjectCode = '${req.query.ProjectCode}' `;
    }

    var query = `SELECT * FROM task t JOIN project p ON t.ProjectId = p.ProjectId 
                 JOIN task_status ts ON t.TaskStatusId = ts.TaskStatusId AND ts.IsActive = 'Y'
                 JOIN task_priority tp ON t.TaskPriorityId = tp.TaskPriorityId
                 AND p.OrganizationId = ${req.params.OrganizationId}
                 ${whereClause}
                 AND (t.TaskName LIKE '%${req.query.textName}%' OR tp.PriorityText LIKE '%${req.query.textName}%' 
                 OR ts.StatusText LIKE '%${req.query.textName}%' OR t.WorkItemKey LIKE '%${req.query.textName}%'
                 OR t.AssigneeId IN(SELECT EmployeeId FROM employee Where FullName LIke '%${req.query.textName}%'))
                 LEFT JOIN employee ea ON t.AssigneeId = ea.EmployeeId     
                 ORDER BY p.ProjectCode, t.WorkItemKey`;

    console.log(query);

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

exports.task_list_by_Assignee_ids = (req, res) => {

    var query = `SELECT t.*,p.* FROM task t 
     JOIN project p ON t.ProjectId=p.ProjectId
     WHERE t.AssigneeId = ${req.query.AssigneeId}`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

exports.get_task_types = (req, res) => {

    let query = `SELECT tt.* FROM project_type_task_type_map ptm
                JOIN project_type pt ON ptm.ProjectTypeId = pt.ProjectTypeId
                JOIN task_type tt ON ptm.TaskTypeId = tt.TaskTypeId
                WHERE ptm.ProjectTypeId='${req.params.ProjectTypeId}'`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

// Get all task types by Project
exports.task_types_by_Project = (req, res) => {
    console.log("Enter.....")

    let query = `SELECT DISTINCT  tt.* FROM project_type_task_type_map ptm
                JOIN project_type pt ON ptm.ProjectTypeId = pt.ProjectTypeId
                JOIN project p ON ptm.ProjectTypeId = p.ProjectTypeId
                JOIN task_type tt ON ptm.TaskTypeId = tt.TaskTypeId
                where  p.ProjectId IN (${req.query.Projects}) AND tt.Deleted='N' `;

    console.log(query)

    connection.query(query, function (obj) {

        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

exports.get_task_types = (req, res) => {

    let query = `SELECT tt.* FROM project_type_task_type_map ptm
                JOIN project_type pt ON ptm.ProjectTypeId = pt.ProjectTypeId
                JOIN task_type tt ON ptm.TaskTypeId = tt.TaskTypeId
                WHERE ptm.ProjectTypeId='${req.params.ProjectTypeId}' AND tt.Deleted='N'`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}


exports.get_task_types = (req, res) => {

    let query = `SELECT tt.* FROM project_type_task_type_map ptm
                JOIN project_type pt ON ptm.ProjectTypeId = pt.ProjectTypeId
                JOIN task_type tt ON ptm.TaskTypeId = tt.TaskTypeId
                WHERE ptm.ProjectTypeId='${req.params.ProjectTypeId}'`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

exports.get_workitem_types = (req, res) => {

    let query = `SELECT tt.* FROM project_type_task_type_map ptm
                JOIN project_type pt ON ptm.ProjectTypeId = pt.ProjectTypeId
                JOIN task_type tt ON ptm.TaskTypeId = tt.TaskTypeId
                WHERE ptm.ProjectTypeId='${req.params.ProjectTypeId}' AND tt.Deleted='N'`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

// GET Requirement Details by Work

exports.getMapRequirementDetailsByWorkItemId = (req, res) => {

    let query = `Select sr.SystemRequirementId,sr.SystemRequirementName,sr.SystemRequirementCode from  system_requirement sr
                 JOIN  system_requirement_workitem_map srwm 
                 ON sr.SystemRequirementId = srwm.SystemRequirementId
                 Where srwm.TaskId=${req.query.workItemId}`;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}
