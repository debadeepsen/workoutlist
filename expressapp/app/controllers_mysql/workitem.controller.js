const connection = require("./mysql.controller");
const uuid = require('uuid-random');
const ENCRYPTION_KEY = "SEPM_ENCRYPTION_KEY";

const MAIN_QUERY = `SELECT 
p.ProjectName, p.ProjectCode,
it.ProjectCycleNumber,it.ProjectCycleId,it.ActualStartDate,it.Duration,it.PlannedEndDate,it.ActualEndDate,it.ProjectCycleTypeName,
ea.FullName AssigneeFullName,
er.FullName ReportedByFullName,
erv.FullName ReviewerFullName,
tt.TaskTypeName, tt.IconClass,
tp.PriorityText, tp.PriorityIcon, tp.PriorityColor,
tpar.TaskId ParentTaskId, tpar.TaskName ParentTaskName,tpar.WorkItemKey ParentWorkItemKey , CONCAT(p.ProjectCode, '-', tpar.WorkItemKey) ParentKey,
ts.StatusText, ts.IsWorklogItem, ts.IsOpenStatus, ts.IsInProgressStatus, ts.NextStatusId, ts.StatusIconClass AS StatusIconClass,
ec.FullName CreatorFullName,
elu.FullName LastEditorFullName,fa.Description,fa.FunctionalAreaCode,sr.Remarks StatusRemarks,sr.StatusRemarkId,  
t.*
FROM task t
JOIN project p ON t.ProjectId = p.ProjectId
JOIN employee er ON t.ReportedBy = er.EmployeeId
JOIN employee ec ON t.CreatedBy = ec.EmployeeId
JOIN employee elu ON t.CreatedBy = elu.EmployeeId
JOIN task_type tt ON t.TaskTypeId = tt.TaskTypeId
JOIN task_priority tp ON t.TaskPriorityId = tp.TaskPriorityId
LEFT JOIN employee ea ON t.AssigneeId = ea.EmployeeId
LEFT JOIN employee erv ON t.ReviewerId = erv.EmployeeId
LEFT JOIN functional_area fa ON t.FunctionalAreaId = fa.FunctionalAreaId
LEFT JOIN workitem_status ts ON t.WorkitemStatusId = ts.WorkitemStatusId
LEFT JOIN task tpar ON tpar.TaskId = t.ParentTaskId
LEFT JOIN status_remarks sr ON sr.TaskId = t.TaskId
LEFT JOIN
(SELECT pc.ProjectCycleNumber,pc.ProjectCycleId,pc.ActualStartDate,pc.Duration,pc.PlannedEndDate,pc.ActualEndDate,ptm.ProjectCycleTypeName, tim.TaskId from task_iteration_map tim JOIN project_cycle pc ON tim.IterationId = pc.ProjectCycleId
JOIN project_cycle_type_master ptm ON pc.ProjectCycleTypeId = ptm.ProjectCycleTypeId) it  ON t.TaskId = it.TaskId`;

// full list of all work items
exports.workitem_list = (req, res) => {
    let query = MAIN_QUERY + " WHERE 1=1";
    if (req.query.OrganizationId) {
        query =
            MAIN_QUERY + " WHERE p.OrganizationId = " + req.query.OrganizationId;
    }

    console.log(query);

    connection.query(query + search_by(req) + order_by(req), function (obj) {
        if (obj.error) {
            return res.status(400).send({
                success: false,
                message: "An unexpected error occurred",
                data: obj.response,
            });
        }

        res.send({
            success: obj.error == null,
            message: "success",
            data: build_list(obj.response),
        });
    });
};

// full list of all work items, after filtered search
exports.workitem_list_filtered = (req, res) => {
    // console.log(req.body);
    let query = MAIN_QUERY + " WHERE 1=1";
    if (req.query.OrganizationId) {
        console.log("Inside if");
        query =
            MAIN_QUERY + " AND p.OrganizationId = " + req.query.OrganizationId;
    }

    console.log(query + filter_by(req) + order_by(req));

    connection.query(query + filter_by(req) + order_by(req), function (obj) {
        if (obj.error) {
            return res.status(400).send({
                success: false,
                message: "An unexpected error occurred",
                data: obj.response,
            });
        }

        res.send({
            success: obj.error == null,
            message: "success",
            data: build_list(obj.response),
        });
    });
};

// full list of all work items, by assignee
exports.workitem_list_by_assignee = (req, res) => {
    connection.query(
        MAIN_QUERY +
        " WHERE t.AssigneeId = " +
        req.params.assigneeId +
        search_by(req) +
        order_by(req),
        function (obj) {
            /*
            console.log({
                error: obj.error,
                res: obj.response,
            });
            */

            if (obj.error) {
                return res.status(400).send({
                    success: false,
                    message: "Bad request",
                    data: obj.response,
                });
            }

            console.log("");
            console.log("SUCCESS");
            console.log("");

            res.send({
                success: obj.error == null,
                message: "success",
                data: build_list(obj.response),
            });
        }
    );
};

// full list of all work items, by assignee
// for mobile, we are sending a further filtered list
exports.workitem_list_by_assignee_mobile = (req, res) => {
    connection.query(
        MAIN_QUERY +
        " WHERE t.AssigneeId = " +
        req.params.assigneeId +
        " AND (ts.IsOpenStatus = 'Y' OR ts.IsInProgressStatus = 'Y') " +
        search_by(req) +
        order_by(req),
        function (obj) {
            /*
            console.log({
                error: obj.error,
                res: obj.response,
            });
            */

            if (obj.error) {
                return res.status(400).send({
                    success: false,
                    message: "Bad request",
                    data: obj.response,
                });
            }

            console.log("");
            console.log("SUCCESS");
            console.log("");

            res.send({
                success: obj.error == null,
                message: "success",
                data: build_list(obj.response),
            });
        }
    );
};

// full list of all work items, by assignee's projects
exports.workitem_list_by_assignee_projects = (req, res) => {
    if (!req.params.assigneeId) {
        return res.status(400).send({
            success: false,
            message: "assignee is required",
            data: obj.response,
        });
    }

    connection.query(
        MAIN_QUERY +
        ` WHERE t.ProjectId IN (SELECT ProjectId FROM project_employee_map WHERE EmployeeId = ${req.params.assigneeId})` +
        search_by(req) +
        order_by(req),
        function (obj) {
            if (obj.error) {
                return res.status(400).send({
                    success: false,
                    message: "An unexpected error occurred",
                    data: obj.response,
                });
            }

            res.send({
                success: obj.error == null,
                message: "success",
                data: build_list(obj.response),
            });
        }
    );
};

// full list of all work items, by assignee's projects
exports.workitem_list_by_project_code = (req, res) => {
    if (!req.params.projectCode) {
        return res.status(400).send({
            success: false,
            message: "projectCode is required",
            data: obj.response,
        });
    }

    var andClause = ``;

    if (req.query.AssigneeId) {
        andClause += ` AND t.AssigneeId = ${req.query.AssigneeId}`;
    }

    if (req.query.ReportedBy) {
        andClause += ` AND t.ReportedBy = ${req.query.ReportedBy}`;
    }

    connection.query(
        MAIN_QUERY +
        ` WHERE p.ProjectCode = '${req.params.projectCode}' ${andClause}` +
        search_by(req) +
        order_by(req),
        function (obj) {
            if (obj.error) {
                return res.status(500).send({
                    success: false,
                    message: "An unexpected error occurred",
                    data: obj.response,
                });
            }

            res.send({
                success: obj.error == null,
                message: "success",
                data: build_list(obj.response),
            });
        }
    );
};

// work item details, by id
exports.workitem_by_id = (req, res) => {
    console.log(WORKITEM_DETAILS_QUERY + " WHERE t.TaskId = " + req.params.workItemId);

    connection.query(
        MAIN_QUERY + " WHERE t.TaskId = " + req.params.workItemId,
        function (obj) {
            // console.log({ WorkItem: obj.response[0] });

            if (obj.error) {
                return res.status(400).send({
                    success: false,
                    message: "An unexpected error occurred",
                    data: obj.response,
                });
            }

            let full_workitem = obj.response[0];
            let mgrQuery = `SELECT pem.EmployeeId ManagerId FROM
                        (SELECT * FROM task WHERE TaskId = ${req.params.workItemId}) t
                        LEFT JOIN project_employee_map pem ON t.ProjectId = pem.ProjectId
                        WHERE pem.ProjectRoleId = 1`;

            console.log(mgrQuery);

            connection.query(mgrQuery, function (objMgr) {
                // console.log({ objMgr });

                if (objMgr.response && objMgr.response.length)
                    full_workitem.ManagerId = objMgr.response[0].ManagerId;
                else full_workitem.ManagerId = null;

                // console.log({ full_workitem });

                connection.query(
                    `SELECT IFNULL( SUM(Hours) , 0 ) S FROM work_log w WHERE w.TaskId = ${req.params.workItemId}`,
                    function (objW) {
                        full_workitem.EffortSpent = objW.response[0].S;

                        connection.query(
                            `SELECT TaskId, TaskName FROM task WHERE ParentTaskId = ${req.params.workItemId}`,
                            function (objSubitems) {
                                connection.query(
                                    `SELECT FileURL FROM task_files WHERE TaskId = ${req.params.workItemId} and Deleted='N' `,
                                    function (objFiles) {
                                        full_workitem.attachments = [];
                                        objFiles.response.forEach((e) => {
                                            full_workitem.attachments.push(e.FileURL);
                                        });

                                        // console.log(full_workitem);

                                        res.send({
                                            success: obj.error == null && objSubitems.error == null,
                                            message: "success",
                                            data: {
                                                workitem: [full_workitem],
                                                subitems: objSubitems.response,
                                            },
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            });
        }
    );
};

exports.reported_by_me = (req, res) => {
    if (!req.params.reportedBy) {
        return res.status(400).send({
            success: false,
            message: "ReportedBy is required",
            data: null,
        });
    }
    var query =
        MAIN_QUERY +
        ` WHERE t.ReportedBy = ${req.params.reportedBy}` +
        search_by(req) +
        order_by(req);
    connection.query(query, function (obj) {
        if (obj.error) {
            return res.status(500).send({
                success: false,
                message: "An unexpected error occurred",
                data: obj.response,
            });
        }

        res.send({
            success: obj.error == null,
            message: "success",
            data: build_list(obj.response),
        });
    });
};

exports.list_by_project_id = (req, res) => {
    if (!req.params.projectId) {
        return res.status(400).send({
            success: false,
            message: "projectId is required",
            data: null,
        });
    }
    var query =
        MAIN_QUERY +
        ` WHERE t.ProjectId = ${req.params.projectId}` +
        search_by(req) +
        order_by(req);
    console.log(query);
    connection.query(query, function (obj) {
        if (obj.error) {
            return res.status(500).send({
                success: false,
                message: "An unexpected error occurred",
                data: obj.response,
            });
        }

        res.send({
            success: obj.error == null,
            message: "success",
            data: build_list(obj.response),
        });
    });
};

//workitems under a project manager

exports.workitem_under_manager = (req, res) => {
    if (!req.params.employeeId) {
        return res.status(400).send({
            success: false,
            message: "Employee Id is required",
            data: obj.response,
        });
    }

    connection.query(
        MAIN_QUERY +
        ` WHERE t.ProjectId IN (SELECT ProjectId FROM project_employee_map WHERE EmployeeId = ${req.params.employeeId} AND ProjectRoleId = "1")` +
        search_by(req) +
        order_by(req),
        function (obj) {
            if (obj.error) {
                return res.status(400).send({
                    success: false,
                    message: "An unexpected error occurred",
                    data: obj.response,
                });
            }

            res.send({
                success: obj.error == null,
                message: "success",
                data: build_list(obj.response),
            });
        }
    );
};

// Utility function, to group by project
function build_list(workitems) {
    var return_list = [];

    workitems.forEach((e) => {
        var project_obj = return_list.find((x) => x.ProjectId == e.ProjectId);

        if (!project_obj) {
            return_list.push({
                ProjectId: e.ProjectId,
                ProjectName: e.ProjectName,
                ProjectCode: e.ProjectCode,
                WorkItems: [e],
            });
        } else {
            project_obj.WorkItems.push(e);
        }
    });

    return return_list;
}

// Task Complete Changes Status
exports.change_taskComplete_status = (req, res) => {
    let query = `SELECT * FROM task WHERE TaskId = ${req.body.TaskId}`;

    connection.query(query, function (obj) {
        let assigneeId = obj.response[0].ReportedBy;
        let taskTypeId = obj.response[0].TaskTypeId;
        console.log("assigneeId" + assigneeId);
        let crupQuery = ``;
        if (taskTypeId == 1 || taskTypeId == 3 || taskTypeId == 4) {
            crupQuery = `UPDATE task SET
                        TaskStatusId ='${5}',
                        AssigneeId ='${assigneeId}'
                        WHERE  TaskId = ${req.body.TaskId}`;
        } else {
            crupQuery = `UPDATE task SET
                        TaskStatusId ='${15}',
                        AssigneeId ='${assigneeId}'
                        WHERE  TaskId = ${req.body.TaskId}`;
        }
        console.log("crupQuery ==>" + crupQuery);
        connection.query(crupQuery, function (obj) {
            res.send({
                success: obj.error == null,
                message: obj.error || `Success`,
                data: obj.response,
            });
        });
    });
};

exports.mark_complete = (req, res) => {
    // two things are going to happen here

    // first, we'll reassign the WI to whoever the reviewer should be
    // in case of the status being "review complete", we'll ignore this part

    if (!req.body.WorkItem) {
        return res.status(400).send({
            success: false,
            message: "WorkItem is required",
            data: null,
        });
    }

    var workItem = req.body.WorkItem;

    var reviewerId = workItem.ReportedBy;

    // assign this WI to them
    var assignQuery = `UPDATE task SET AssigneeId = ${reviewerId} WHERE TaskId = ${workItem.TaskId};`;
    console.log(assignQuery);

    connection.query(assignQuery, function (objAssign) {
        if (objAssign.error) {
            return res.status(400).send({
                success: false,
                message: objAssign.error,
                data: objAssign.response,
            });
        }

        // step 2: change the status of the work item
        var statusQuery = `UPDATE task SET TaskStatusId = ${workItem.NextStatusId} WHERE TaskId = ${workItem.TaskId}`;
        console.log(statusQuery);

        // var fullQuery = assignQuery + statusQuery;

        connection.query(statusQuery, function (objStatus) {
            if (objStatus.error) {
                return res.status(400).send({
                    success: false,
                    message: objStatus.error,
                    data: objStatus.response,
                });
            }

            // step 3: mark the remaining time for this WI as zero (since it's been completed)

            var remainingEffortQuery = `UPDATE task SET RemainingEffort = 0 WHERE TaskId = ${workItem.TaskId}`;

            connection.query(remainingEffortQuery, function (objRemEffort) {
                if (objRemEffort.error) {
                    return res.status(400).send({
                        success: false,
                        message: objRemEffort.error,
                        data: objRemEffort.response,
                    });
                }

                return res.send({
                    success: true,
                    message: "",
                    data: {
                        status: objStatus.response,
                        assign: objAssign.response,
                    },
                });
            });
        });
    });
};

exports.getGenericTasks = (req, res) => {
    var query = `SELECT * FROM generic_tasks WHERE Deleted <> 'Y' ORDER BY GenericTaskName`;

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: "Success",
            data: sortAlphabeticalOrder(obj.response),
        });
    });
};

exports.getGenericTasksByProjectId = (req, res) => {
    var query = ``;
    if (req.params.projetId == 0) {
        query = `SELECT * FROM generic_tasks WHERE GenericTaskId in (5,6,7,8) AND Deleted <> 'Y';`;
    } else {
        query = `SELECT * FROM generic_tasks WHERE GenericTaskId not in (5,6,7,8) AND Deleted <> 'Y';`;
    }

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: "Success",
            data: sortAlphabeticalOrder(obj.response),
        });
    });
};

exports.getWorkItemHistory = (req, res) => {
    var query = `SELECT t.*, ts.StatusText, e.FullName FROM 
                (SELECT tah.TaskId, tah.EmployeeId, NULL AS 'WorkitemStatusId', tah.UpdatedTime FROM task_assignment_history tah 
                WHERE tah.TaskId = ${req.params.workItemId}
                UNION 
                SELECT tsh.TaskId, NULL AS 'EmployeeId', tsh.WorkitemStatusId, tsh.UpdatedTime FROM task_status_history tsh 
                WHERE tsh.TaskId = ${req.params.workItemId}) t 
                LEFT JOIN workitem_status ts ON t.WorkitemStatusId = ts.WorkitemStatusId
                LEFT JOIN employee e ON t.EmployeeId = e.EmployeeId
                ORDER BY t.UpdatedTime`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || "Success",
            data: obj.response,
        });
    });
};

function order_by(req) {
    if (!req.query.sortBy) return ` ORDER BY p.ProjectCode ASC, TaskId ASC`;
    if (!req.query.sortDirection)
        return ` ORDER BY p.ProjectCode ASC, ${req.query.sortBy} ASC`;
    return ` ORDER BY p.ProjectCode ASC, ${req.query.sortBy} ${req.query.sortDirection}`;
}

function search_by(req) {
    if (!req.query.searchBy || !req.query.searchText) return ``;

    var map = {
        WorkItemKey: "t.WorkItemKey",
        TaskTypeName: "tt.TaskTypeName",
        TaskName: "t.TaskName",
        IterationNumber: "it.IterationNumber",
        TaskPriorityId: "tp.PriorityText",
        AssigneeFullName: "ea.FullName",
        StatusText: "ts.StatusText",
        ReportedByFullName: "er.FullName",
    };

    var searchText = req.query.searchText.replace(/'/g, "\\'");

    var returnText = ` AND ${map[req.query.searchBy]} LIKE '%${searchText}%'`;

    return returnText;
}

function filter_by(req) {
    var filterObj = req.body;

    var filterClause = ``;

    if (filterObj.statuses && filterObj.statuses.length) {
        var statusList = "(" + filterObj.statuses.join() + ")";
        filterClause += ` AND t.WorkitemStatusId IN ${statusList}`;

        // console.log({ filterObj });

        if (filterObj.statuses.includes("-1") || filterObj.statuses.includes(-1))
            filterClause = ` AND (ts.IsOpenStatus = 'Y' OR ts.IsInProgressStatus = 'Y') AND ts.StatusText <> 'Review Complete'`;
    }

    if (filterObj.projects && filterObj.projects.length) {
        var projectList = "(" + filterObj.projects.join() + ")";
        filterClause += ` AND t.ProjectId IN ${projectList}`;
    }

    if (filterObj.ReportedBy) {
        filterClause += ` AND er.FullName LIKE '%${filterObj.ReportedBy}%'`;
    }

    if (filterObj.Assignee) {
        filterClause += ` AND ea.FullName LIKE '%${filterObj.Assignee}%'`;
    }

    if (filterObj.WorkItemKey) {
        if (filterObj.WorkItemKey.includes(",")) {
            filterClause += ` AND t.WorkItemKey IN (${filterObj.WorkItemKey})`;
        }
        else if (filterObj.WorkItemKey.includes("-")) {
            let min = filterObj.WorkItemKey.split("-")[0];
            let max = filterObj.WorkItemKey.split("-")[1];

            filterClause += ` AND t.WorkItemKey >= ${min} AND t.WorkItemKey <= ${max}`;
        }
        else {
            filterClause += ` AND t.WorkItemKey LIKE '%${filterObj.WorkItemKey}%'`;
        }
    }

    if (filterObj.TaskName) {
        filterClause += ` AND t.TaskName LIKE '%${filterObj.TaskName}%'`;
    }

    if (filterObj.FunctionalArea) {
        filterClause += ` AND (fa.Description LIKE '%${filterObj.FunctionalArea}%' OR fa.FunctionalAreaCode LIKE '%${filterObj.FunctionalArea}%')`;
    }

    if (filterObj.ProjectCycle) {
        filterClause += ` AND it.ProjectCycleNumber LIKE '%${filterObj.ProjectCycle}%'`;
    }

    if (filterObj.ReportedMinDate && filterObj.ReportedMaxDate) {
        filterClause += ` AND t.CreatedDateTime BETWEEN '${filterObj.ReportedMinDate} 00:00:00' AND '${filterObj.ReportedMaxDate} 23:59:59' `;
    }

    // if (filterObj.CompletedMinDate && filterObj.CompletedMaxDate) {
    //     filterClause += ` AND tsh.WorkitemStatusId ='8' AND tsh.UpdatedTime BETWEEN '${filterObj.CompletedMinDate}' AND '${filterObj.CompletedMaxDate}' `;
    // }

    if (filterObj.types && filterObj.types.length) {
        var typeList = "(" + filterObj.types.join() + ")";
        filterClause += ` AND t.TaskTypeId IN ${typeList}`;
    }

    if (filterObj.priorities && filterObj.priorities.length) {
        var priorityList = "(" + filterObj.priorities.join() + ")";
        filterClause += ` AND t.TaskPriorityId IN ${priorityList}`;
    }

    console.log("FILTERCLAUSE: " + filterClause);

    return filterClause;
}

// This API used to changed WI assigneeId
exports.select_new_assignee = (req, res) => {
    let query = `Update task SET AssigneeId=${req.body.EmployeeId} 
    Where ProjectId=${req.body.ProjectId} AND TaskId=${req.body.TaskId}`;

    console.log(query);
    connection.query(query, function (obj) {
        return res.status(200).send({
            success: true,
            message: null,
            data: obj.response,
        });
    });
};

// fetch a work item id by key
exports.get_id_by_key = (req, res) => {
    let query = `SELECT t.TaskId FROM task t 
                JOIN project p ON t.ProjectId = p.ProjectId
                WHERE t.WorkItemKey = '${req.query.WorkItemKey}'
                AND p.ProjectCode = '${req.query.ProjectCode}'`;

    console.log(query);
    connection.query(query, function (obj) {
        return res.status(200).send({
            success: true,
            message: null,
            data: obj.response,
        });
    });
};

// Filter Prent Item
exports.filter_parent_items_list_by_org = (req, res) => {
    if (!req.params.OrganizationId) {
        return res.status(400).send({
            success: false,
            message: `OrganizationId is required`,
            data: null,
        });
    }

    let query = `SELECT t.*,p.* FROM task t JOIN project p ON t.ProjectId = p.ProjectId
               AND p.OrganizationId = ${req.params.OrganizationId}
               AND t.ProjectId = ${req.query.ProjectId}
               AND (t.TaskName LIKE '%${req.query.textName}%'  
                  OR t.WorkItemKey LIKE '%${req.query.textName}%')   
                  ORDER BY p.ProjectCode, t.WorkItemKey `;

    console.log(query);

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response,
        });
    });
};

// Get Project wise Default assignee

exports.get_default_assignee = (req, res) => {
    let query = `SELECT DefaultAssigneeId FROM project where ProjectId = ${req.params.ProjectId}`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response,
        });
    });
};

//change work item  status best on taskId
exports.changeWorkitemStatus = (req, res) => {
    let crupQuery = `UPDATE task set 
                    WorkitemStatusId ='${req.body.WorkitemStatusId}',
                    AssigneeId = '${req.body.AssigneeId}',
                    LastUpdatedBy = '${req.body.LastUpdatedBy}'
                    where TaskId =${req.body.TaskId}`;
    console.log(crupQuery);
    connection.query(crupQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response,
        });
    });
};

//Reviewer Reject WOrkitem
exports.chenge_reject_workItem = (req, res) => {
    let query = `SELECT th.* FROM task_assignment_history th WHERE th.TaskId =${req.body.TaskId} 
                 ORDER BY th.TaskAssignmentId DESC LIMIT 0,2`;

    connection.query(query, function (obj) {
        if (obj.response.length != 0) {
            var AssigneeId = obj.response[obj.response.length - 1].EmployeeId;
            console.log("Data is " + AssigneeId);

            var AssigneeId = obj.response[obj.response.length - 1].EmployeeId;
            console.log(AssigneeId);

            let crupQuery = `UPDATE task set 
                        WorkitemStatusId ='${req.body.WorkitemStatusId}',
                        LastUpdatedBy = '${req.body.LastUpdatedBy}',
                        AssigneeId = '${AssigneeId}'
                        where TaskId =${req.body.TaskId}`;
            console.log(crupQuery);

            connection.query(crupQuery, function (obj) {
                res.send({
                    success: obj.error == null,
                    message: obj.error || `Success`,
                    data: obj.response,
                });
            });
        } else {
            return res.status(400).send({
                success: false,
                message:
                    "Original assignee cannot be found. Please edit or re-assign this work item",
                data: null,
            });
        }
    });
};

exports.save_review_comments = (req, res) => {
    let query = `SELECT th.* FROM task_assignment_history th WHERE th.TaskId =${req.body.WorkitemId} 
                 ORDER BY th.TaskAssignmentId DESC LIMIT 0,2`;

    connection.query(query, function (obj) {
        if (obj.response.length != 0) {
            var AssigneeId = obj.response[obj.response.length - 1].EmployeeId;
            console.log("Data is " + AssigneeId);

            let crupQuery = `INSERT INTO review_comment (WorkItemId,AssigneeId,ReviewerId,Comments,CreatedBy)
                            VALUES('${req.body.WorkitemId}',
                                    '${AssigneeId}',
                                    '${req.body.ReviewerId}',
                                    '${req.body.Comments.replace(/'/g, "\\'")}',
                                    '${req.body.CreatedBy}')`;
            console.log(crupQuery);

            connection.query(crupQuery, function (obj) {
                res.send({
                    success: obj.error == null,
                    message: obj.error || `Success`,
                    data: obj.response,
                });
            });
        } else {
            return res.status(400).send({
                success: false,
                message:
                    "Original assignee cannot be found. Please edit or re-assign this work item",
                data: null,
            });
        }
    });
};

exports.get_review_comments = (req, res) => {
    if (!req.query.WorkItemId) {
        return res.status(400).send({
            success: false,
            message: 'WorkItemId is required.',
            data: null,
        });
    }

    let query = `SELECT rc.*, ea.FullName AssigneeFullName, er.FullName ReviewerFullName
                    FROM review_comment rc
                    JOIN employee ea ON rc.AssigneeId = ea.EmployeeId
                    JOIN employee er ON rc.ReviewerId = er.EmployeeId
                    WHERE rc.WorkItemId =${req.query.WorkItemId}  Order By rc.ReviewCommentId desc `;

    connection.query(query, function (obj) {
        res.status(200).send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response,
        });
    });
};

// get task Project Cycle Map list items

exports.list_by_ProjectCycle_map = (req, res) => {
    if (!req.query.ProjectId) {
        return res.status(400).send({
            success: false,
            message: "projectId is required",
            data: null,
        });
    }
    var query =
        MAIN_QUERY +
        ` WHERE t.ProjectId = ${req.query.ProjectId} AND it.ProjectCycleId = ${req.query.ProjectCycleId}` +
        search_by(req) +
        order_by(req);
    console.log(query);
    connection.query(query, function (obj) {
        if (obj.error) {
            return res.status(500).send({
                success: false,
                message: "An unexpected error occurred",
                data: obj.response,
            });
        }

        res.send({
            success: obj.error == null,
            message: "success",
            data: build_list(obj.response),
        });
    });
};

exports.filter_ProjectCycle_list_by_project_id = (req, res) => {
    if (!req.query.ProjectId) {
        return res.status(400).send({
            success: false,
            message: "projectId is required",
            data: null,
        });
    }
    var query =
        MAIN_QUERY +
        ` WHERE t.ProjectId = ${req.query.ProjectId} 
    AND  (t.TaskName LIKE '%${req.query.textName}%' OR tp.PriorityText LIKE '%${req.query.textName}%' 
    OR ts.StatusText LIKE '%${req.query.textName}%' OR t.WorkItemKey LIKE '%${req.query.textName}%'
    OR t.AssigneeId IN(SELECT EmployeeId FROM employee Where FullName LIke '%${req.query.textName}%'))
    ` +
        search_by(req) +
        order_by(req);

    console.log(query);
    connection.query(query, function (obj) {
        if (obj.error) {
            return res.status(500).send({
                success: false,
                message: "An unexpected error occurred",
                data: obj.response,
            });
        }

        res.send({
            success: obj.error == null,
            message: "success",
            data: build_list(obj.response),
        });
    });
};


// Filter Project Cycle List
exports.filter_ProjectCycle_list_by_projectCycle_id = (req, res) => {

    if (!req.query.ProjectId) {
        return res.status(400).send({
            success: false,
            message: "projectId is required",
            data: null,
        });
    }
    var query =
        MAIN_QUERY +
        ` WHERE t.ProjectId = ${req.query.ProjectId} AND it.ProjectCycleId = ${req.query.ProjectCycleId}
        AND  (t.TaskName LIKE '%${req.query.textName}%' OR tp.PriorityText LIKE '%${req.query.textName}%' 
        OR ts.StatusText LIKE '%${req.query.textName}%' OR t.WorkItemKey LIKE '%${req.query.textName}%'
        OR t.AssigneeId IN(SELECT EmployeeId FROM employee Where FullName LIke '%${req.query.textName}%'))
         ` +
        search_by(req) +
        order_by(req);

    console.log(query);
    connection.query(query, function (obj) {
        if (obj.error) {
            return res.status(500).send({
                success: false,
                message: "An unexpected error occurred",
                data: obj.response,
            });
        }

        res.send({
            success: obj.error == null,
            message: "success",
            data: build_list(obj.response),
        });
    });
};

const COMPLETED_MAIN_QUERY = `SELECT DISTINCT 
                                p.ProjectName, p.ProjectCode,
                                it.ProjectCycleNumber,it.ProjectCycleId,it.PlannedStartDate,it.Duration,
                                srm.SystemRequirementId,srm.SystemRequirementName,
                                ea.FullName AssigneeFullName,
                                er.FullName ReportedByFullName,
                                erv.FullName ReviewerFullName,
                                tt.TaskTypeName, tt.IconClass,
                                tp.PriorityText, tp.PriorityIcon, tp.PriorityColor,
                                tpar.TaskId ParentTaskId, tpar.TaskName ParentTaskName,tpar.WorkItemKey ParentWorkItemKey , CONCAT(p.ProjectCode, '-', tpar.WorkItemKey) ParentKey,
                                ts.StatusText, ts.IsWorklogItem, ts.IsOpenStatus, ts.IsInProgressStatus, ts.NextStatusId,
                                ec.FullName CreatorFullName,
                                elu.FullName LastEditorFullName,fa.Description,fa.FunctionalAreaCode,  
                                t.*
                                FROM task t
                                JOIN project p ON t.ProjectId = p.ProjectId
                                JOIN employee er ON t.ReportedBy = er.EmployeeId
                                JOIN employee ec ON t.CreatedBy = ec.EmployeeId
                                JOIN employee elu ON t.CreatedBy = elu.EmployeeId
                                JOIN task_type tt ON t.TaskTypeId = tt.TaskTypeId
                                JOIN task_priority tp ON t.TaskPriorityId = tp.TaskPriorityId
                                LEFT JOIN employee ea ON t.AssigneeId = ea.EmployeeId
                                LEFT JOIN employee erv ON t.ReviewerId = erv.EmployeeId
                                LEFT JOIN functional_area fa ON t.FunctionalAreaId = fa.FunctionalAreaId
                                LEFT JOIN workitem_status ts ON t.WorkitemStatusId = ts.WorkitemStatusId
                                LEFT JOIN task tpar ON tpar.TaskId = t.ParentTaskId
                                LEFT JOIN task_status_history tsh ON tsh.TaskId = t.TaskId
                                LEFT JOIN
                                (SELECT pc.ProjectCycleNumber,pc.ProjectCycleId,pc.PlannedStartDate,pc.Duration, tim.TaskId from task_iteration_map tim JOIN project_cycle pc ON tim.IterationId = pc.ProjectCycleId) it  ON t.TaskId = it.TaskId
                                LEFT JOIN
                                (SELECT sr.SystemRequirementId, sr.SystemRequirementName, srwm.SystemReqirementWorkitemMapId , srwm.TaskId FROM system_requirement_workitem_map srwm  JOIN system_requirement sr ON srwm.SystemRequirementId=sr.SystemRequirementId) srm ON t.TaskId = srm.TaskId`;

exports.completed_workitem_list_filtered = (req, res) => {
    // console.log(req.body);
    let query = COMPLETED_MAIN_QUERY + " WHERE 1=1";
    if (req.query.OrganizationId) {
        console.log("Inside if");
        query =
            COMPLETED_MAIN_QUERY + " AND p.OrganizationId = " + req.query.OrganizationId;
    }

    console.log(query + completed_filter_by(req) + order_by(req));

    connection.query(query + completed_filter_by(req) + order_by(req), function (obj) {
        if (obj.error) {
            return res.status(400).send({
                success: false,
                message: "An unexpected error occurred",
                data: obj.response,
            });
        }

        res.send({
            success: obj.error == null,
            message: "success",
            data: build_list(obj.response),
        });
    });
};


exports.save_search = (req, res) => {
    if (!req.body.Title) {
        return res.status(400).send({
            success: false,
            message: "Title is required",
            data: null,
        });
    }

    if (!req.body.SearchFilters) {
        return res.status(400).send({
            success: false,
            message: "SearchFilters is required",
            data: null,
        });
    }

    if (!req.body.CreatedBy) {
        return res.status(400).send({
            success: false,
            message: "CreatedBy is required",
            data: null,
        });
    }

    // let code = CryptoJS.AES.encrypt(req.body.SearchFilters, ENCRYPTION_KEY).toString();
    let code = uuid();

    let query = `INSERT INTO saved_search (Title, Description, Code, FilterJSON, CreatedBy) VALUES 
                    ('${req.body.Title.replace(/'/g, "\\'")}', 
                    '${req.body.Description.replace(/'/g, "\\'")}', 
                    '${code}',
                    '${req.body.SearchFilters}',
                    ${req.body.CreatedBy})`;

    console.log(query);

    connection.query(query, function (obj) {
        return res.status(200).send({
            success: obj.error == null,
            message: 'Success',
            data: {
                insertResponse: obj.response,
                code: code
            }
        })
    });

}

exports.saved_search_list = (req, res) => {

    if (!req.query.CreatedBy) {
        return res.status(400).send({
            success: false,
            message: "CreatedBy is required",
            data: null,
        });
    }

    let query = `SELECT * FROM saved_search WHERE CreatedBy=${req.query.CreatedBy} AND Deleted<>'Y'`;

    connection.query(query, function (obj) {
        return res.status(200).send({
            success: obj.error == null,
            message: 'Success',
            data: obj.response
        })
    });
}

exports.saved_search_by_code = (req, res) => {

    if (!req.params.searchCode) {
        return res.status(400).send({
            success: false,
            message: "SearchCode is required",
            data: null,
        });
    }

    let query = `SELECT * FROM saved_search WHERE Code='${req.params.searchCode}' AND Deleted<>'Y'`;

    connection.query(query, function (obj) {
        return res.status(200).send({
            success: obj.error == null,
            message: 'Success',
            data: obj.response[0]
        })
    });
}

exports.delete_saved_search = (req, res) => {

    if (!req.body.SavedSearchId) {
        return res.status(400).send({
            success: false,
            message: "SavedSearchId is required",
            data: null,
        });
    }

    if (!req.body.EmployeeId) {
        return res.status(400).send({
            success: false,
            message: "EmployeeId is required",
            data: null,
        });
    }

    let query = `UPDATE saved_search SET Deleted='Y', DeletedBy='${req.body.EmployeeId}', DeletedDateTime=NOW()
                 WHERE SavedSearchId='${req.body.SavedSearchId}'`;

    console.log(query);

    connection.query(query, function (obj) {
        return res.status(200).send({
            success: obj.error == null,
            message: 'Success',
            data: obj.response[0]
        })
    });
}



function completed_filter_by(req) {
    var filterObj = req.body;

    var filterClause = ``;

    if (filterObj.statuses && filterObj.statuses.length) {
        var statusList = "(" + filterObj.statuses.join() + ")";
        filterClause += ` AND t.WorkitemStatusId IN ${statusList}`;

        // console.log({ filterObj });

        if (filterObj.statuses.includes("-1") || filterObj.statuses.includes(-1))
            filterClause = ` AND (ts.IsOpenStatus = 'Y' OR ts.IsInProgressStatus = 'Y') AND ts.StatusText <> 'Review Complete'`;
    }

    if (filterObj.projects && filterObj.projects.length) {
        var projectList = "(" + filterObj.projects.join() + ")";
        filterClause += ` AND t.ProjectId IN ${projectList}`;
    }

    if (filterObj.ReportedBy) {
        filterClause += ` AND er.FullName LIKE '%${filterObj.ReportedBy}%'`;
    }

    if (filterObj.Assignee) {
        filterClause += ` AND ea.FullName LIKE '%${filterObj.Assignee}%'`;
    }

    if (filterObj.WorkItemKey) {
        filterClause += ` AND t.WorkItemKey LIKE '%${filterObj.WorkItemKey}%'`;
    }

    if (filterObj.TaskName) {
        filterClause += ` AND t.TaskName LIKE '%${filterObj.TaskName}%'`;
    }

    if (filterObj.FunctionalArea) {
        filterClause += ` AND fa.Description LIKE '%${filterObj.FunctionalArea}%' OR fa.FunctionalAreaCode LIKE '%${filterObj.FunctionalArea}%'`;
    }

    if (filterObj.ProjectCycle) {
        filterClause += ` AND it.ProjectCycleNumber LIKE '%${filterObj.ProjectCycle}%'`;
    }

    if (filterObj.ReportedMinDate && filterObj.ReportedMaxDate) {
        filterClause += ` AND t.CreatedDateTime BETWEEN '${filterObj.ReportedMinDate} 00:00:00' AND '${filterObj.ReportedMaxDate} 23:59:59' `;
    }

    if (filterObj.CompletedMinDate && filterObj.CompletedMaxDate) {
        filterClause += ` AND tsh.WorkitemStatusId ='8' AND tsh.UpdatedTime BETWEEN '${filterObj.CompletedMinDate} 00:00:00' AND '${filterObj.CompletedMaxDate} 23:59:59' `;
    }

    if (filterObj.types && filterObj.types.length) {
        var typeList = "(" + filterObj.types.join() + ")";
        filterClause += ` AND t.TaskTypeId IN ${typeList}`;
    }

    if (filterObj.priorities && filterObj.priorities.length) {
        var priorityList = "(" + filterObj.priorities.join() + ")";
        filterClause += ` AND t.TaskPriorityId IN ${priorityList}`;
    }

    console.log("FILTERCLAUSE: " + filterClause);

    return filterClause;
}

function sortAlphabeticalOrder(genericTasks) {
    var sorted = genericTasks.sort(function (a, b) {
        var textA = a.GenericTaskName;
        var textB = b.GenericTaskName;
        return textA < textB ? -1 : textA > textB ? 1 : 0;
    });
    return sorted;
}


const WORKITEM_DETAILS_QUERY = `SELECT 
p.ProjectName, p.ProjectCode,
it.ProjectCycleNumber,it.ProjectCycleId,it.ActualStartDate,it.Duration,it.PlannedEndDate,it.ActualEndDate,it.ProjectCycleTypeName,
srm.SystemRequirementId,srm.SystemRequirementName,
ea.FullName AssigneeFullName,
er.FullName ReportedByFullName,
erv.FullName ReviewerFullName,
tt.TaskTypeName, tt.IconClass,
tp.PriorityText, tp.PriorityIcon, tp.PriorityColor,
tpar.TaskId ParentTaskId, tpar.TaskName ParentTaskName,tpar.WorkItemKey ParentWorkItemKey , CONCAT(p.ProjectCode, '-', tpar.WorkItemKey) ParentKey,
ts.StatusText, ts.IsWorklogItem, ts.IsOpenStatus, ts.IsInProgressStatus, ts.NextStatusId, ts.StatusIconClass AS StatusIconClass,
ec.FullName CreatorFullName,
elu.FullName LastEditorFullName,fa.Description,fa.FunctionalAreaCode,sr.Remarks StatusRemarks,sr.StatusRemarkId,  
t.*
FROM task t
JOIN project p ON t.ProjectId = p.ProjectId
JOIN employee er ON t.ReportedBy = er.EmployeeId
JOIN employee ec ON t.CreatedBy = ec.EmployeeId
JOIN employee elu ON t.CreatedBy = elu.EmployeeId
JOIN task_type tt ON t.TaskTypeId = tt.TaskTypeId
JOIN task_priority tp ON t.TaskPriorityId = tp.TaskPriorityId
LEFT JOIN employee ea ON t.AssigneeId = ea.EmployeeId
LEFT JOIN employee erv ON t.ReviewerId = erv.EmployeeId
LEFT JOIN functional_area fa ON t.FunctionalAreaId = fa.FunctionalAreaId
LEFT JOIN workitem_status ts ON t.WorkitemStatusId = ts.WorkitemStatusId
LEFT JOIN task tpar ON tpar.TaskId = t.ParentTaskId
LEFT JOIN status_remarks sr ON sr.TaskId = t.TaskId
LEFT JOIN
(SELECT pc.ProjectCycleNumber,pc.ProjectCycleId,pc.ActualStartDate,pc.Duration,pc.PlannedEndDate,pc.ActualEndDate,ptm.ProjectCycleTypeName, tim.TaskId from task_iteration_map tim JOIN project_cycle pc ON tim.IterationId = pc.ProjectCycleId
JOIN project_cycle_type_master ptm ON pc.ProjectCycleTypeId = ptm.ProjectCycleTypeId) it  ON t.TaskId = it.TaskId
LEFT JOIN
(SELECT sr.SystemRequirementId, sr.SystemRequirementName, srwm.SystemReqirementWorkitemMapId , srwm.TaskId FROM system_requirement_workitem_map srwm  JOIN system_requirement sr ON srwm.SystemRequirementId=sr.SystemRequirementId) srm ON t.TaskId = srm.TaskId`;


// Edit Review Comments 
exports.edit_reviewer_comments = (req, res) => {
    let query = `UPDATE review_comment SET
            Comments = '${req.body.Comments.replace(/'/g, "\\'")}',
            LastUpdatedBy = '${req.body.LastUpdatedBy}'
            WHERE ReviewCommentId = '${req.body.ReviewCommentId}'`;

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response,
        });
    });
}


//Complete Test Reject WOrkitem
exports.chenge_complete_test_reject_workItem = (req, res) => {
    let query = `SELECT th.* FROM task_assignment_history th WHERE th.TaskId =${req.body.TaskId} 
                 ORDER BY th.TaskAssignmentId DESC LIMIT 0,3`;

    connection.query(query, function (obj) {
        if (obj.response.length != 0) {
            var AssigneeId = obj.response[obj.response.length - 1].EmployeeId;
            console.log("Data is " + AssigneeId);

            var AssigneeId = obj.response[obj.response.length - 1].EmployeeId;
            console.log(AssigneeId);

            let crupQuery = `UPDATE task set 
                        WorkitemStatusId ='${req.body.WorkitemStatusId}',
                        LastUpdatedBy = '${req.body.LastUpdatedBy}',
                        AssigneeId = '${AssigneeId}'
                        where TaskId =${req.body.TaskId}`;
            console.log(crupQuery);

            connection.query(crupQuery, function (obj) {
                res.send({
                    success: obj.error == null,
                    message: obj.error || `Success`,
                    data: obj.response,
                });
            });
        } else {
            return res.status(400).send({
                success: false,
                message:
                    "Original assignee cannot be found. Please edit or re-assign this work item",
                data: null,
            });
        }
    });
};
