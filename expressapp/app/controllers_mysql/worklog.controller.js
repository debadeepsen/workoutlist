const connection = require('./mysql.controller');

exports.getByDate = (req, res) => {


    console.log('getByDate');

    //
    // UNUSED
    //

    if (!req.query.EntryDate) {
        return res.status(400).send({
            message: "Entry date is required."
        });
    }

    if (!req.query.AssigneeId) {
        return res.status(400).send({
            message: "Assignee is required."
        });
    }

    let query = `SELECT p.ProjectCode, p.ProjectName, t.TaskId, t.TaskName, t.EstimatedEffort, t.RemainingEffort, w.Hours, w.Remarks FROM task t
                    JOIN project p ON t.ProjectId = p.ProjectId
                    JOIN workitem_status ws ON t.WorkitemStatusId = ws.WorkitemStatusId AND ws.IsActive = 'Y'
                    LEFT JOIN work_log w ON t.TaskId = w.TaskId AND w.EntryDate = '${req.query.EntryDate}'
                    WHERE t.AssigneeId = ${req.query.AssigneeId}`;

    console.log(query);

    connection.query(query, function (obj) {
        return res.status(200).send({
            success: !obj.error,
            message: '',
            data: obj.response
        });
    });

}

exports.getTimeSheetByDate = (req, res) => {

    console.log('getTimeSheetByDate');

    if (!req.query.EntryDate) {
        return res.status(400).send({
            message: "Entry date is required."
        });
    }

    if (!req.query.AssigneeId && !req.query.AssigneeCode) {
        return res.status(400).send({
            message: "Assignee is required."
        });
    }

    let whereClause = `WHERE t.AssigneeId = ${req.query.AssigneeId} AND p.Closed <> 'Y'`;
    let leftJoinClause = ` AND w.EmployeeId = ${req.query.AssigneeId}`;

    /* The criteria variable here serves the purpose for both worklog record and worklog edit,
        Since while editing we want to show the completed/resolved tasks on that date as well*/
    let criteria = `ws.IsActive = 'Y' AND ws.IsWorklogItem = 'Y'`;
    if (req.query.Type == 'Edit') {
        criteria = `( (ws.IsActive = 'Y' AND ws.IsWorklogItem = 'Y') or (t.LastUpdatedDateTime between 
            '${req.query.EntryDate} 00:00:00' and '${req.query.EntryDate} 23:59:59' 
            AND (t.EstimatedEffort != NULL AND t.RemainingEffort != NULL)))`;
    }

    if (req.query.AssigneeCode) {
        whereClause = `WHERE t.AssigneeId = (SELECT EmployeeId FROM employee WHERE EmployeeCode = '${req.query.AssigneeCode}')`;
        leftJoinClause = ` AND t.AssigneeId = (SELECT EmployeeId FROM employee WHERE EmployeeCode = '${req.query.AssigneeCode}')`;
    }

    let query = `SELECT efs.EffortSpent, p.ProjectCode, p.ProjectName,
                    tt.IconClass, tt.TaskTypeName,
                    t.TaskId, t.WorkitemStatusId, t.TaskTypeId, t.TaskName, t.EstimatedEffort, t.RemainingEffort, t.ReportedBy, t.WorkItemKey,
                    ws.StatusText, ws.NextStatusId,t.ParentTaskId,
                    (SELECT EmployeeId 
                        FROM task_assignment_history tah 
                        WHERE tah.TaskId = t.TaskId 
                        ORDER BY tah.UpdatedTime DESC 
                        LIMIT 1,1) PreviousAssigneeId,
                    w.Hours, w.Remarks
                    FROM task t
                    JOIN task_type tt ON t.TaskTypeId = tt.TaskTypeId
                    JOIN project p ON t.ProjectId = p.ProjectId
                    JOIN workitem_status ws ON t.WorkitemStatusId = ws.WorkitemStatusId AND ${criteria}
                    LEFT JOIN work_log w ON t.TaskId = w.TaskId AND w.EntryDate = '${req.query.EntryDate}' ${leftJoinClause}
                    LEFT JOIN (SELECT TaskId, SUM(Hours) EffortSpent FROM work_log GROUP BY TaskId) efs ON t.TaskId = efs.TaskId
                    ${whereClause} group by t.WorkItemKey, efs.EffortSpent, p.ProjectCode, p.ProjectName,tt.IconClass, tt.TaskTypeName,
                    t.TaskId, t.TaskStatusId, t.TaskTypeId, t.TaskName, t.EstimatedEffort, t.RemainingEffort, t.ReportedBy, t.WorkItemKey,
                    ws.StatusText, ws.NextStatusId,t.ParentTaskId,PreviousAssigneeId, w.Hours, w.Remarks`;

    // (-t.RemainingEffort ASC will put NULLs above 0)

    console.log(query);

    connection.query(query, function (obj) {


        var whereClauseGenTask = (req.query.AssigneeCode) ? `WHERE e.EmployeeCode = '${req.query.AssigneeCode}'` : ` WHERE w.EmployeeId = ${req.query.AssigneeId}`;

        var genTaskQuery = `SELECT GenericTaskId, ProjectId, Hours, Remarks FROM work_log w 
        JOIN employee e ON e.EmployeeId = w.EmployeeId
        ${whereClauseGenTask} AND w.EntryDate = '${req.query.EntryDate}'
        AND w.GenericTaskId IS NOT NULL`;

        console.log('genTaskQuery')
        // console.log(genTaskQuery)

        connection.query(genTaskQuery, function (objGenTask) {

            return res.status(200).send({
                success: !obj.error && !objGenTask.error,
                message: '',
                data: {
                    workItems: obj.response,
                    selectedGenTaskList: objGenTask.response
                }
            });
        });


    });

}

exports.save = (req, res) => {

    if (!req.body.EmployeeId) {
        return res.status(400).send({
            message: "EmployeeId is required"
        });
    }

    if (!req.body.EntryDate) {
        return res.status(400).send({
            message: "EntryDate is required"
        });
    }

    if (!req.body.TimeSheetInfo.length && !req.body.selectedGenericTasks.length) {
        return res.status(400).send({
            message: "No data found to update"
        })
    }


    console.log(req.body);
    var query = ``;
    // var insertQuery = ``;
    if (req.body.TimeSheetInfo.length) {
        req.body.TimeSheetInfo.forEach(e => {
            if (!e.Hours) {

                // This query is used for when only one  entry work log(completed) info wants to save 

                query += `SELECT 1 FROM work_log;`;

            } else {
                // Update the rows if this is an existing work log 
                // (matches entry date, employee, and work item)
                let remarks = e.Remarks ? e.Remarks.replace(/'/g, '\\\'') : "";
                query += `Update work_log set Hours = '${e.Hours}', Remarks = '${remarks}' 
            where EntryDate = '${req.body.EntryDate}' and EmployeeId = '${req.body.EmployeeId}'
             and TaskId = '${e.TaskId}';`

                query +=
                    `Insert into work_log (EntryDate, EmployeeId, TaskId, Hours, Remarks, CreatedBy)
             select * from( select '${req.body.EntryDate}' as EntryDate, '${req.body.EmployeeId}' as EmployeeId, '${e.TaskId}' as TaskId, '${e.Hours}' as Hours, '${remarks}' as Remarks, '${req.body.EmployeeId}' as CreatedBy) as temp
             where not exists(Select EntryDate from work_log where EntryDate = '${req.body.EntryDate}' and EmployeeId = '${req.body.EmployeeId}'
             and TaskId = '${e.TaskId}');`
            }
        })
    }

    if (req.body.selectedGenericTasks.length) {

        query += `Delete from work_log where EntryDate = '${req.body.EntryDate}' 
                    and GenericTaskId is not null 
                    and EmployeeId = ${req.body.EmployeeId};`

        req.body.selectedGenericTasks.forEach(e => {
            let remarks = e.Remarks ? e.Remarks.replace(/'/g, '\\\'') : "";
            let ProjectID = (e.ProjectId) ? e.ProjectId : "NULL";
            query += `Insert into work_log(EntryDate, EmployeeId, GenericTaskId, Hours, Remarks, CreatedBy, ProjectId) 
            values('${req.body.EntryDate}','${req.body.EmployeeId}', '${e.GenericTaskId}', '${e.Hours}', '${remarks}',
            '${req.body.EmployeeId}', ${ProjectID});`
        })
    }

    console.log("Query == " + query);
    connection.query(query, function (obj) {
        console.log('After gentaskquery...');
        console.log(obj);
        if (obj.error) {
            return res.status(400).send({
                success: false,
                message: "Query failed to execute",
                data: obj.response
            })
        }

        console.log('updateTaskQuery starting...')
        let updateTaskQuery = ``;

        if (!req.body.TimeSheetInfo || !req.body.TimeSheetInfo.length) {
            // only generic tasks were added
            return res.status(200).send({
                success: true,
                message: obj.error || `Success`,
                data: obj.response
            });
        }

        req.body.TimeSheetInfo.forEach(e => {
            if (e.HoursRemaining && e.HoursRemaining.toString() != "0" && e.Completed) {
                console.log('Hours remaining is not zero and task is showing as completed')
                // this is wrong
                // because if it's been completed, there cannot be hours remaining
                return res.status(400).send({
                    success: false,
                    message: `Completed work items cannot have hours remaining`,
                    data: { WorkItem: e }
                });
            }
            else if (e.HoursRemaining && e.HoursRemaining.toString() != "0" || e.HoursRemaining.toString() == "0") {
                console.log('Hours remaining is not zero and task is showing as not completed')
                updateTaskQuery += `UPDATE task SET RemainingEffort = '${e.HoursRemaining}' WHERE TaskId = '${e.TaskId}';`;
                connection.query(updateTaskQuery, function (objTask) {
                    return res.status(200).send({
                        success: obj.error == null && objTask.error == null,
                        message: obj.error || objTask.error || `Success`,
                        data: [obj.response, objTask.response]
                    });
                });
            }
            // else if (e.Completed && e.Completed.toString() != "false") {
            //     console.log('Task is showing as not completed')
            //     // If the task is complete, front-end should set hours remaining to zero
            //     // so it should come to this block
            //     let setCompleteQuery = `UPDATE task 
            //                                 SET TaskStatusId = 
            //                                 (SELECT NextStatusId FROM task_status WHERE TaskStatusId = ${e.TaskStatusId}) ,
            //                                 RemainingEffort = 0
            //                                 WHERE TaskId = ${e.TaskId};`;

            //     console.log({ e });
            //     // now, we
            //     // - assign it to the reviewer if it was a developer marking it as "task complete"/"resolved"
            //     // - assign it back to the developer if the reviewer is the one marking it as "review complete"

            //     if (e.TaskStatusId == 2 || e.TaskStatusId == 13) // next status is "task complete" or "resolved"
            //     {
            //         setCompleteQuery += `UPDATE task
            //                                 SET AssigneeId = IFNULL(ReviewerId, AssigneeId)
            //                                 WHERE TaskId = ${e.TaskId};`;
            //     }
            //     else if (e.TaskStatusId == 4 || e.TaskStatusId == 18) // next status is "review complete"
            //     {
            //         // find the previous assignee from the history table and send it back

            //         if (e.PreviousAssigneeId)
            //             setCompleteQuery += `UPDATE task
            //                                 SET AssigneeId = ${e.PreviousAssigneeId}
            //                                 WHERE TaskId = ${e.TaskId};`;
            //     }

            //     console.log(setCompleteQuery);
            //     // return res.status(500).send({});

            //     connection.query(setCompleteQuery, function (objComplete) {
            //         if (objComplete.error) {
            //             return res.status(400).send({
            //                 success: false,
            //                 message: "Query failed to execute",
            //                 data: objComplete.response
            //             })
            //         }

            //         let crupQuery = ``;
            //         req.body.TimeSheetInfo.forEach(e => {
            //             if (e.ParentTaskId) {
            //                 let query = `SELECT t.TaskStatusId,t.ParentTaskId FROM task as t WHERE t.ParentTaskId='${e.ParentTaskId}'`;

            //                 connection.query(query, function (obj) {
            //                     let results = obj.response;
            //                     var count = results.length;
            //                     var resultCount = 0;
            //                     results.forEach(i => {

            //                         if (i.TaskStatusId == 5) {
            //                             resultCount = resultCount + 1;

            //                         } else {
            //                             resultCount = 0;
            //                         }
            //                     })


            //                     if (count == resultCount) {

            //                         crupQuery += `UPDATE task set 
            //                                      TaskStatusId ='${3}'
            //                                      where TaskId ='${e.ParentTaskId}';`;

            //                     } else {
            //                         return res.status(200).send({
            //                             success: obj.error == null && obj.error == null,
            //                             message: obj.error || obj.error || `Success`,
            //                             data: [obj.response, obj.response]
            //                         });
            //                     }
            //                     console.log("Update Query " + crupQuery);
            //                     connection.query(crupQuery, function (objComplete) {
            //                         return res.status(200).send({
            //                             success: objComplete.error == null && objComplete.error == null,
            //                             message: objComplete.error || objComplete.error || `Success`,
            //                             data: [objComplete.response, objComplete.response]
            //                         });
            //                     })

            //                 });

            //             }
            //             else {
            //                 return res.status(200).send({
            //                     success: true,
            //                     message: obj.error || `Success`,
            //                     data: obj.response
            //                 });
            //             }


            //         })


            //     });
            // }
            else {
                console.log('else block')
                return res.status(200).send({
                    success: true,
                    message: obj.error || `Success`,
                    data: obj.response
                });
            }
        });


    })





}

exports.findByEmployee = (req, res) => {

    //console.log('findByEmployee');
    console.log('API Called');

    if (!req.query.EmployeeId && !req.query.EmployeeCode) {
        return res.status(400).send({
            message: "Either EmployeeId or EmployeeCode is required."
        });
    }

    try {

        let whereClause = req.query.EmployeeId ? `WHERE e.EmployeeId = '${req.query.EmployeeId}'` :
            (req.query.EmployeeCode == 'all' ? `WHERE 1=1` : `WHERE e.EmployeeCode = '${req.query.EmployeeCode}'`);

        let fullWhereClause = whereClause;

        if (req.query.startDate && req.query.endDate) {
            fullWhereClause += ` AND w.EntryDate >= '${req.query.startDate}' AND w.EntryDate <= '${req.query.endDate}'`;
        }

        let workLogQuery = `SELECT w.EntryDate, e.EmployeeCode, p.ProjectCode, w.GenericTaskId, w.ProjectId,
                            (SELECT ProjectCode FROM project p1 WHERE p1.ProjectId = w.ProjectId) GTProjectCode,
                            w.Remarks, w.CreatedDateTime, w.Hours, t.TaskName, t.TaskDescription, t.TaskId,
                            t.EstimatedEffort, t.RemainingEffort, t.WorkItemKey,
                            0 as IsLeave,
                            gt.GenericTaskName
                             FROM work_log w
                             JOIN employee e ON w.EmployeeId = e.EmployeeId
                             LEFT JOIN task t ON w.TaskId = t.TaskId
                             LEFT JOIN project p ON t.ProjectId = p.ProjectId
                             LEFT JOIN generic_tasks gt ON w.GenericTaskId = gt.GenericTaskId
                             ${fullWhereClause}
                             ORDER BY w.EntryDate DESC, t.WorkItemKey ASC `;

        //console.log(workLogQuery);

        connection.query(workLogQuery, function (obj) {

            connection.query(`SELECT * FROM employee e LEFT JOIN employee_profile ep ON e.EmployeeId = ep.EmployeeId ${whereClause}`, function (objEmp) {

                return res.status(200).send({
                    success: true,
                    message: `Success`,
                    data: {
                        WorkLogs: build_list_by_date(obj.response),
                        Employee: objEmp.response
                    }
                });
            });
        });
    } catch (err) {
        return res.status(500).send({
            message: err.message || 'Some error occurred while retrieving work logs.',
        });
    }
}

exports.deleteWorklog = (req, res) => {
    if (!req.body.EmployeeId) {
        return res.status(400).send({
            success: false,
            message: `EmployeeId is required`,
            data: null
        })
    }

    if (!req.body.EntryDate) {
        return res.status(400).send({
            success: false,
            message: `Entry Date is required`,
            data: null
        })
    }

    let query = `DELETE FROM work_log WHERE EntryDate = '${req.body.EntryDate}' && EmployeeId = '${req.body.EmployeeId}'`;

    connection.query(query, function (obj) {

        return res.status(200).send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}

// Daliy Time Sheets Reminder
exports.daily_reminder_employeeId = (req, res) => {

    let query = `SELECT WorkLogId FROM work_log where EntryDate = curdate() and EmployeeId =${req.params.EmployeeId}`;

    //console.log(query);
    connection.query(query, function (obj) {
        return res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

// Weekly Time Sheets Reminder
exports.weekly_reminder_employeeId = (req, res) => {

    console.log('weekly_reminder_employeeId');

    /* let query = `SELECT EntryDate FROM work_log where EmployeeId =${req.params.EmployeeId} 
    and  EntryDate between  '${req.params.StartDate}' and  curdate() `;
    // `SELECT WorkLogId FROM work_log where EntryDate = curdate() and EmployeeId =${req.params.EmployeeId}`; */

    let query = `SELECT *
                    FROM 
                    (
                    SELECT ADDDATE('1970-01-01',t4.i*10000 + t3.i*1000 + t2.i*100 + t1.i*10 + t0.i) MissingDate
                    FROM
                    (
                    SELECT 0 i UNION
                    SELECT 1 UNION
                    SELECT 2 UNION
                    SELECT 3 UNION
                    SELECT 4 UNION
                    SELECT 5 UNION
                    SELECT 6 UNION
                    SELECT 7 UNION
                    SELECT 8 UNION
                    SELECT 9) t0,
                    (
                    SELECT 0 i UNION
                    SELECT 1 UNION
                    SELECT 2 UNION
                    SELECT 3 UNION
                    SELECT 4 UNION
                    SELECT 5 UNION
                    SELECT 6 UNION
                    SELECT 7 UNION
                    SELECT 8 UNION
                    SELECT 9) t1,
                    (
                    SELECT 0 i UNION
                    SELECT 1 UNION
                    SELECT 2 UNION
                    SELECT 3 UNION
                    SELECT 4 UNION
                    SELECT 5 UNION
                    SELECT 6 UNION
                    SELECT 7 UNION
                    SELECT 8 UNION
                    SELECT 9) t2,
                    (
                    SELECT 0 i UNION
                    SELECT 1 UNION
                    SELECT 2 UNION
                    SELECT 3 UNION
                    SELECT 4 UNION
                    SELECT 5 UNION
                    SELECT 6 UNION
                    SELECT 7 UNION
                    SELECT 8 UNION
                    SELECT 9) t3,
                    (
                    SELECT 0 i UNION
                    SELECT 1 UNION
                    SELECT 2 UNION
                    SELECT 3 UNION
                    SELECT 4 UNION
                    SELECT 5 UNION
                    SELECT 6 UNION
                    SELECT 7 UNION
                    SELECT 8 UNION
                    SELECT 9) t4) v
                    WHERE MissingDate BETWEEN '${req.params.StartDate}' AND CURDATE() AND MissingDate NOT IN (
                    SELECT EntryDate
                    FROM work_log
                    WHERE EmployeeId = ${req.params.EmployeeId} AND EntryDate BETWEEN '${req.params.StartDate}' AND CURDATE())`;

    connection.query(query, function (obj) {
        return res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}


exports.getWorklogsByTask = (req, res) => {
    let workItemId = req.params.workItemId;

    let query = `SELECT w.WorkLogId, w.EntryDate, w.Hours, w.Remarks, e.EmployeeId, e.FullName
                    FROM work_log w 
                    JOIN employee e ON e.EmployeeId = w.EmployeeId
                    WHERE w.TaskId = ${workItemId}`;

    connection.query(query, function (obj) {
        return res.status(200).send({
            success: obj.error != null,
            message: obj.error || 'Success',
            data: obj.response
        })
    })
}


// For Work Log Edit view
exports.worklog_editByDate = (req, res) => {
    if (!req.query.AssigneeId)
        return res.status(400).send({
            success: false,
            message: 'Assignee Id is required',
            data: null
        })

    if (!req.query.EntryDate)
        return res.status(400).send({
            success: false,
            message: 'Date is required',
            data: null
        })

    let query = `Select t.TaskId, t.TaskName,tt.IconClass, t.WorkItemKey,  w.ProjectId, p.ProjectCode,
    (SELECT ProjectCode FROM project p1 WHERE p1.ProjectId = w.ProjectId) GTProjectCode,
    gt.GenericTaskName, w.GenericTaskId,efs.EffortSpent, w.Hours, t.RemainingEffort,w.Remarks
      from work_log w left join task t on t.TaskId = w.TaskId
    left join project p on p.ProjectId = t.ProjectId  
    left join generic_tasks gt on w.GenericTaskId = gt.GenericTaskId
    left join task_type tt ON t.TaskTypeId = tt.TaskTypeId
    LEFT JOIN (SELECT TaskId, SUM(Hours) EffortSpent FROM work_log GROUP BY TaskId) efs ON t.TaskId = efs.TaskId
    where w.EmployeeId = ${req.query.AssigneeId} and w.EntryDate = '${req.query.EntryDate}' order by t.WorkItemKey asc; `

    connection.query(query, function (obj) {
        var Dataobj = {
            WorkItemLogs: [],
            GenericLogs: []
        }

        obj.response.forEach((item) => {
            if (item.TaskId)
                Dataobj.WorkItemLogs.push(item);
            else
                Dataobj.GenericLogs.push(item);
        })
        res.status(200).send({
            success: true,
            message: 'Success',
            data: Dataobj
        })
    })
}


// For work log edit save
exports.worklog_editSave = (req, res) => {
    if (!req.body.EmployeeId) {
        return res.status(400).send({
            message: "EmployeeId is required"
        });
    }

    if (!req.body.EntryDate) {
        return res.status(400).send({
            message: "EntryDate is required"
        });
    }

    if (!req.body.TimeSheetInfo.length && !req.body.selectedGenericTasks.length) {
        return res.status(400).send({
            message: "No data found to update"
        })
    }

    console.log(req.body);
    var query = ``;
    // var insertQuery = ``;
    if (req.body.TimeSheetInfo.length) {
        req.body.TimeSheetInfo.forEach(e => {

            // Update the rows if this is an existing work log 
            // (matches entry date, employee, and work item)
            let remarks = e.Remarks ? e.Remarks.replace(/'/g, '\\\'') : "";
            query += `Update work_log set Hours = '${e.Hours}', Remarks = '${remarks}' 
            where EntryDate = '${req.body.EntryDate}' and EmployeeId = '${req.body.EmployeeId}'
             and TaskId = '${e.TaskId}';`
        })
    }

    if (req.body.selectedGenericTasks.length) {

        query += `Delete from work_log where EntryDate = '${req.body.EntryDate}' 
                    and GenericTaskId is not null 
                    and EmployeeId = ${req.body.EmployeeId};`

        req.body.selectedGenericTasks.forEach(e => {
            let remarks = e.Remarks ? e.Remarks.replace(/'/g, '\\\'') : "";
            let ProjectID = (e.ProjectId) ? e.ProjectId : "NULL";
            query += `Insert into work_log(EntryDate, EmployeeId, GenericTaskId, Hours, Remarks, CreatedBy, ProjectId) 
            values('${req.body.EntryDate}','${req.body.EmployeeId}', '${e.GenericTaskId}', '${e.Hours}', '${remarks}',
            '${req.body.EmployeeId}', ${ProjectID});`
        })
    }

    console.log(query);
    connection.query(query, function (obj) {
        if (obj.error) {
            return res.status(400).send({
                success: false,
                message: "Query failed to execute",
                data: obj.response
            })
        }

        else {
            return res.status(200).send({
                success: true,
                message: obj.error || `Success`,
                data: obj.response

            })
        }
    })
}

//Utility function
function build_list_by_date(worklogs) {
    var return_list = [];

    //console.log(worklogs);

    worklogs.forEach(e => {

        var date_obj = return_list.find(x => x.EntryDate == e.EntryDate.toISOString().substr(0, 10));

        if (!date_obj) {

            return_list.push({
                EntryDate: e.EntryDate.toISOString().substr(0, 10),
                FormattedEntryDate: getFormattedDate(e.EntryDate).FullDate,
                DayOfWeek: getFormattedDate(e.EntryDate).DayOfWeek,
                DayOfWeekShort: getFormattedDate(e.EntryDate).DayOfWeek.substr(0, 3),
                WorkLogEntry: [e]
            })
        } else {
            date_obj.WorkLogEntry.push(e);
        }

    });

    return return_list;
}


function getFormattedDate(d) {
    var date = d.getDate();

    var monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    var month = monthNames[d.getMonth()];

    var year = d.getFullYear();

    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var dayName = days[d.getDay()];

    return {
        DayOfWeek: dayName,
        FullDate: `${date} ${month} ${year}`
    };
}

exports.leave_tracking = (req, res) => {

    let query =
        `DELETE FROM leave_record WHERE LeaveDate ='${req.body.EntryDate}' AND EmployeeId ='${req.body.EmployeeId}' ;
        INSERT INTO leave_record (EmployeeId,LeaveDate,CreatedBy) VALUES ('${req.body.EmployeeId}','${req.body.EntryDate}','${req.body.EmployeeId}');`

    console.log("LEAVE TRACKING " + query);

    connection.query(query, function (obj) {

        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}