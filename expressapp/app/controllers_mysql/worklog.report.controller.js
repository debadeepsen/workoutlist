const connection = require('./mysql.controller');
var moment = require('moment');

function getAllEmployeesWhereClause(req) {
    return `w.EmployeeId IN (${req.query.employees})`;
}

//Work logs Reporsts Max And Min Date 
exports.getWorklogs_reports = (req, res) => {
    var stringurl = ``;
    var itemKeyurl = ``;
    if (req.query.AssigneeId != "ALL") {
        if (req.query.ProjectId != "ALL") {
            stringurl = `w.EmployeeId = '${req.query.AssigneeId}' AND (t.ProjectId = ${req.query.ProjectId} OR (gt.GenericTaskId IS NOT NULL and w.ProjectId =  ${req.query.ProjectId}))`;
        }
        else {
            stringurl = `w.EmployeeId = '${req.query.AssigneeId}'`;
        }
    }
    else {
        if (req.query.ProjectId != "ALL") {
            stringurl = `(t.ProjectId = ${req.query.ProjectId} OR (gt.GenericTaskId IS NOT NULL and w.ProjectId =  ${req.query.ProjectId}))
                AND (w.EmployeeId IN (SELECT EmployeeId FROM project_employee_map WHERE ProjectId = ${req.query.ProjectId})) `;
        }
        else {
            stringurl = getAllEmployeesWhereClause(req)
        }
    }

    if (req.query.Key != 'undefined') {
        var key = req.query.Key;
        var itemkey = key.split("");
        if (itemkey.includes("-")) {
            var code = key.split("-", 1);
            var workitemkey = key.split("-")[1];

            itemKeyurl = `w.EntryDate between 
            '${req.query.MinDate}' AND '${req.query.MaxDate}'  AND t.WorkItemKey LIKE '%${workitemkey}%' AND p.ProjectCode ='${code}' `;

        } else {
            itemKeyurl = ` w.EntryDate between '${req.query.MinDate}' AND '${req.query.MaxDate}' AND  t.WorkItemKey LIKE '%${key}%'`;

        }
    } else {
        itemKeyurl = `w.EntryDate between 
        '${req.query.MinDate}' AND '${req.query.MaxDate}'`;
    }
    let reportQuery = ``;
    reportQuery = `SELECT e.EmployeeCode,e.FullName, p.ProjectCode,w.EntryDate, w.GenericTaskId,
        w.Remarks, w.CreatedDateTime, w.Hours, t.TaskName, t.TaskDescription, t.TaskId,
        (SELECT ProjectCode FROM project p1 WHERE p1.ProjectId = w.ProjectId) GTProjectCode,
        t.EstimatedEffort, t.RemainingEffort, t.WorkItemKey,
        0 as IsLeave,
        gt.GenericTaskName
         FROM work_log w
         JOIN employee e ON w.EmployeeId = e.EmployeeId
         LEFT JOIN task t ON w.TaskId = t.TaskId
         LEFT JOIN project p ON t.ProjectId = p.ProjectId
         LEFT JOIN generic_tasks gt ON w.GenericTaskId = gt.GenericTaskId
         Where  ${stringurl} AND ${itemKeyurl}    
         ORDER BY e.FullName ASC, w.EntryDate DESC`;


    console.log(reportQuery);
    connection.query(reportQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: "success",
            data: build_list(obj.response)
        });
    });

}

//Work log Report Using time Preiod
// exports.getWorklogs_reports_timePeriod = (req, res) => {

//     var stringurl = ``;
//     var itemKeyurl = ``;
//     if (req.query.AssigneeId != "ALL") {
//         if (req.query.ProjectId != "ALL") {
//             stringurl = `w.EmployeeId = '${req.query.AssigneeId}' AND (t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)`;
//         }
//         else {
//             stringurl = `w.EmployeeId = '${req.query.AssigneeId}'`;
//         }
//     }
//     else {
//         if (req.query.ProjectId != "ALL") {
//             stringurl = `(t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)
//                 AND (w.EmployeeId IN (SELECT EmployeeId FROM project_employee_map WHERE ProjectId = ${req.query.ProjectId})) `;
//         }
//         else {
//             stringurl = getAllEmployeesWhereClause(req)
//         }
//     }

//     if (req.query.Key != 'undefined') {
//         var key = req.query.Key;
//         var itemkey = key.split("");
//         if (itemkey.includes("-")) {
//             var code = key.split("-", 1);
//             var workitemkey = key.split("-")[1];

//             itemKeyurl = `w.EntryDate between 
//             '${req.query.TimePeriodValue}' AND CURDATE()   AND t.WorkItemKey LIKE '%${workitemkey}%' AND p.ProjectCode ='${code}' `;

//         } else {
//             itemKeyurl = ` w.EntryDate between 
//             '${req.query.TimePeriodValue}' AND CURDATE()  AND  t.WorkItemKey LIKE '%${key}%'`;

//         }
//     } else {
//         itemKeyurl = `w.EntryDate between 
//         '${req.query.TimePeriodValue}' AND CURDATE() `;
//     }
//     let reportQuery = ``;
//     reportQuery = `SELECT  e.EmployeeCode,e.FullName, p.ProjectCode, w.EntryDate,w.GenericTaskId,
//         w.Remarks, w.CreatedDateTime, w.Hours, t.TaskName, t.TaskDescription, t.TaskId,
//         (SELECT ProjectCode FROM project p1 WHERE p1.ProjectId = w.ProjectId) GTProjectCode,
//         t.EstimatedEffort, t.RemainingEffort, t.WorkItemKey,
//         0 as IsLeave,
//         gt.GenericTaskName
//          FROM work_log w
//          JOIN employee e ON w.EmployeeId = e.EmployeeId
//          LEFT JOIN task t ON w.TaskId = t.TaskId
//          LEFT JOIN project p ON t.ProjectId = p.ProjectId
//          LEFT JOIN generic_tasks gt ON w.GenericTaskId = gt.GenericTaskId
//          Where ${stringurl} AND ${itemKeyurl}
//          ORDER BY e.FullName ASC, w.EntryDate DESC`;


//     console.log(reportQuery);
//     connection.query(reportQuery, function (obj) {
//         res.send({
//             success: obj.error == null,
//             message: "success",
//             data: build_list(obj.response)
//         });
//     });


// }

// //Work log Report Using time Yesterday
// exports.getWorklogs_reports_yesterday = (req, res) => {

//     var stringurl = ``;
//     var itemKeyurl = ``;
//     if (req.query.AssigneeId != "ALL") {
//         if (req.query.ProjectId != "ALL") {
//             stringurl = `w.EmployeeId = '${req.query.AssigneeId}' AND (t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)`;
//         }
//         else {
//             stringurl = `w.EmployeeId = '${req.query.AssigneeId}'`;
//         }
//     }
//     else {
//         if (req.query.ProjectId != "ALL") {
//             stringurl = `(t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)
//                 AND (w.EmployeeId IN (SELECT EmployeeId FROM project_employee_map WHERE ProjectId = ${req.query.ProjectId})) `;
//         }
//         else {
//             stringurl = getAllEmployeesWhereClause(req)
//         }
//     }


//     if (req.query.Key != 'undefined') {
//         var key = req.query.Key;
//         var itemkey = key.split("");
//         if (itemkey.includes("-")) {
//             var code = key.split("-", 1);
//             var workitemkey = key.split("-")[1];

//             itemKeyurl = `w.EntryDate = '${req.query.Yesterday}' AND t.WorkItemKey LIKE '%${workitemkey}%' AND p.ProjectCode ='${code}' `;

//         } else {
//             itemKeyurl = ` w.EntryDate = '${req.query.Yesterday}' AND  t.WorkItemKey LIKE '%${key}%'`;

//         }
//     } else {
//         itemKeyurl = `w.EntryDate = '${req.query.Yesterday}'`;
//     }

//     let reportQuery = ``;
//     reportQuery = `SELECT  e.EmployeeCode,e.FullName, p.ProjectCode, w.EntryDate,w.GenericTaskId,
//         w.Remarks, w.CreatedDateTime, w.Hours, t.TaskName, t.TaskDescription, t.TaskId,
//         (SELECT ProjectCode FROM project p1 WHERE p1.ProjectId = w.ProjectId) GTProjectCode,
//         t.EstimatedEffort, t.RemainingEffort, t.WorkItemKey,
//         0 as IsLeave,
//         gt.GenericTaskName
//          FROM work_log w
//          JOIN employee e ON w.EmployeeId = e.EmployeeId
//          LEFT JOIN task t ON w.TaskId = t.TaskId
//          LEFT JOIN project p ON t.ProjectId = p.ProjectId
//          LEFT JOIN generic_tasks gt ON w.GenericTaskId = gt.GenericTaskId
//          Where ${stringurl} AND ${itemKeyurl}
//          ORDER BY e.FullName ASC, w.EntryDate DESC`;


//     console.log(reportQuery);
//     connection.query(reportQuery, function (obj) {
//         res.send({
//             success: obj.error == null,
//             message: "success",
//             data: build_list(obj.response)
//         });
//     });


// }
// //Work log Report last week 
// exports.getWorklogs_reports_last_week_timePeriod = (req, res) => {

//     var stringurl = ``;
//     var itemKeyurl = ``;
//     if (req.query.AssigneeId != "ALL") {
//         if (req.query.ProjectId != "ALL") {
//             stringurl = `w.EmployeeId = '${req.query.AssigneeId}' AND (t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)`;
//         }
//         else {
//             stringurl = `w.EmployeeId = '${req.query.AssigneeId}'`;
//         }
//     }
//     else {
//         if (req.query.ProjectId != "ALL") {
//             stringurl = `(t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)
//                 AND (w.EmployeeId IN (SELECT EmployeeId FROM project_employee_map WHERE ProjectId = ${req.query.ProjectId})) `;
//         }
//         else {
//             stringurl = getAllEmployeesWhereClause(req)
//         }
//     }

//     if (req.query.Key != 'undefined') {
//         var key = req.query.Key;
//         var itemkey = key.split("");
//         if (itemkey.includes("-")) {
//             var code = key.split("-", 1);
//             var workitemkey = key.split("-")[1];

//             itemKeyurl = `w.EntryDate between 
//             '${req.query.lastWeekStartDate}' AND '${req.query.lastWeekEndDate}' AND t.WorkItemKey LIKE '%${workitemkey}%' AND p.ProjectCode ='${code}' `;

//         } else {
//             itemKeyurl = `w.EntryDate between 
//             '${req.query.lastWeekStartDate}' AND '${req.query.lastWeekEndDate}' AND  t.WorkItemKey LIKE '%${key}%'`;

//         }
//     } else {
//         itemKeyurl = `w.EntryDate between 
//         '${req.query.lastWeekStartDate}' AND '${req.query.lastWeekEndDate}'`;
//     }

//     let reportQuery = ``;
//     reportQuery = `SELECT  e.EmployeeCode,e.FullName, p.ProjectCode, w.EntryDate,w.GenericTaskId,
//         w.Remarks, w.CreatedDateTime, w.Hours, t.TaskName, t.TaskDescription, t.TaskId,
//         (SELECT ProjectCode FROM project p1 WHERE p1.ProjectId = w.ProjectId) GTProjectCode,
//         t.EstimatedEffort, t.RemainingEffort, t.WorkItemKey,
//         0 as IsLeave,
//         gt.GenericTaskName
//          FROM work_log w
//          JOIN employee e ON w.EmployeeId = e.EmployeeId
//          LEFT JOIN task t ON w.TaskId = t.TaskId
//          LEFT JOIN project p ON t.ProjectId = p.ProjectId
//          LEFT JOIN generic_tasks gt ON w.GenericTaskId = gt.GenericTaskId
//          Where ${stringurl} AND ${itemKeyurl}
//          ORDER BY e.FullName ASC, w.EntryDate DESC`;


//     console.log(reportQuery);
//     connection.query(reportQuery, function (obj) {
//         res.send({
//             success: obj.error == null,
//             message: "success",
//             data: build_list(obj.response)
//         });
//     });


// }

// //Work log Report last Two week 
// exports.getWorklogs_reports_last_two_week_timePeriod = (req, res) => {

//     var stringurl = ``;
//     var itemKeyurl = ``;
//     if (req.query.AssigneeId != "ALL") {
//         if (req.query.ProjectId != "ALL") {
//             stringurl = `w.EmployeeId = '${req.query.AssigneeId}' AND (t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)`;
//         }
//         else {
//             stringurl = `w.EmployeeId = '${req.query.AssigneeId}'`;
//         }
//     }
//     else {
//         if (req.query.ProjectId != "ALL") {
//             stringurl = `(t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)
//                 AND (w.EmployeeId IN (SELECT EmployeeId FROM project_employee_map WHERE ProjectId = ${req.query.ProjectId})) `;
//         }
//         else {
//             stringurl = getAllEmployeesWhereClause(req)
//         }
//     }

//     if (req.query.Key != 'undefined') {
//         var key = req.query.Key;
//         var itemkey = key.split("");
//         if (itemkey.includes("-")) {
//             var code = key.split("-", 1);
//             var workitemkey = key.split("-")[1];

//             itemKeyurl = `w.EntryDate between 
//             '${req.query.lastTwoWeekStartDate}' AND '${req.query.lastWeekEndDate}' AND t.WorkItemKey LIKE '%${workitemkey}%' AND p.ProjectCode ='${code}' `;

//         } else {
//             itemKeyurl = `w.EntryDate between 
//             '${req.query.lastTwoWeekStartDate}' AND '${req.query.lastWeekEndDate}' AND  t.WorkItemKey LIKE '%${key}%'`;

//         }
//     } else {
//         itemKeyurl = `w.EntryDate between 
//         '${req.query.lastTwoWeekStartDate}' AND '${req.query.lastWeekEndDate}'`;
//     }

//     let reportQuery = ``;
//     reportQuery = `SELECT  e.EmployeeCode,e.FullName, p.ProjectCode, w.EntryDate,w.GenericTaskId,
//         w.Remarks, w.CreatedDateTime, w.Hours, t.TaskName, t.TaskDescription, t.TaskId,
//         (SELECT ProjectCode FROM project p1 WHERE p1.ProjectId = w.ProjectId) GTProjectCode,
//         t.EstimatedEffort, t.RemainingEffort, t.WorkItemKey,
//         0 as IsLeave,
//         gt.GenericTaskName
//          FROM work_log w
//          JOIN employee e ON w.EmployeeId = e.EmployeeId
//          LEFT JOIN task t ON w.TaskId = t.TaskId
//          LEFT JOIN project p ON t.ProjectId = p.ProjectId
//          LEFT JOIN generic_tasks gt ON w.GenericTaskId = gt.GenericTaskId
//          Where ${stringurl} AND ${itemKeyurl}
//          ORDER BY e.FullName ASC, w.EntryDate DESC`;


//     console.log(reportQuery);
//     connection.query(reportQuery, function (obj) {
//         res.send({
//             success: obj.error == null,
//             message: "success",
//             data: build_list(obj.response)
//         });
//     });


// }


// Yesterday insufficient hours

exports.Yesterday_insufficient_hours = (req, res) => {

    let reportQuery = `SELECT w.EmployeeId,e.EmployeeCode, e.FullName, SUM(w.Hours) AS TotalHours FROM work_log w
    JOIN employee e ON w.EmployeeId = e.EmployeeId
    JOIN task t ON w.TaskId=t.TaskId
    WHERE w.EntryDate = '${req.query.TimePeriodValue}' and t.ProjectId='${req.query.ProjectId}'
    GROUP BY w.EmployeeId
    HAVING TotalHours < 8`;


    console.log(reportQuery);
    connection.query(reportQuery, function (obj) {
        res.send({
            success: true,
            message: null,
            data: obj.response
        });
    });
}
// This Week insufficient hours

exports.This_week_insufficient_hours = (req, res) => {

    let reportQuery = `SELECT w.EmployeeId,e.EmployeeCode, e.FullName, SUM(w.Hours) AS TotalHours FROM work_log w
    JOIN employee e ON w.EmployeeId = e.EmployeeId
    JOIN task t ON w.TaskId=t.TaskId
    WHERE w.EntryDate Between  '${req.query.TimePeriodValue}' AND CURDATE() AND t.ProjectId='${req.query.ProjectId}'
    GROUP BY w.EmployeeId
    HAVING TotalHours < '${req.query.insufficientHour}'`;


    console.log(reportQuery);
    connection.query(reportQuery, function (obj) {
        res.send({
            success: true,
            message: null,
            data: obj.response
        });
    });
}

// This Month insufficient hours

exports.This_month_insufficient_hours = (req, res) => {

    let reportQuery = `SELECT w.EmployeeId,e.EmployeeCode, e.FullName, SUM(w.Hours) AS TotalHours FROM work_log w
    JOIN employee e ON w.EmployeeId = e.EmployeeId
    JOIN task t ON w.TaskId=t.TaskId
    WHERE w.EntryDate Between  '${req.query.TimePeriodValue}' AND CURDATE() AND t.ProjectId='${req.query.ProjectId}'
    GROUP BY w.EmployeeId
    HAVING TotalHours < '${req.query.insufficientHour}' `;


    console.log(reportQuery);
    connection.query(reportQuery, function (obj) {
        res.send({
            success: true,
            message: null,
            data: obj.response
        });
    });
}

//Utility function
function build_list(worklogs) {

    var return_list = [];

    worklogs.forEach(e => {

        var employee_obj = return_list.find(x => x.EmployeeCode == e.EmployeeCode);
        if (!employee_obj) {
            return_list.push({
                EmployeeId: e.EmployeeId,
                EmployeeCode: e.EmployeeCode,
                FullName: e.FullName,
                WorkLogs: [e]
            })

        } else {
            employee_obj.WorkLogs.push(e);
        }

    });

    var list = JSON.parse(JSON.stringify(return_list));

    list.forEach(item => {
        var date_wise = [];
        item.WorkLogs.forEach(e => {
            var date_obj = date_wise.find(x => x.Date == e.EntryDate);
            if (!date_obj) {
                date_wise.push({
                    Date: e.EntryDate,
                    logs: [e]
                });


            } else {
                date_obj.logs.push(e);
            }
        });

        //console.log(date_wise);
        item.WorkLogs = JSON.parse(JSON.stringify(date_wise));
    });

    return_list = JSON.parse(JSON.stringify(list));

    return return_list;
}

// This week and This Month missing  reports
exports.missing_reports = (req, res) => {

    let missingQuery = `SELECT e.EmployeeId, e.FullName, e.EmployeeCode, w.EntryDate, w.TaskId, w.GenericTaskId, pem.ProjectId
    FROM employee e
    LEFT JOIN work_log w ON e.EmployeeId = w.EmployeeId
    LEFT JOIN project_employee_map pem ON pem.EmployeeId = w.EmployeeId
    WHERE ((w.EntryDate BETWEEN '${req.query.StartDate}' and '${req.query.EndDate}') OR (w.EntryDate IS NULL))
    AND (pem.ProjectId = '${req.query.ProjectId}') OR (pem.ProjectId IS NULL AND w.GenericTaskId IS NOT NULL)`;


    console.log(missingQuery);
    connection.query(missingQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: "success",
            data: build_MissingDateslist(obj.response)
        });
    });

}

//Utility function
function build_MissingDateslist(worklogs) {
    var return_list = [];
    var dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - 1);
    var yesterday = moment(dateObj).format("YYYY-MM-DD");

    var This_month = ``;
    let d = new Date();
    This_month = moment(d).format("YYYY-MM-01");

    dataArray = [];
    var currentDate = moment(This_month);
    var stopDate = moment(yesterday);

    while (currentDate <= stopDate) {

        dataArray.push(moment(currentDate).format("YYYY-MM-DD"));
        currentDate = moment(currentDate).add(1, "days");
    }
    console.log("DataArray" + dataArray)

    console.log({ worklogs })

    worklogs.forEach(e => {
        var missingDates = [];
        var employee_obj = return_list.find(x => x.EmployeeCode == e.EmployeeCode);

        if (!employee_obj) {
            return_list.push({
                EmployeeId: e.EmployeeId,
                EmployeeCode: e.EmployeeCode,
                FullName: e.FullName,
                WorkLogs: []
            })
        } else {
            console.log("Entry Date " + e.EntryDate);
            for (var i = 0; i < dataArray.length; i++) {

                var entryDate = moment(e.EntryDate).format("YYYY-MM-DD");
                var allDates = moment(dataArray[i]).format("YYYY-MM-DD");
                console.log(entryDate == allDates)
                if (entryDate == allDates) {
                    continue;
                } else {
                    missingDates.push(dataArray[i]);
                }
            }
            console.log({ missingDates })
            employee_obj.WorkLogs.push(missingDates);
        }

    });

    return return_list;
}


/*-------------------------- Missing/Insufficient Reports (Written by Vikash) -------------------*/
exports.worklog_missing_all = (req, res) => {
    // console.log(req.query);
    var year = new Date().getFullYear();
    var startDate = new Date(req.query.StartDate);
    var endDate = new Date(req.query.EndDate);
    var totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1; //+1 makes the start date inclusive
    //console.log(totalDays);

    let query = `DROP TABLE IF EXISTS  t_days_of_the_week ;
                 CREATE TEMPORARY TABLE t_days_of_the_week AS 
                 SELECT DATE_ADD('${req.query.StartDate}', INTERVAL DoW DAY) AS EntryDate 
    FROM(SELECT 0 DOW `

    for (var i = 1; i < totalDays; i++) {
        query += `UNION ALL SELECT ${i} `
    }

    query += `)DoW;
                SELECT Supervisor, SupervisorId, Employee, EmployeeId, EmployeeCode, DATE_FORMAT(LogDate,'%d-%m-%Y') AS "LogDate", 
                HoursLogged AS "HoursLogged", (8-HoursLogged) AS "Shortfall",'' AS Remarks  
                FROM v_hours_logged 
                WHERE HoursLogged < 8
                AND LogDate BETWEEN '${req.query.StartDate}' AND  '${req.query.EndDate}'
                UNION
                SELECT E2.FullName AS "Supervisor",  E2.EmployeeId as SupervisorId,
                E1.FullName AS "Employee", E1.EmployeeId as EmployeeId, E1.EmployeeCode,
                DATE_FORMAT(tDoW.EntryDate,'%d-%m-%Y') AS "LogDate",'','','No Work Log Entered' AS Remarks 
                FROM employee E1,t_days_of_the_week tDoW, employee_supervisor_map ESM, employee E2 
                WHERE ESM.SuperviseeId=E1.EmployeeId 
                AND ESM.SupervisorId=E2.EmployeeId 
                AND WEEKDAY(tDoW.EntryDate) NOT IN (6)
                AND NOT EXISTS (SELECT 1 FROM v_hours_logged v1 WHERE v1.EmployeeId=E1.EmployeeId 
                AND v1.LogDate=tDoW.EntryDate)
                ORDER BY 1,2,3,STR_TO_DATE(LogDate, '%d-%m-%Y');`

    if (req.query.ProjectId == 'ALL' && req.query.SupervisorId == 'ALL') {
        query += `SELECT distinct EmployeeId FROM project_employee_map ;`
    }
    if (req.query.ProjectId != 'ALL' && req.query.SupervisorId == 'ALL') {
        if (req.query.EmployeeId) {
            query += `SELECT  EmployeeId FROM project_employee_map where ProjectId IN (${req.query.ProjectId}) AND EmployeeId IN(${req.query.EmployeeId});`
        } else {
            query += `SELECT EmployeeId FROM project_employee_map where ProjectId IN (${req.query.ProjectId});`
        }
    }
    if (req.query.ProjectId == 'ALL' && req.query.SupervisorId != 'ALL') {
        query += `SELECT SuperviseeId as EmployeeId FROM employee_supervisor_map where SupervisorId = ${req.query.SupervisorId};`
    }

    if (req.query.ProjectId != 'ALL' && req.query.SupervisorId != 'ALL') {
        if (req.query.EmployeeId) {
            query += `SELECT SuperviseeId as EmployeeId FROM employee_supervisor_map ESM 
        join project_employee_map PEM on ESM.SuperviseeId =  PEM.EmployeeId
         where ESM.SupervisorId = ${req.query.SupervisorId} and PEM.projectId IN (${req.query.ProjectId}) AND EmployeeId IN(${req.query.EmployeeId});`
        } else {
            query += `SELECT SuperviseeId as EmployeeId FROM employee_supervisor_map ESM 
        join project_employee_map PEM on ESM.SuperviseeId =  PEM.EmployeeId
         where ESM.SupervisorId = ${req.query.SupervisorId} and PEM.projectId IN (${req.query.ProjectId});`
        }
    }
    query += `SELECT  DATE_FORMAT(Date,'%d-%m-%Y') AS "Holiday_date" FROM holiday_list WHERE year(Date) = '${year}';`

    if (req.query.EmployeeId) {
        query += `SELECT  DATE_FORMAT(LeaveDate,'%d-%m-%Y') AS "Leave_date",EmployeeId FROM leave_record WHERE LeaveDate BETWEEN '${req.query.StartDate}' AND  '${req.query.EndDate}' AND EmployeeId IN(${req.query.EmployeeId});`
    } else {
        query += `SELECT  DATE_FORMAT(LeaveDate,'%d-%m-%Y') AS "Leave_date",EmployeeId FROM leave_record WHERE LeaveDate BETWEEN '${req.query.StartDate}' AND  '${req.query.EndDate}'`
    }

    console.log(query);

    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: buildMissingReportData(obj.response, req.query.ProjectId, req.query.SupervisorId)
            //data: obj.response
        });


        //console.log(employeesToShow);
    });

}


function buildMissingReportData(response, ProjectId, SupervisorId) {

    var filteredItems = [];
    var holidays = [];
    var leave_record = [];
    //console.log
    // console.log(ProjectId);
    // if (ProjectId == "ALL" && SupervisorId == "ALL")
    //     return response[2];

    // if (ProjectId != "ALL") {
    var employeesToShow = [];
    response[3].forEach((i) => {
        employeesToShow.push(i.EmployeeId);
    })
    // console.log(employeesToShow)
    // console.log(response[2]);
    response[2].forEach(function (item, index) {
        if (employeesToShow.includes(item.EmployeeId)) {
            filteredItems.push(item);
        }
    })
    // }

    response[4].forEach(function (item, index) {
        holidays.push(item);
    })
    //console.log(holidays)

    response[5].forEach(function (item, index) {
        leave_record.push(item);
    })


    for (var i = 0; i < holidays.length; i++) {

        for (var j = 0; j < filteredItems.length; j++) {
            if (filteredItems[j].LogDate == holidays[i].Holiday_date) {
                console.log(filteredItems[j].LogDate)
                filteredItems.splice(j, 1)

            }

        }
    }


    for (var k = 0; k < leave_record.length; k++) {

        for (var l = 0; l < filteredItems.length; l++) {
            if (filteredItems[l].LogDate == leave_record[k].Leave_date && filteredItems[l].EmployeeId == leave_record[k].EmployeeId) {
                console.log(filteredItems[l].LogDate)
                filteredItems.splice(l, 1)

            }

        }
    }

    var distinctIds = [...new Set(filteredItems.map(x => x.EmployeeId))];
    var results = [];
    // console.log(distinctIds);

    for (var i = 0; i < distinctIds.length; i++) {
        var obj = {
            EmployeeId: distinctIds[i],
            EmployeeName: '',
            MissingWorklogs: []
        }
        //obj.EmployeeId = distinctIds[i];
        filteredItems.forEach(function (item, index) {

            if (item.EmployeeId == distinctIds[i]) {
                obj.EmployeeName = item.Employee;
                obj.EmployeeCode = item.EmployeeCode;
                let formattedDate = item.LogDate.split('-').reverse().join('-');
                let day = new Date(formattedDate).getDay();

                if (day == 6 && item.HoursLogged)
                    item.Shortfall = item.Shortfall - 4;

                if (item.Shortfall > 0 || !item.HoursLogged)
                    obj.MissingWorklogs.push({
                        LogDate: item.LogDate,
                        HoursLogged: item.HoursLogged,
                        Shortfall: item.Shortfall,
                        Supervisor: item.Supervisor,
                        SupervisorId: item.SupervisorId,
                        Remarks: item.Remarks
                    })
            }

        })
        results.push(obj);
    }
    // console.log(results);
    return results;

}


//Work logs Reporsts Max And Min Date 
exports.getWorklogs_non_project_reports = (req, res) => {
    var stringurl = ``;
    var itemKeyurl = ``;
    if (req.query.AssigneeId != "ALL") {
        if (req.query.ProjectId != "ALL") {
            stringurl = `w.EmployeeId = '${req.query.AssigneeId}' AND (t.ProjectId = ${req.query.ProjectId} OR (gt.GenericTaskId IS NOT NULL and w.ProjectId =  ${req.query.ProjectId}))`;
        }
        else {
            stringurl = `w.EmployeeId = '${req.query.AssigneeId}'`;
        }
    }
    else {
        if (req.query.ProjectId != "ALL") {
            stringurl = `(t.ProjectId = ${req.query.ProjectId} OR (gt.GenericTaskId IS NOT NULL and w.ProjectId =  ${req.query.ProjectId})) `;
        }
        else {
            stringurl = getAllEmployeesWhereClause(req)
        }
    }

    if (req.query.Key != 'undefined') {
        var key = req.query.Key;
        var itemkey = key.split("");
        if (itemkey.includes("-")) {
            var code = key.split("-", 1);
            var workitemkey = key.split("-")[1];

            itemKeyurl = `w.EntryDate between 
            '${req.query.MinDate}' AND '${req.query.MaxDate}'  AND t.WorkItemKey LIKE '%${workitemkey}%' AND p.ProjectCode ='${code}' `;

        } else {
            itemKeyurl = ` w.EntryDate between '${req.query.MinDate}' AND '${req.query.MaxDate}' AND  t.WorkItemKey LIKE '%${key}%'`;

        }
    } else {
        itemKeyurl = `w.EntryDate between 
        '${req.query.MinDate}' AND '${req.query.MaxDate}'`;
    }
    let reportQuery = ``;
    reportQuery = `SELECT e.EmployeeCode,e.FullName, p.ProjectCode,w.EntryDate, w.GenericTaskId,
        w.Remarks, w.CreatedDateTime, w.Hours, t.TaskName, t.TaskDescription, t.TaskId,
        (SELECT ProjectCode FROM project p1 WHERE p1.ProjectId = w.ProjectId) GTProjectCode,
        t.EstimatedEffort, t.RemainingEffort, t.WorkItemKey,
        0 as IsLeave,
        gt.GenericTaskName
         FROM work_log w
         JOIN employee e ON w.EmployeeId = e.EmployeeId
         LEFT JOIN task t ON w.TaskId = t.TaskId
         LEFT JOIN project p ON t.ProjectId = p.ProjectId
         LEFT JOIN generic_tasks gt ON w.GenericTaskId = gt.GenericTaskId
         Where  ${stringurl} AND ${itemKeyurl}    
         ORDER BY e.FullName ASC, w.EntryDate DESC`;


    console.log(reportQuery);
    connection.query(reportQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: "success",
            data: build_list(obj.response)
        });
    });

}
