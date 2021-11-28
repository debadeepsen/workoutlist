const connection = require('./mysql.controller');

exports.workitem_report_by_resource = (req, res) => {

    var filterClause = req.query.EmployeeCode ? ` AND e.EmployeeCode = '${req.query.EmployeeCode}'` : ``;

    var query = `SELECT 
                    t.TaskId, t.TaskName, tt.IconClass, tt.TaskTypeName, tt.TaskTypeId, tt.SortOrder,
                    CONCAT( p.ProjectCode, '-', t.WorkItemKey ) WorkItemKey, 
                        t.AssigneeId, e.FullName, e.EmployeeCode FROM task t
                        JOIN task_type tt ON t.TaskTypeId = tt.TaskTypeId
                        JOIN task_status ts ON t.TaskStatusId = ts.TaskStatusId
                        JOIN project p ON p.ProjectId = t.ProjectId
                        AND 
								  (p.ProjectId IN 
								 	(SELECT ProjectId FROM project_employee_map pem WHERE pem.ProjectRoleId = 1 
									  AND pem.EmployeeId = ${req.query.managerId})
									  
									  OR
										
									  (SELECT COUNT(*) FROM employee_system_role_map WHERE EmployeeId = ${req.query.managerId} AND SystemRoleId = 1 || SystemRoleId = 13) > 0
									)
                        JOIN employee e ON e.EmployeeId = t.AssigneeId
                        WHERE (ts.IsOpenStatus = 'Y' OR ts.IsInProgressStatus = 'Y') ${filterClause}
                        ORDER BY e.FullName, tt.SortOrder, t.TaskId`;


    connection.query(query, function (obj) {
        var response = [];

        obj.response.forEach(e => {
            var item = response.find(o => o.AssigneeId == e.AssigneeId);

            if (item) {

                var taskTypeGroup = item.WorkItems.find(w => w.TaskTypeId == e.TaskTypeId);

                if (taskTypeGroup) {

                    taskTypeGroup.WorkItems.push({
                        TaskId: e.TaskId,
                        WorkItemKey: e.WorkItemKey,
                        TaskName: e.TaskName,
                        TaskTypeName: e.TaskTypeName,
                        IconClass: e.IconClass
                    });

                }
                else {

                    item.WorkItems.push({
                        TaskTypeId: e.TaskTypeId,
                        TaskTypeName: e.TaskTypeName,
                        IconClass: e.IconClass,
                        WorkItems: [{
                            TaskId: e.TaskId,
                            WorkItemKey: e.WorkItemKey,
                            TaskName: e.TaskName,
                            TaskTypeName: e.TaskTypeName,
                            IconClass: e.IconClass
                        }]
                    });

                }
            }
            else {
                response.push({
                    AssigneeId: e.AssigneeId,
                    Assignee: e.FullName,
                    EmployeeCode: e.EmployeeCode,
                    WorkItems: [{
                        TaskTypeId: e.TaskTypeId,
                        TaskTypeName: e.TaskTypeName,
                        IconClass: e.IconClass,
                        WorkItems: [{
                            TaskId: e.TaskId,
                            WorkItemKey: e.WorkItemKey,
                            TaskName: e.TaskName,
                            TaskTypeName: e.TaskTypeName,
                            IconClass: e.IconClass
                        }]
                    }]
                })
            }
        })

        res.status(200).send({
            success: true,
            message: '',
            data: response
        });

    });
}
//Work item Project By Resource

exports.workitem_report_project_by_resource = (req, res) => {

    var filterClause = req.query.EmployeeCode ? ` AND e.EmployeeCode = '${req.query.EmployeeCode}'` : ``;

    var query = `SELECT 
                    t.TaskId, t.TaskName, tt.IconClass, tt.TaskTypeName, tt.TaskTypeId, tt.SortOrder,
                    CONCAT( p.ProjectCode, '-', t.WorkItemKey ) WorkItemKey, 
                        t.AssigneeId, e.FullName, e.EmployeeCode FROM task t
                        JOIN task_type tt ON t.TaskTypeId = tt.TaskTypeId
                        JOIN task_status ts ON t.TaskStatusId = ts.TaskStatusId
                        JOIN project p ON p.ProjectId = t.ProjectId
                        JOIN employee e ON e.EmployeeId = t.AssigneeId
                        WHERE (ts.IsOpenStatus = 'Y' OR ts.IsInProgressStatus = 'Y') ${filterClause}
                        AND t.ProjectId='${req.query.ProjectId}'
                        ORDER BY e.FullName, tt.SortOrder, t.TaskId`;


    connection.query(query, function (obj) {
        var response = [];

        obj.response.forEach(e => {
            var item = response.find(o => o.AssigneeId == e.AssigneeId);

            if (item) {

                var taskTypeGroup = item.WorkItems.find(w => w.TaskTypeId == e.TaskTypeId);

                if (taskTypeGroup) {

                    taskTypeGroup.WorkItems.push({
                        TaskId: e.TaskId,
                        WorkItemKey: e.WorkItemKey,
                        TaskName: e.TaskName,
                        TaskTypeName: e.TaskTypeName,
                        IconClass: e.IconClass
                    });

                }
                else {

                    item.WorkItems.push({
                        TaskTypeId: e.TaskTypeId,
                        TaskTypeName: e.TaskTypeName,
                        IconClass: e.IconClass,
                        WorkItems: [{
                            TaskId: e.TaskId,
                            WorkItemKey: e.WorkItemKey,
                            TaskName: e.TaskName,
                            TaskTypeName: e.TaskTypeName,
                            IconClass: e.IconClass
                        }]
                    });

                }
            }
            else {
                response.push({
                    AssigneeId: e.AssigneeId,
                    Assignee: e.FullName,
                    EmployeeCode: e.EmployeeCode,
                    WorkItems: [{
                        TaskTypeId: e.TaskTypeId,
                        TaskTypeName: e.TaskTypeName,
                        IconClass: e.IconClass,
                        WorkItems: [{
                            TaskId: e.TaskId,
                            WorkItemKey: e.WorkItemKey,
                            TaskName: e.TaskName,
                            TaskTypeName: e.TaskTypeName,
                            IconClass: e.IconClass
                        }]
                    }]
                })
            }
        })

        res.status(200).send({
            success: true,
            message: '',
            data: response
        });

    });
}




exports.workitem_report_by_project = (req, res) => {

    var query = `SELECT * FROM task t 
                    JOIN work_log w ON w.TaskId = t.TaskId
                    WHERE t.AssigneeId IS NOT NULL 
                    AND t.ProjectId = ${req.params.projectId}
                    AND YEARWEEK(w.EntryDate, 1) = YEARWEEK(CURDATE(), 1);`;


    connection.query(query, function (obj) {
        var response = [];

        obj.response.forEach(e => {
            var item = response.find(o => o.AssigneeId == e.AssigneeId);

            if (item) {
                item.WorkItems.push({
                    TaskId: e.TaskId,
                    WorkItemKey: e.WorkItemKey,
                    TaskName: e.TaskName,
                    TaskTypeName: e.TaskTypeName,
                    IconClass: e.IconClass
                });
            }
            else {
                response.push({
                    AssigneeId: e.AssigneeId,
                    Assignee: e.FullName,
                    EmployeeCode: e.EmployeeCode,
                    WorkItems: [{
                        TaskId: e.TaskId,
                        WorkItemKey: e.WorkItemKey,
                        TaskName: e.TaskName,
                        TaskTypeName: e.TaskTypeName,
                        IconClass: e.IconClass
                    }]
                })
            }
        })

        res.status(200).send({
            success: true,
            message: '',
            data: response
        });

    });

}

/************************************** Project Status Report ************************************/
exports.project_status_report = (req, res) => {
    // console.log(req.body);
    if (!req.body.ProjectId) {
        res.status(400).send({
            success: false,
            message: "Project Id is missing",
            data: null
        })
    }

    if (!req.body.MaxDate || !req.body.MinDate || !req.body.TimePeriod) {
        res.status(400).send({
            success: false,
            message: "Either Date or TimePeriod is missing",
            data: null
        })
    }

    var query = `
    SELECT DISTINCT T.WorkItemKey "Key", T.TaskId, T.TaskName "TaskDescription",TS.StatusText "Status", 
    E.FullName "AssignedTo", WL.EntryDate "CompletionDate"
    FROM work_log WL, task T,workitem_status TS,employee E,project P,task_type TT 
    WHERE WL.TaskId = T.TaskId 
    AND T.WorkitemStatusId = TS.WorkitemStatusId
    AND TS.StatusText IN ('Task Complete', 'Review Complete')
    AND WL.EntryDate = (SELECT MAX(WL2.EntryDate) FROM work_log WL2 WHERE WL2.TaskId = WL.TaskId) 
    AND WL.EntryDate BETWEEN '${req.body.MinDate}' AND '${req.body.MaxDate}'
    AND T.AssigneeId = E.EmployeeId
    AND T.ProjectId = P.ProjectId
    AND T.TaskTypeId = TT.TaskTypeId
    AND TT.TaskTypeName NOT IN ('Bug Fix')
    AND T.ProjectId = '${req.body.ProjectId}'
    ORDER BY T.WorkItemKey, T.TaskTypeId,T.WorkitemStatusId;

    SELECT WorkItemKey "Key", TaskId "TaskId", TaskName "TaskDescription",Status,Assignee "AssignedTo",
    SUM(EffortSpent) "TotalEffortSpent",
    RemainingEffort, TaskType 
    FROM v_task_in_progress v
    WHERE EXISTS (SELECT wl.EntryDate FROM work_log wl WHERE wl.TaskId = v.TaskId 
    AND wl.EntryDate BETWEEN '${req.body.MinDate}' AND '${req.body.MaxDate}')
    AND v.TaskType NOT IN ('Bug Fix')
    AND v.ProjectId = '${req.body.ProjectId}'
    GROUP BY v.TaskId
    ORDER BY v.WorkItemKey, v.TaskType;
    
    SELECT P.ProjectCode,T.WorkItemKey, T.TaskId
    FROM work_log WL, task T,workitem_status TS,project P,task_type TT 
    WHERE WL.TaskId = T.TaskId 
    AND T.WorkitemStatusId = TS.WorkitemStatusId
    AND TS.StatusText IN ('Review Complete','Task Complete')
    AND WL.EntryDate = (SELECT MAX(WL2.EntryDate) FROM work_log WL2 WHERE WL2.TaskId = WL.TaskId) 
    AND WL.EntryDate BETWEEN '${req.body.MinDate}' AND '${req.body.MaxDate}'
    AND T.ProjectId = P.ProjectId
    AND T.TaskTypeId = TT.TaskTypeId
    AND TT.TaskTypeName = 'Bug Fix'
    AND T.ProjectId = '${req.body.ProjectId}'
    ORDER BY T.WorkItemKey, T.TaskTypeId,T.WorkitemStatusId;

    SELECT  Distinct  v.ProjectCode, v.WorkItemKey, v.TaskId, v.TaskType
    FROM v_task_in_progress v
    WHERE EXISTS (SELECT wl.EntryDate FROM work_log wl WHERE wl.TaskId = v.TaskId 
    AND wl.EntryDate BETWEEN '${req.body.MinDate}' AND '${req.body.MaxDate}')
    AND v.TaskType ='Bug Fix'
    AND v.ProjectId = '${req.body.ProjectId}'
    ORDER BY v.WorkItemKey, v.TaskType;
    `

    console.log(query);
    connection.query(query, function (obj) {
        res.status(200).send({
            status: true,
            message: "",
            data: buildProjectData(obj.response, req.body.TimePeriod)
        })
    })
}

function buildProjectData(data, TimePeriod) {
    var responseObj = [], headerText = "";
    if (TimePeriod == "W")
        headerText = "This Week"
    else if (TimePeriod == "LW")
        headerText = "Last Week"
    else if (TimePeriod == "M")
        headerText = "This Month"
    else
        headerText = "Last Month"

    responseObj[0] = {
        headerText: "Completed " + headerText,
        data: data[0]
    }

    responseObj[1] = {
        headerText: "Worked On " + headerText,
        data: data[1]
    }

    responseObj[2] = {
        headerText: "Fixed " + headerText,
        data: data[2]
    }

    responseObj[3] = {
        headerText: "Worked On " + headerText,
        data: data[3]
    }

    return responseObj;
}


exports.project_resolved_status_report = (req, res) => {
    // console.log(req.body);
    if (!req.body.ProjectId) {
        res.status(400).send({
            success: false,
            message: "Project Id is missing",
            data: null
        })
    }

    if (!req.body.MaxDate || !req.body.MinDate || !req.body.TimePeriod) {
        res.status(400).send({
            success: false,
            message: "Either Date or TimePeriod is missing",
            data: null
        })
    }

    var query = ` SELECT t.TaskId, t.TaskTypeId, t.TaskName, tt.TaskTypeName , t.CreatedDateTime
    FROM sepm_prod.task t join sepm_prod.task_type tt on t.TaskTypeId = tt.TaskTypeId 
    where t.ProjectId = '${req.body.ProjectId}' and t.CreatedDateTime between '${req.body.MinDate}' and '${req.body.MaxDate}';
    SELECT tsh.TaskId, t.TaskTypeId,  t.TaskName, t.ProjectId, tsh.UpdatedTime, tsh.WorkItemStatusId 
    FROM sepm_prod.task_status_history tsh
    join sepm_prod.task t on tsh.TaskId = t.TaskId  
    where t.ProjectId ='${req.body.ProjectId}'and tsh.WorkItemStatusId in (6,8) and tsh.UpdatedTime between '${req.body.MinDate}' and '${req.body.MaxDate}';
    `

    console.log(query);
    connection.query(query, function (obj) {
        res.status(200).send({
            status: true,
            message: "Success",
            data: buildResolvedProjectData(obj.response)
        })
    })
}


function buildResolvedProjectData(data) {
    var responseObj = [];
    var list1 = data[0];
    var list2 = data[1];
    console.log(list1.length, list2.length);
    var Tasktypes = list1.filter((currentValue, index, array) => array.findIndex(t => (t.TaskTypeId === currentValue.TaskTypeId))
        === index).map(item => item.TaskTypeId);

    for (item of Tasktypes)
        responseObj.push({
            taskTypeId: item,
            category: '',
            created: 0,
            resolved: 0
        })



    list1.forEach(list_item => {

        responseObj.forEach(res_item => {
            if (res_item.taskTypeId == list_item.TaskTypeId) {
                res_item.created++;
                res_item.category = list_item.TaskTypeName;
            }

        })
    })

    list2.forEach(list_item => {

        responseObj.forEach(res_item => {
            if (res_item.taskTypeId == list_item.TaskTypeId) {
                res_item.resolved++;

            }
        })
    })
    console.log(responseObj);
    return responseObj;
}


exports.workitem_agingReport = (req, res) => {
    console.log(req.query);
    if (!req.query.ProjectId) {
        return res.status(400).send({
            success: false,
            message: "Please provide a project id",
            data: null
        })
    }
    var whereClause = req.query.ClosedItems == 'true' ? 'AND t.WorkitemStatusId not in (9,10,11)' : 'AND t.WorkitemStatusId not in (6,8,9,10,11)';

    let query = '';

    query = `SELECT t.TaskId, t.TaskName, ws.StatusText, t.ProjectId, p.ProjectCode, t.WorkItemKey, 
    t.TaskTypeId, t.TaskPriorityId, t.CreatedDateTime, t.WorkitemStatusId
    FROM sepm_prod.task t join sepm_prod.project p on t.ProjectId = p.ProjectId join 
    workItem_status ws on t.WorkitemStatusId = ws.WorkitemStatusId where t.ProjectId = '${req.query.ProjectId}' 
     ${whereClause};`

    console.log(query)
    connection.query(query, function (obj) {
        res.status(200).send({
            status: true,
            message: "",
            data: obj.response
        })
    })
}

exports.workitem_mappingReport = (req, res) => {
    console.log(req.query);
    if (!req.query.ProjectId) {
        return res.status(400).send({
            success: false,
            message: "Please provide a project id",
            data: null
        })
    }

    let listQuery = `SELECT sr.*,p.*,fa.FunctionalAreaId,fa.Description AS "FunctionalAreaDescription",fa.FunctionalAreaCode,
    t.*,ws.WorkitemStatusId,ws.StatusText AS "WorkItemStatus",tp.TaskPriorityId,tp.PriorityText
    FROM system_requirement sr 
    JOIN project p ON sr.ProjectId=p.ProjectId
    JOIN functional_area fa ON sr.FunctionalAreaId = fa.FunctionalAreaId
    JOIN system_requirement_workitem_map srwm ON sr.SystemRequirementId = srwm.SystemRequirementId
    JOIN task t ON srwm.TaskId = t.TaskId
    JOIN workitem_status ws ON t.WorkitemStatusId = ws.WorkitemStatusId
    JOIN task_priority tp ON t.TaskPriorityId = tp.TaskPriorityId
    WHERE sr.ProjectId = '${req.query.ProjectId}' 
     ${whereClause};`

    console.log(listQuery)
    connection.query(listQuery, function (obj) {
        res.status(200).send({
            status: true,
            message: "",
            data: obj.response
        })
    })

}


exports.activity_report = (req, res) => {
    if (!req.query.ProjectId) {
        return res.status(400).send({
            success: false,
            message: "ProjectId is required",
            data: null
        })
    }

    let assigneeClause = req.query.AssigneeId ? `WHERE t.AssigneeId = ${req.query.AssigneeId} ` : ``;

    // current sprint
    let query = `SELECT t.*, ws.*, tp.*, tt.*, p.* 
                    FROM task t 
                    JOIN project p ON t.ProjectId = p.ProjectId
                    JOIN task_iteration_map tim ON tim.TaskId = t.TaskId
                    JOIN project_cycle pc ON tim.IterationId = pc.ProjectCycleId
                    JOIN workitem_status ws ON t.WorkitemStatusId = ws.WorkitemStatusId
                    JOIN task_priority tp ON t.TaskPriorityId = tp.TaskPriorityId
                    JOIN task_type tt ON t.TaskTypeId = tt.TaskTypeId
                    ${assigneeClause}
                    AND pc.ActualStartDate <= NOW() AND pc.ActualEndDate IS NULL 
                    AND t.ProjectId = ${req.query.ProjectId}`;

    connection.query(query, function (obj) {
        return res.status(200).send({
            success: true,
            message: "",
            data: obj.response
        })
    })

}



