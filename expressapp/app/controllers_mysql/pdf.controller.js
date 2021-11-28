const connection = require('./mysql.controller');
const Constants = require('../../config/constants.js');
var moment = require('moment');




exports.workitems_byresource_report = (req, res) => {
    var pdf = require('html-pdf');


    var query = `SELECT 
    t.TaskId, t.TaskName, tt.IconClass, tt.TaskTypeName, ts.StatusText,
    CONCAT( p.ProjectCode, '-', t.WorkItemKey ) WorkItemKey, 
        t.AssigneeId, e.FullName, e.EmployeeCode FROM task t
        JOIN task_type tt ON t.TaskTypeId = tt.TaskTypeId
        JOIN task_status ts ON t.TaskStatusId = ts.TaskStatusId
        JOIN project p ON p.ProjectId = t.ProjectId
        JOIN employee e ON e.EmployeeId = t.AssigneeId
        WHERE (ts.IsOpenStatus = 'Y' OR ts.IsInProgressStatus = 'Y')
        ORDER BY e.FullName, t.TaskId`;


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
                    IconClass: e.IconClass,
                    StatusText: e.StatusText
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
                        IconClass: e.IconClass,
                        StatusText: e.StatusText
                    }]
                })
            }
        })


        var data = ``;

        response.forEach(e => {
            data += `<h2 style="margin-bottom:10px; margin-top:15px; color:#59a">${e.Assignee}</h2>`;
            data += `<table>`;
            data += `<tr>
                        <th>Item Type</th>
                        <th>Key</tth>
                        <th>Work Item Name</th>
                        <th>Status</th>
                     </tr>`;
            var itemcount = 0;
            var CountIn_Prog = 0;
            var countDevTask = 0;
            var countSysDefect = 0;
            var countImprovement = 0;
            var countChange = 0;
            e.WorkItems.forEach(w => {
                data += `<tr>
                            <td style="width:4%;text-align:center"><i class="${w.IconClass}" style="font-size:22px"></i></td>
                            <td style="width:10%">${w.WorkItemKey}</td>
                            <td>${w.TaskName}</td>
                            <td style="width:10%">${w.StatusText}</td>
                        </tr>`;
                itemcount += 1;
                if (w.TaskTypeName == "Development Task") {
                    countDevTask += 1;
                } else if (w.TaskTypeName == "System Defect") {
                    countSysDefect += 1;
                } else if (w.TaskTypeName == "Improvement") {
                    countImprovement += 1;
                }
                else if (w.TaskTypeName == "Change") {
                    countChange += 1;
                }
                if (w.StatusText == "In Progress") {
                    CountIn_Prog += 1;
                }
            });
            data += `<h3><b>Total items assigned: ${itemcount}</b></h3>`;
            data += `<h3><b>Development Tasks assigned: ${countDevTask}</b></h3>`;
            data += `<h3><b>System Defects assigned: ${countSysDefect}</b></h3>`;
            data += `<h3><b>Improvements assigned: ${countImprovement}</b></h3>`;
            data += `<h3><b>Changes assigned: ${countChange}</b></h3>`;
            data += `<h3><b>Total in progress: ${CountIn_Prog}</b></h3>`;

            data += `</table>`;
            // data += `<table>`;

            // data += `<tr>
            // <td><b>Total items assigned:</b></td>
            // <td>${itemcount}</td>
            // </tr>
            // <tr>
            // <td><b>Development Tasks assigned:</b>
            // <td>${countDevTask}</td>
            // </tr>
            // <tr>
            // <td><b>System Defects assigned:</b></td>
            // <td>${countSysDefect}</td>
            // </tr>
            // <tr>
            // <td><b>Improvements assigned:</b></td>
            // <td>${countImprovement}</td>
            // </tr>
            // <tr>
            // <td><b>Changes assigned:</b></td>
            // <td>${countChange}</td>
            // </tr>
            // <tr>
            // <td><b>Total in progress:</b></td>
            // <td>${CountIn_Prog}</td>
            //  </tr>`;
            // data += `</table>`;
            data += `<p style="page-break-after:always">&nbsp;</p>`;
        });


        var html = getTemplate(data, 'Work Items by Resource');


        var options = {
            format: 'A3',
            orientation: 'landscape',
            border: '0.5in',
            footer: {
                height: "28mm",
                contents: {
                    default: '<div style="text-align:right"><span style="color: #444;">{{page}}</span> of <span>{{pages}}</span></div>'
                }
            }
        };

        var timestamp = (new Date()).toISOString().replace(/:/g, "__");
        var pdfFilename = "REPORT__" + timestamp + ".pdf";
        var fullFilename = Constants.PDF_PATH + pdfFilename;

        pdf.create(html, options).toFile(fullFilename, function (err, resPdf) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: '500: Internal Server Error',
                    data: null,
                    filename: null
                });
            }
            else {
                return res.status(200).send({
                    success: true,
                    message: 'Success',
                    data: resPdf,
                    filename: pdfFilename
                });
            }
        });
    });
}

//work item project by resource

exports.workitems_project_byresource_report = (req, res) => {
    var pdf = require('html-pdf');


    var query = `SELECT 
    t.TaskId, t.TaskName, tt.IconClass, tt.TaskTypeName, ts.StatusText,
    CONCAT( p.ProjectCode, '-', t.WorkItemKey ) WorkItemKey, 
        t.AssigneeId, e.FullName, e.EmployeeCode FROM task t
        JOIN task_type tt ON t.TaskTypeId = tt.TaskTypeId
        JOIN task_status ts ON t.TaskStatusId = ts.TaskStatusId
        JOIN project p ON p.ProjectId = t.ProjectId
        JOIN employee e ON e.EmployeeId = t.AssigneeId
        WHERE (ts.IsOpenStatus = 'Y' OR ts.IsInProgressStatus = 'Y')
        AND t.ProjectId='${req.query.ProjectId}'
        ORDER BY e.FullName, t.TaskId`;


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
                    IconClass: e.IconClass,
                    StatusText: e.StatusText
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
                        IconClass: e.IconClass,
                        StatusText: e.StatusText
                    }]
                })
            }
        })


        var data = ``;

        response.forEach(e => {
            data += `<h2 style="margin-bottom:10px; margin-top:15px; color:#59a">${e.Assignee}</h2>`;
            data += `<table>`;
            data += `<tr>
                        <th>Item Type</th>
                        <th>Key</tth>
                        <th>Work Item Name</th>
                        <th>Status</th>
                     </tr>`;
            var itemcount = 0;
            var CountIn_Prog = 0;
            var countDevTask = 0;
            var countSysDefect = 0;
            var countImprovement = 0;
            var countChange = 0;
            e.WorkItems.forEach(w => {
                data += `<tr>
                            <td style="width:4%;text-align:center"><i class="${w.IconClass}" style="font-size:22px"></i></td>
                            <td style="width:10%">${w.WorkItemKey}</td>
                            <td>${w.TaskName}</td>
                            <td style="width:10%">${w.StatusText}</td>
                        </tr>`;
                itemcount += 1;
                if (w.TaskTypeName == "Development Task") {
                    countDevTask += 1;
                } else if (w.TaskTypeName == "System Defect") {
                    countSysDefect += 1;
                } else if (w.TaskTypeName == "Improvement") {
                    countImprovement += 1;
                }
                else if (w.TaskTypeName == "Change") {
                    countChange += 1;
                }
                if (w.StatusText == "In Progress") {
                    CountIn_Prog += 1;
                }
            });
            data += `<h3><b>Total items assigned: ${itemcount}</b></h3>`;
            data += `<h3><b>Development Tasks assigned: ${countDevTask}</b></h3>`;
            data += `<h3><b>System Defects assigned: ${countSysDefect}</b></h3>`;
            data += `<h3><b>Improvements assigned: ${countImprovement}</b></h3>`;
            data += `<h3><b>Changes assigned: ${countChange}</b></h3>`;
            data += `<h3><b>Total in progress: ${CountIn_Prog}</b></h3>`;

            data += `</table>`;

            data += `<p style="page-break-after:always">&nbsp;</p>`;
        });


        var html = getTemplate(data, 'Work Items by Resource');


        var options = {
            format: 'A3',
            orientation: 'landscape',
            border: '0.5in',
            footer: {
                height: "28mm",
                contents: {
                    default: '<div style="text-align:right"><span style="color: #444;">{{page}}</span> of <span>{{pages}}</span></div>'
                }
            }
        };

        var timestamp = (new Date()).toISOString().replace(/:/g, "__");
        var pdfFilename = "REPORT__" + timestamp + ".pdf";
        var fullFilename = Constants.PDF_PATH + pdfFilename;

        pdf.create(html, options).toFile(fullFilename, function (err, resPdf) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: '500: Internal Server Error',
                    data: null,
                    filename: null
                });
            }
            else {
                return res.status(200).send({
                    success: true,
                    message: 'Success',
                    data: resPdf,
                    filename: pdfFilename
                });
            }
        });
    });
}

function getAllEmployeesWhereClause(req) {
    return `w.EmployeeId IN (${req.query.employees})`;
}

//Worklogs Report pdf
exports.worklogs_report_pdf = (req, res) => {
    var pdf = require('html-pdf');

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
        w.Remarks, w.CreatedDateTime, w.Hours, t.TaskName, t.TaskDescription, t.TaskId,t.WorkItemKey,
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


    connection.query(reportQuery, function (obj) {

        var response = [];

        obj.response.forEach(e => {
            var item = response.find(o => o.EmployeeCode == e.EmployeeCode);

            if (item) {
                item.WorkItems.push({

                    ProjectCode: e.ProjectCode,
                    TaskTypeName: e.TaskTypeName,
                    TaskName: e.TaskName,
                    TaskId: e.TaskId,
                    Remarks: e.Remarks,
                    Hours: e.Hours,
                    EntryDate: e.EntryDate,
                    WorkItemKey: e.WorkItemKey,
                    CreatedDateTime: e.CreatedDateTime,
                    GenericTaskName: e.GenericTaskName
                });
            }
            else {
                response.push({
                    EmployeeCode: e.EmployeeCode,
                    FullName: e.FullName,
                    WorkItems: [{
                        ProjectCode: e.ProjectCode,
                        TaskTypeName: e.TaskTypeName,
                        TaskName: e.TaskName,
                        TaskId: e.TaskId,
                        Remarks: e.Remarks,
                        Hours: e.Hours,
                        EntryDate: e.EntryDate,
                        WorkItemKey: e.WorkItemKey,
                        CreatedDateTime: e.CreatedDateTime,
                        GenericTaskName: e.GenericTaskName
                    }]
                })
            }
        })


        var data = ``;

        response.forEach(e => {
            data += `<h2 style="margin-bottom:10px; margin-top:15px; color:#59a">${e.FullName}</h2>`;
            data += `<table>`;
            data += `<tr>
                         <th>Entry Date</th>
                            <th>Key</th>
                            <th>Work Item Name</th>
                            <th>Time Spent</th>
                            <th>Remarks</th>
                            <th>Created At</th>
                        </tr>`;

            e.WorkItems.forEach(w => {
                data += `<tr>
                            <td>${moment(w.EntryDate).format("MMM Do YYYY")}</td>
                            <td>${w.ProjectCode == null ? "" : w.ProjectCode + "-"}${w.WorkItemKey == null ? "" : w.WorkItemKey}</td>
                            <td>${w.GenericTaskName ? w.GenericTaskName : w.TaskName}</td>
                            <td>${w.Hours}</td>
                            <td>${w.Remarks}</td>
                            <td>${moment(w.CreatedDateTime).format("MMM Do YYYY, h:mm A")}</td>
                        </tr>`;
            });

            data += `</table>`;
            data += `<p style="page-break-after:always">&nbsp;</p>`;
        });


        var html = getTemplate(data, 'Work Logs ');


        var options = {
            format: 'A3',
            orientation: 'landscape',
            border: '0.5in',
            footer: {
                height: "28mm",
                contents: {
                    default: '<div style="text-align:right"><span style="color: #444;">{{page}}</span> of <span>{{pages}}</span></div>'
                }
            }
        };

        var timestamp = (new Date()).toISOString().replace(/:/g, "__");
        var pdfFilename = "REPORT__" + timestamp + ".pdf";
        var fullFilename = Constants.PDF_PATH + pdfFilename;

        pdf.create(html, options).toFile(fullFilename, function (err, resPdf) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: '500: Internal Server Error',
                    data: null,
                    filename: null
                });
            }
            else {
                return res.status(200).send({
                    success: true,
                    message: 'Success',
                    data: resPdf,
                    filename: pdfFilename
                });
            }
        });
    });
}


//Worklogs Report using time period pdf ##
exports.worklogs_report_timeperiod_pdf = (req, res) => {
    var pdf = require('html-pdf');

    var stringurl = ``;
    if (req.query.AssigneeId != ``) {
        if (req.query.ProjectId != "ALL") {
            stringurl = `w.EmployeeId = '${req.query.AssigneeId}' AND (t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)`;
        }
        else {
            stringurl = `w.EmployeeId = '${req.query.AssigneeId}'`;
        }
    }
    else {
        if (req.query.ProjectId != "ALL") {
            stringurl = `(t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)
                AND (w.EmployeeId IN (SELECT EmployeeId FROM project_employee_map WHERE ProjectId = ${req.query.ProjectId})) `;
        }

    }

    let reportQuery = ``;
    reportQuery = `SELECT  e.EmployeeCode,e.FullName, p.ProjectCode, w.EntryDate,w.GenericTaskId,
    w.Remarks, w.CreatedDateTime, w.Hours, t.TaskName, t.TaskDescription, t.TaskId,t.WorkItemKey,
    t.EstimatedEffort, t.RemainingEffort, t.WorkItemKey,
    0 as IsLeave,
    gt.GenericTaskName
     FROM work_log w
     JOIN employee e ON w.EmployeeId = e.EmployeeId
     LEFT JOIN task t ON w.TaskId = t.TaskId
     LEFT JOIN project p ON t.ProjectId = p.ProjectId
     LEFT JOIN generic_tasks gt ON w.GenericTaskId = gt.GenericTaskId
     Where ${stringurl} and w.EntryDate between 
     '${req.query.TimePeriodValue}' and now()
     ORDER BY w.EntryDate DESC`;


    connection.query(reportQuery, function (obj) {

        var response = [];

        obj.response.forEach(e => {
            var item = response.find(o => o.EmployeeCode == e.EmployeeCode);

            if (item) {
                item.WorkItems.push({

                    ProjectCode: e.ProjectCode,
                    TaskTypeName: e.TaskTypeName,
                    TaskName: e.TaskName,
                    TaskId: e.TaskId,
                    Remarks: e.Remarks,
                    Hours: e.Hours,
                    EntryDate: e.EntryDate,
                    WorkItemKey: e.WorkItemKey,
                    CreatedDateTime: e.CreatedDateTime,
                    GenericTaskName: e.GenericTaskName
                });
            }
            else {
                response.push({
                    EmployeeCode: e.EmployeeCode,
                    FullName: e.FullName,
                    WorkItems: [{
                        ProjectCode: e.ProjectCode,
                        TaskTypeName: e.TaskTypeName,
                        TaskName: e.TaskName,
                        TaskId: e.TaskId,
                        Remarks: e.Remarks,
                        Hours: e.Hours,
                        EntryDate: e.EntryDate,
                        WorkItemKey: e.WorkItemKey,
                        CreatedDateTime: e.CreatedDateTime,
                        GenericTaskName: e.GenericTaskName
                    }]
                })
            }
        })


        var data = ``;

        response.forEach(e => {
            data += `<h2 style="margin-bottom:10px; margin-top:15px; color:#59a">${e.FullName}</h2>`;
            data += `<table>`;
            data += `<tr>
                         <th>Entry Date</th>
                            <th>Key</th>
                            <th>Work Item Name</th>
                            <th>Time Spent</th>
                            <th>Remarks</th>
                            <th>Created At</th>
                        </tr>`;

            e.WorkItems.forEach(w => {
                data += `<tr>
                            <td>${moment(w.EntryDate).format("MMM Do YYYY")}</td>
                            <td>${w.ProjectCode == null ? "" : w.ProjectCode + "-"}${w.WorkItemKey == null ? "" : w.WorkItemKey}</td>
                            <td>${w.GenericTaskName ? w.GenericTaskName : w.TaskName}</td>
                            <td>${w.Hours}</td>
                            <td>${w.Remarks}</td>
                            <td>${moment(w.CreatedDateTime).format("MMM Do YYYY, h:mm A")}</td>
                        </tr>`;
            });

            data += `</table>`;
            data += `<p style="page-break-after:always">&nbsp;</p>`;
        });


        var html = getTemplate(data, 'Work Logs ');


        var options = {
            format: 'A3',
            orientation: 'landscape',
            border: '0.5in',
            footer: {
                height: "28mm",
                contents: {
                    default: '<div style="text-align:right"><span style="color: #444;">{{page}}</span> of <span>{{pages}}</span></div>'
                }
            }
        };

        var timestamp = (new Date()).toISOString().replace(/:/g, "__");
        var pdfFilename = "REPORT__" + timestamp + ".pdf";
        var fullFilename = Constants.PDF_PATH + pdfFilename;

        pdf.create(html, options).toFile(fullFilename, function (err, resPdf) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: '500: Internal Server Error',
                    data: null,
                    filename: null
                });
            }
            else {
                return res.status(200).send({
                    success: true,
                    message: 'Success',
                    data: resPdf,
                    filename: pdfFilename
                });
            }
        });
    });
}

//Worklogs Report using time ;last week  period pdf ##
exports.worklogs_report_last_week_timeperiod_pdf = (req, res) => {
    var pdf = require('html-pdf');

    var stringurl = ``;
    if (req.query.AssigneeId != ``) {
        if (req.query.ProjectId != "ALL") {
            stringurl = `w.EmployeeId = '${req.query.AssigneeId}' AND (t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)`;
        }
        else {
            stringurl = `w.EmployeeId = '${req.query.AssigneeId}'`;
        }
    }
    else {
        if (req.query.ProjectId != "ALL") {
            stringurl = `(t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)
                AND (w.EmployeeId IN (SELECT EmployeeId FROM project_employee_map WHERE ProjectId = ${req.query.ProjectId})) `;
        }

    }

    let reportQuery = ``;
    reportQuery = `SELECT  e.EmployeeCode,e.FullName, p.ProjectCode, w.EntryDate,w.GenericTaskId,
    w.Remarks, w.CreatedDateTime, w.Hours, t.TaskName, t.TaskDescription, t.TaskId,t.WorkItemKey,
    t.EstimatedEffort, t.RemainingEffort, t.WorkItemKey,
    0 as IsLeave,
    gt.GenericTaskName
     FROM work_log w
     JOIN employee e ON w.EmployeeId = e.EmployeeId
     LEFT JOIN task t ON w.TaskId = t.TaskId
     LEFT JOIN project p ON t.ProjectId = p.ProjectId
     LEFT JOIN generic_tasks gt ON w.GenericTaskId = gt.GenericTaskId
     Where ${stringurl} and w.EntryDate between 
     '${req.query.lastWeekStartDate}' AND '${req.query.lastWeekEndDate}'
     ORDER BY w.EntryDate DESC`;


    connection.query(reportQuery, function (obj) {

        var response = [];

        obj.response.forEach(e => {
            var item = response.find(o => o.EmployeeCode == e.EmployeeCode);

            if (item) {
                item.WorkItems.push({

                    ProjectCode: e.ProjectCode,
                    TaskTypeName: e.TaskTypeName,
                    TaskName: e.TaskName,
                    TaskId: e.TaskId,
                    Remarks: e.Remarks,
                    Hours: e.Hours,
                    EntryDate: e.EntryDate,
                    WorkItemKey: e.WorkItemKey,
                    CreatedDateTime: e.CreatedDateTime,
                    GenericTaskName: e.GenericTaskName
                });
            }
            else {
                response.push({
                    EmployeeCode: e.EmployeeCode,
                    FullName: e.FullName,
                    WorkItems: [{
                        ProjectCode: e.ProjectCode,
                        TaskTypeName: e.TaskTypeName,
                        TaskName: e.TaskName,
                        TaskId: e.TaskId,
                        Remarks: e.Remarks,
                        Hours: e.Hours,
                        EntryDate: e.EntryDate,
                        WorkItemKey: e.WorkItemKey,
                        CreatedDateTime: e.CreatedDateTime,
                        GenericTaskName: e.GenericTaskName
                    }]
                })
            }
        })


        var data = ``;

        response.forEach(e => {
            data += `<h2 style="margin-bottom:10px; margin-top:15px; color:#59a">${e.FullName}</h2>`;
            data += `<table>`;
            data += `<tr>
                         <th>Entry Date</th>
                            <th>Key</th>
                            <th>Work Item Name</th>
                            <th>Time Spent</th>
                            <th>Remarks</th>
                            <th>Created At</th>
                        </tr>`;

            e.WorkItems.forEach(w => {
                data += `<tr>
                            <td>${moment(w.EntryDate).format("MMM Do YYYY")}</td>
                            <td>${w.ProjectCode == null ? "" : w.ProjectCode + "-"}${w.WorkItemKey == null ? "" : w.WorkItemKey}</td>
                            <td>${w.GenericTaskName ? w.GenericTaskName : w.TaskName}</td>
                            <td>${w.Hours}</td>
                            <td>${w.Remarks}</td>
                            <td>${moment(w.CreatedDateTime).format("MMM Do YYYY, h:mm A")}</td>
                        </tr>`;
            });

            data += `</table>`;
            data += `<p style="page-break-after:always">&nbsp;</p>`;
        });


        var html = getTemplate(data, 'Work Logs ');


        var options = {
            format: 'A3',
            orientation: 'landscape',
            border: '0.5in',
            footer: {
                height: "28mm",
                contents: {
                    default: '<div style="text-align:right"><span style="color: #444;">{{page}}</span> of <span>{{pages}}</span></div>'
                }
            }
        };

        var timestamp = (new Date()).toISOString().replace(/:/g, "__");
        var pdfFilename = "REPORT__" + timestamp + ".pdf";
        var fullFilename = Constants.PDF_PATH + pdfFilename;

        pdf.create(html, options).toFile(fullFilename, function (err, resPdf) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: '500: Internal Server Error',
                    data: null,
                    filename: null
                });
            }
            else {
                return res.status(200).send({
                    success: true,
                    message: 'Success',
                    data: resPdf,
                    filename: pdfFilename
                });
            }
        });
    });
}



// Work Logs this month Insufficient Hours 
exports.worklogs_this_month_insufficient_hours_report_pdf = (req, res) => {
    var pdf = require('html-pdf');

    let reportQuery = `SELECT w.EmployeeId,e.EmployeeCode, e.FullName, SUM(w.Hours) AS TotalHours FROM work_log w
    JOIN employee e ON w.EmployeeId = e.EmployeeId
    JOIN task t ON w.TaskId=t.TaskId
    WHERE w.EntryDate Between  '${req.query.TimePeriodValue}' and now() and t.ProjectId='${req.query.ProjectId}'
    GROUP BY w.EmployeeId
    HAVING TotalHours < '${req.query.insufficientHour}' `;


    connection.query(reportQuery, function (obj) {

        var response = [];

        obj.response.forEach(e => {
            var item = response.find(o => o.EmployeeCode == e.EmployeeCode);

            if (item) {
                item.WorkItems.push({

                    EmployeeCode: e.EmployeeCode,
                    FullName: e.FullName,
                    TotalHours: e.TotalHours

                });
            }
            else {
                response.push({
                    EmployeeCode: e.EmployeeCode,
                    FullName: e.FullName,
                    WorkItems: [{
                        EmployeeCode: e.EmployeeCode,
                        FullName: e.FullName,
                        TotalHours: e.TotalHours
                    }]
                })
            }
        })


        var data = ``;

        response.forEach(e => {
            data += `<h2 style="margin-bottom:10px; margin-top:15px; color:#59a">${e.FullName}</h2>`;


            e.WorkItems.forEach(w => {
                data += `<div>
                <h3>Employee Code : ${w.EmployeeCode}</h3>
                <h3>Total Hours : ${w.TotalHours.toFixed(2)}</h3>
                </div>`;
            });


            // data += `<p style="page-break-after:always">&nbsp;</p>`;
        });


        var html = getTemplate(data, 'Insufficient Work Log Hours (This Month) ');


        var options = {
            format: 'A3',
            orientation: 'landscape',
            border: '0.5in',
            footer: {
                height: "28mm",
                contents: {
                    default: '<div style="text-align:right"><span style="color: #444;">{{page}}</span> of <span>{{pages}}</span></div>'
                }
            }
        };

        var timestamp = (new Date()).toISOString().replace(/:/g, "__");
        var pdfFilename = "REPORT__" + timestamp + ".pdf";
        var fullFilename = Constants.PDF_PATH + pdfFilename;

        pdf.create(html, options).toFile(fullFilename, function (err, resPdf) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: '500: Internal Server Error',
                    data: null,
                    filename: null
                });
            }
            else {
                return res.status(200).send({
                    success: true,
                    message: 'Success',
                    data: resPdf,
                    filename: pdfFilename
                });
            }
        });
    });
}

// Work Logs Yesterday Insufficient Hours 
exports.worklogs_yesterday_insufficient_hours_report_pdf = (req, res) => {
    var pdf = require('html-pdf');

    let reportQuery = `SELECT w.EmployeeId,e.EmployeeCode, e.FullName, SUM(w.Hours) AS TotalHours FROM work_log w
    JOIN employee e ON w.EmployeeId = e.EmployeeId
    JOIN task t ON w.TaskId=t.TaskId
    WHERE w.EntryDate = '${req.query.TimePeriodValue}' and t.ProjectId='${req.query.ProjectId}'
    GROUP BY w.EmployeeId
    HAVING TotalHours < 8`;


    connection.query(reportQuery, function (obj) {

        var response = [];

        obj.response.forEach(e => {
            var item = response.find(o => o.EmployeeCode == e.EmployeeCode);

            if (item) {
                item.WorkItems.push({

                    EmployeeCode: e.EmployeeCode,
                    FullName: e.FullName,
                    TotalHours: e.TotalHours

                });
            }
            else {
                response.push({
                    EmployeeCode: e.EmployeeCode,
                    FullName: e.FullName,
                    WorkItems: [{
                        EmployeeCode: e.EmployeeCode,
                        FullName: e.FullName,
                        TotalHours: e.TotalHours
                    }]
                })
            }
        })


        var data = ``;

        response.forEach(e => {
            data += `<h2 style="margin-bottom:10px; margin-top:15px; color:#59a">${e.FullName}</h2>`;


            e.WorkItems.forEach(w => {
                data += `<div>
                <h3>Employee Code : ${w.EmployeeCode}</h3>
                <h3>Total Hours : ${w.TotalHours.toFixed(2)}</h3>
                </div>`;
            });


            // data += `<p style="page-break-after:always">&nbsp;</p>`;
        });


        var html = getTemplate(data, 'Insufficient Work Log Hours (Yesterday) ');


        var options = {
            format: 'A3',
            orientation: 'landscape',
            border: '0.5in',
            footer: {
                height: "28mm",
                contents: {
                    default: '<div style="text-align:right"><span style="color: #444;">{{page}}</span> of <span>{{pages}}</span></div>'
                }
            }
        };

        var timestamp = (new Date()).toISOString().replace(/:/g, "__");
        var pdfFilename = "REPORT__" + timestamp + ".pdf";
        var fullFilename = Constants.PDF_PATH + pdfFilename;

        pdf.create(html, options).toFile(fullFilename, function (err, resPdf) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: '500: Internal Server Error',
                    data: null,
                    filename: null
                });
            }
            else {
                return res.status(200).send({
                    success: true,
                    message: 'Success',
                    data: resPdf,
                    filename: pdfFilename
                });
            }
        });
    });
}


// Work Logs this Week Insufficient Hours 
exports.worklogs_this_week_insufficient_hours_report_pdf = (req, res) => {
    var pdf = require('html-pdf');

    let reportQuery = `SELECT w.EmployeeId,e.EmployeeCode, e.FullName, SUM(w.Hours) AS TotalHours FROM work_log w
    JOIN employee e ON w.EmployeeId = e.EmployeeId
    JOIN task t ON w.TaskId=t.TaskId
    WHERE w.EntryDate Between  '${req.query.TimePeriodValue}' AND CURDATE() AND t.ProjectId='${req.query.ProjectId}'
    GROUP BY w.EmployeeId
    HAVING TotalHours < '${req.query.insufficientHour}'`;


    connection.query(reportQuery, function (obj) {

        var response = [];

        obj.response.forEach(e => {
            var item = response.find(o => o.EmployeeCode == e.EmployeeCode);

            if (item) {
                item.WorkItems.push({

                    EmployeeCode: e.EmployeeCode,
                    FullName: e.FullName,
                    TotalHours: e.TotalHours

                });
            }
            else {
                response.push({
                    EmployeeCode: e.EmployeeCode,
                    FullName: e.FullName,
                    WorkItems: [{
                        EmployeeCode: e.EmployeeCode,
                        FullName: e.FullName,
                        TotalHours: e.TotalHours
                    }]
                })
            }
        })


        var data = ``;

        response.forEach(e => {
            data += `<h2 style="margin-bottom:10px; margin-top:15px; color:#59a">${e.FullName}</h2>`;


            e.WorkItems.forEach(w => {
                data += `<div>
                <h3>Employee Code : ${w.EmployeeCode}</h3>
                <h3>Total Hours : ${w.TotalHours.toFixed(2)}</h3>
                </div>`;
            });


            // data += `<p style="page-break-after:always">&nbsp;</p>`;
        });


        var html = getTemplate(data, 'Insufficient Work Log Hours (This Week) ');


        var options = {
            format: 'A3',
            orientation: 'landscape',
            border: '0.5in',
            footer: {
                height: "28mm",
                contents: {
                    default: '<div style="text-align:right"><span style="color: #444;">{{page}}</span> of <span>{{pages}}</span></div>'
                }
            }
        };

        var timestamp = (new Date()).toISOString().replace(/:/g, "__");
        var pdfFilename = "REPORT__" + timestamp + ".pdf";
        var fullFilename = Constants.PDF_PATH + pdfFilename;

        pdf.create(html, options).toFile(fullFilename, function (err, resPdf) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: '500: Internal Server Error',
                    data: null,
                    filename: null
                });
            }
            else {
                return res.status(200).send({
                    success: true,
                    message: 'Success',
                    data: resPdf,
                    filename: pdfFilename
                });
            }
        });
    });
}


function getTemplate(data, caption) {
    var html = `<!DOCTYPE html>
                    <head>
                    <title>Nonbreaking Spaces Example</title>
                    <link href="https://fonts.googleapis.com/css?family=Nunito|Open+Sans&display=swap" rel="stylesheet">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                    <style>
                    body {
                        font-family: 'Open Sans', Calibri, Verdana, Tahoma, Segoe-UI, sans-serif;
                        font-size: 14px;
                        padding: 10px 20px;
                    }
                    a {
                        text-decoration: none;
                        color: #00c5c6 !important;
                    }
                    h1 {
                        /* font-family: 'Nunito', sans-serif; */
                        font-size: 44px;
                        color: #008ab4;
                        font-weight: 100;
                    }
                    table {
                        border-collapse: collapse;
                        border-top: 1px solid #bbb;
                        border-bottom: 1px solid #bbb;
                        width: 100%;
                    }
                    td, th {
                        padding: 7px;
                        border-collapse: collapse;
                        border-left: 1px solid #ddd;
                        border-right: 1px solid #ddd;
                    }
                    th {
                        background: #ccc;
                        border-bottom: 1px solid #bbb;
                    }
                    tr:nth-child(2n+1) {
                        background: #ebeff1;
                    }

                    </style>
                    </head>
                    <body>
                    <h1>${caption}</h1>
                    <h4 style="margin-bottom:26px">Report generated on ${new Date()}</h4>
                    
                    ${data}
                    

                    </body>
                    </html>
                    `;



    return html;
}

// PDF DOCUMENT 
function getDocumentTemplate(data, caption) {
    var html = `<!DOCTYPE html>
                    <head>
                    <title>Nonbreaking Spaces Example</title>
                    <link href="https://fonts.googleapis.com/css?family=Nunito|Open+Sans&display=swap" rel="stylesheet">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                    <style>
                    body {
                        font-family: 'Open Sans', Calibri, Verdana, Tahoma, Segoe-UI, sans-serif;
                        font-size: 14px;
                        padding: 10px 20px;
                    }
                    a {
                        text-decoration: none;
                        color: #00c5c6 !important;
                    }
                    h1 {
                        /* font-family: 'Nunito', sans-serif; */
                        font-size: 44px;
                        color: #008ab4;
                        font-weight: 100;
                    }
                    table {
                        border-collapse: collapse;
                        border-top: 1px solid #bbb;
                        border-bottom: 1px solid #bbb;
                        width: 100%;
                    }
                    td, th {
                        padding: 7px;
                        border-collapse: collapse;
                        border-left: 1px solid #ddd;
                        border-right: 1px solid #ddd;
                    }
                    th {
                        background: #ccc;
                        border-bottom: 1px solid #bbb;
                    }
                    tr:nth-child(2n+1) {
                        background: #ebeff1;
                    }

                    </style>
                    </head>
                    <body>
                    <h1>${caption}</h1>
                   
                    ${data}
                    

                    </body>
                    </html>
                    `;



    return html;
}


//Worklogs Report Yesterday pdf ##
exports.worklogs_report_yesterday_timeperiod_pdf = (req, res) => {
    var pdf = require('html-pdf');

    var stringurl = ``;
    if (req.query.AssigneeId != ``) {
        if (req.query.ProjectId != "ALL") {
            stringurl = `w.EmployeeId = '${req.query.AssigneeId}' AND (t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)`;
        }
        else {
            stringurl = `w.EmployeeId = '${req.query.AssigneeId}'`;
        }
    }
    else {
        if (req.query.ProjectId != "ALL") {
            stringurl = `(t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)
                AND (w.EmployeeId IN (SELECT EmployeeId FROM project_employee_map WHERE ProjectId = ${req.query.ProjectId})) `;
        }
        else {
            stringurl = getAllEmployeesWhereClause(req)
        }
    }

    let reportQuery = ``;
    reportQuery = `SELECT  e.EmployeeCode,e.FullName, p.ProjectCode, w.EntryDate,w.GenericTaskId,
    w.Remarks, w.CreatedDateTime, w.Hours, t.TaskName, t.TaskDescription, t.TaskId,t.WorkItemKey,
    t.EstimatedEffort, t.RemainingEffort, t.WorkItemKey,
    0 as IsLeave,
    gt.GenericTaskName
     FROM work_log w
     JOIN employee e ON w.EmployeeId = e.EmployeeId
     LEFT JOIN task t ON w.TaskId = t.TaskId
     LEFT JOIN project p ON t.ProjectId = p.ProjectId
     LEFT JOIN generic_tasks gt ON w.GenericTaskId = gt.GenericTaskId
     Where ${stringurl} AND w.EntryDate = '${req.query.Yesterday}'
     ORDER BY w.EntryDate DESC`;


    connection.query(reportQuery, function (obj) {

        var response = [];

        obj.response.forEach(e => {
            var item = response.find(o => o.EmployeeCode == e.EmployeeCode);

            if (item) {
                item.WorkItems.push({

                    ProjectCode: e.ProjectCode,
                    TaskTypeName: e.TaskTypeName,
                    TaskName: e.TaskName,
                    TaskId: e.TaskId,
                    Remarks: e.Remarks,
                    Hours: e.Hours,
                    EntryDate: e.EntryDate,
                    WorkItemKey: e.WorkItemKey,
                    CreatedDateTime: e.CreatedDateTime,
                    GenericTaskName: e.GenericTaskName
                });
            }
            else {
                response.push({
                    EmployeeCode: e.EmployeeCode,
                    FullName: e.FullName,
                    WorkItems: [{
                        ProjectCode: e.ProjectCode,
                        TaskTypeName: e.TaskTypeName,
                        TaskName: e.TaskName,
                        TaskId: e.TaskId,
                        Remarks: e.Remarks,
                        Hours: e.Hours,
                        EntryDate: e.EntryDate,
                        WorkItemKey: e.WorkItemKey,
                        CreatedDateTime: e.CreatedDateTime,
                        GenericTaskName: e.GenericTaskName
                    }]
                })
            }
        })


        var data = ``;

        response.forEach(e => {
            data += `<h2 style="margin-bottom:10px; margin-top:15px; color:#59a">${e.FullName}</h2>`;
            data += `<table>`;
            data += `<tr>
                         <th>Entry Date</th>
                            <th>Key</th>
                            <th>Work Item Name</th>
                            <th>Time Spent</th>
                            <th>Remarks</th>
                            <th>Created At</th>
                        </tr>`;

            e.WorkItems.forEach(w => {
                data += `<tr>
                            <td>${moment(w.EntryDate).format("MMM Do YYYY")}</td>
                            <td>${w.ProjectCode == null ? "" : w.ProjectCode + "-"}${w.WorkItemKey == null ? "" : w.WorkItemKey}</td>
                            <td>${w.GenericTaskName ? w.GenericTaskName : w.TaskName}</td>
                            <td>${w.Hours}</td>
                            <td>${w.Remarks}</td>
                            <td>${moment(w.CreatedDateTime).format("MMM Do YYYY, h:mm A")}</td>
                        </tr>`;
            });

            data += `</table>`;
            data += `<p style="page-break-after:always">&nbsp;</p>`;
        });


        var html = getTemplate(data, 'Work Logs ');


        var options = {
            format: 'A3',
            orientation: 'landscape',
            border: '0.5in',
            footer: {
                height: "28mm",
                contents: {
                    default: '<div style="text-align:right"><span style="color: #444;">{{page}}</span> of <span>{{pages}}</span></div>'
                }
            }
        };

        var timestamp = (new Date()).toISOString().replace(/:/g, "__");
        var pdfFilename = "REPORT__" + timestamp + ".pdf";
        var fullFilename = Constants.PDF_PATH + pdfFilename;

        pdf.create(html, options).toFile(fullFilename, function (err, resPdf) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: '500: Internal Server Error',
                    data: null,
                    filename: null
                });
            }
            else {
                return res.status(200).send({
                    success: true,
                    message: 'Success',
                    data: resPdf,
                    filename: pdfFilename
                });
            }
        });
    });
}


//Worklogs Report Last Two Week pdf ##
exports.worklogs_report_last_two_week_timeperiod_pdf = (req, res) => {
    var pdf = require('html-pdf');

    var stringurl = ``;
    if (req.query.AssigneeId != ``) {
        if (req.query.ProjectId != "ALL") {
            stringurl = `w.EmployeeId = '${req.query.AssigneeId}' AND (t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)`;
        }
        else {
            stringurl = `w.EmployeeId = '${req.query.AssigneeId}'`;
        }
    }
    else {
        if (req.query.ProjectId != "ALL") {
            stringurl = `(t.ProjectId = ${req.query.ProjectId} OR gt.GenericTaskId IS NOT NULL)
                AND (w.EmployeeId IN (SELECT EmployeeId FROM project_employee_map WHERE ProjectId = ${req.query.ProjectId})) `;
        }

    }

    let reportQuery = ``;
    reportQuery = `SELECT  e.EmployeeCode,e.FullName, p.ProjectCode, w.EntryDate,w.GenericTaskId,
    w.Remarks, w.CreatedDateTime, w.Hours, t.TaskName, t.TaskDescription, t.TaskId,t.WorkItemKey,
    t.EstimatedEffort, t.RemainingEffort, t.WorkItemKey,
    0 as IsLeave,
    gt.GenericTaskName
     FROM work_log w
     JOIN employee e ON w.EmployeeId = e.EmployeeId
     LEFT JOIN task t ON w.TaskId = t.TaskId
     LEFT JOIN project p ON t.ProjectId = p.ProjectId
     LEFT JOIN generic_tasks gt ON w.GenericTaskId = gt.GenericTaskId
     Where ${stringurl} AND w.EntryDate between 
     '${req.query.lastTwoWeekStartDate}' AND '${req.query.lastWeekEndDate}'
     ORDER BY w.EntryDate DESC`;


    connection.query(reportQuery, function (obj) {

        var response = [];

        obj.response.forEach(e => {
            var item = response.find(o => o.EmployeeCode == e.EmployeeCode);

            if (item) {
                item.WorkItems.push({

                    ProjectCode: e.ProjectCode,
                    TaskTypeName: e.TaskTypeName,
                    TaskName: e.TaskName,
                    TaskId: e.TaskId,
                    Remarks: e.Remarks,
                    Hours: e.Hours,
                    EntryDate: e.EntryDate,
                    WorkItemKey: e.WorkItemKey,
                    CreatedDateTime: e.CreatedDateTime,
                    GenericTaskName: e.GenericTaskName
                });
            }
            else {
                response.push({
                    EmployeeCode: e.EmployeeCode,
                    FullName: e.FullName,
                    WorkItems: [{
                        ProjectCode: e.ProjectCode,
                        TaskTypeName: e.TaskTypeName,
                        TaskName: e.TaskName,
                        TaskId: e.TaskId,
                        Remarks: e.Remarks,
                        Hours: e.Hours,
                        EntryDate: e.EntryDate,
                        WorkItemKey: e.WorkItemKey,
                        CreatedDateTime: e.CreatedDateTime,
                        GenericTaskName: e.GenericTaskName
                    }]
                })
            }
        })


        var data = ``;

        response.forEach(e => {
            data += `<h2 style="margin-bottom:10px; margin-top:15px; color:#59a">${e.FullName}</h2>`;
            data += `<table>`;
            data += `<tr>
                         <th>Entry Date</th>
                            <th>Key</th>
                            <th>Work Item Name</th>
                            <th>Time Spent</th>
                            <th>Remarks</th>
                            <th>Created At</th>
                        </tr>`;

            e.WorkItems.forEach(w => {
                data += `<tr>
                            <td>${moment(w.EntryDate).format("MMM Do YYYY")}</td>
                            <td>${w.ProjectCode == null ? "" : w.ProjectCode + "-"}${w.WorkItemKey == null ? "" : w.WorkItemKey}</td>
                            <td>${w.GenericTaskName ? w.GenericTaskName : w.TaskName}</td>
                            <td>${w.Hours}</td>
                            <td>${w.Remarks}</td>
                            <td>${moment(w.CreatedDateTime).format("MMM Do YYYY, h:mm A")}</td>
                        </tr>`;
            });

            data += `</table>`;
            data += `<p style="page-break-after:always">&nbsp;</p>`;
        });


        var html = getTemplate(data, 'Work Logs ');


        var options = {
            format: 'A3',
            orientation: 'landscape',
            border: '0.5in',
            footer: {
                height: "28mm",
                contents: {
                    default: '<div style="text-align:right"><span style="color: #444;">{{page}}</span> of <span>{{pages}}</span></div>'
                }
            }
        };

        var timestamp = (new Date()).toISOString().replace(/:/g, "__");
        var pdfFilename = "REPORT__" + timestamp + ".pdf";
        var fullFilename = Constants.PDF_PATH + pdfFilename;

        pdf.create(html, options).toFile(fullFilename, function (err, resPdf) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: '500: Internal Server Error',
                    data: null,
                    filename: null
                });
            }
            else {
                return res.status(200).send({
                    success: true,
                    message: 'Success',
                    data: resPdf,
                    filename: pdfFilename
                });
            }
        });
    });
}



/************************  Missing Report Pdf(By Vikash) *********************************/

exports.worklog_missing = (req, res) => {

    var pdf = require('html-pdf');

    if (!req.body) {
        return res.status(400).send({
            message: "Blank Data"
        });
    }

    var Supervisors = [];
    req.body.workItems.forEach(w => {
        var name = '';
        w.MissingWorklogs.forEach(m => {
            m.arr.forEach(a => {

                if (m.Supervisor != name) {
                    Supervisors.push(a.Supervisor)
                }

                name = m.name;

            })

        })
    })
    Supervisors = [...new Set(Supervisors)];
    console.log(Supervisors);
    var table = `<tbody>   <tr  style="background-color: #acb9ca; height: 30px !important;">
    <td>Supervisor</td>
  <td><table>
      <tr>
          <td style="width:250px">Employee</td>
          <td  class="dates">Log Date</td>
           <td  class="hours">Hours Logged</td>
          <td  class="hours">Shortfall</td>
          <td class="remarks">Remarks</td>
      </tr>
  </table>
</tr>`;

    Supervisors.forEach(s => {
        var tbody = ``;

        console.log(JSON.stringify(s))


        req.body.workItems.forEach(w => {
            var name = '';
            var count = 0;
            w.MissingWorklogs.forEach(m => {
                var count = 0;
                m.arr.forEach(a => {
                    if (a.Supervisor == s) {

                        if (count == 0) {
                            tbody += `<tr><td   class="emptds" >${w.EmployeeName}</td>
                                                    <td  class="dates">${a.LogDate}</td>
                                                    <td class="hours">${a.HoursLogged}</td>
                                                    <td class="hours">${a.Shortfall}</td>
                                                    <td class="remarks">${a.Remarks}</td>
                                                    </tr>`
                        } else {
                            tbody += `<tr><td ></td>
                            <td  class="dates">${a.LogDate}</td>
                            <td class="hours">${a.HoursLogged}</td>
                            <td class="hours">${a.Shortfall}</td>
                            <td class="remarks">${a.Remarks}</td>
                            </tr>`
                        }

                        count++;
                    }
                })

            })
        })

        table += `<tr >
                <td class="sups">${s}</td>
                <td>
                    <table>
                        ${tbody}
                    </table>
                </td>
            </tr>`

    })

    // for (var k = 0; k < Supervisors.length; k++) {
    //     var supervisorColspan = 0;
    //     var tbody = ``;
    //     for (var i = 0; i < req.body.workItems.length; i++) {

    //         var item = req.body.workItems[i];
    //         for (var j = 0; j < item.MissingWorklogs.length; j++) {
    //             if (item.MissingWorklogs[j].Supervisor == Supervisors[k]) {
    //                 supervisorColspan++;

    //                 if (j == 0) {
    //                     tbody += `<tr><td rowspan=${item.MissingWorklogs.length} class="emptds">${item.EmployeeName}</td>
    //                             <td  class="dates">${item.MissingWorklogs[j].LogDate}</td>
    //                             <td class="hours">${item.MissingWorklogs[j].HoursLogged}</td>
    //                             <td class="hours">${item.MissingWorklogs[j].Shortfall}</td>
    //                             <td class="remarks">${item.MissingWorklogs[j].Remarks}</td>
    //                             </tr>`
    //                 }

    //                 else {
    //                     if (j == (item.MissingWorklogs.length - 1))
    //                         tbody += `<tr style="border-bottom: 1px solid black">`

    //                     else
    //                         tbody += `<tr >`

    //                     tbody += `<td class="dates">${item.MissingWorklogs[j].LogDate}</td>
    //                 <td class="hours">${item.MissingWorklogs[j].HoursLogged}</td>
    //                 <td class="hours">${item.MissingWorklogs[j].Shortfall}</td>
    //                 <td class="remarks">${item.MissingWorklogs[j].Remarks}</td>
    //                 </tr>`
    //                 }
    //             }

    //         }
    //     }

    //     table += `<tr >
    //         <td class="sups">${Supervisors[k]}</td>
    //         <td>
    //             <table>
    //                 ${tbody}
    //             </table>
    //         </td>
    //     </tr>`
    // }

    table += `</tbody>`;
    //console.log(table);
    var reportPdf = getMissingReportTemplate(table, req.body.dates);
    console.log(reportPdf);
    var timestamp = (new Date()).toISOString().replace(/:/g, "__");
    var pdfFilename = "REPORT__" + timestamp + ".pdf";
    var fullFilename = Constants.PDF_PATH + pdfFilename;


    var options = {
        format: 'A4',
        orientation: 'landscape',
    };


    pdf.create(reportPdf, options).toFile(fullFilename, function (err, resPdf) {
        if (err) {
            return res.status(500).send({
                success: false,
                message: '500: Internal Server Error',
                data: null,
                filename: null
            });
        }
        else {
            return res.status(200).send({
                success: true,
                message: 'Success',
                data: resPdf,
                filename: pdfFilename
            });
        }
    });

}

function getMissingReportTemplate(table, dates) {
    var html = `<!DOCTYPE html>
    <html>
        <head>
        <link href="https://fonts.googleapis.com/css?family=Nunito|Open+Sans&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" crossorigin="anonymous">
       
        <style>

        body {
            font-family: 'Open Sans', Calibri, Verdana, Tahoma, Segoe-UI, sans-serif;
            font-size: 12px;
         
        }
        td,th {
            text-align: center !important;
        }
    
        .dates{
            width: 150px;
        }
        
        .hours{
            width:100px;
        }
        
        .remarks{
            width:150px;
        }
        
        .emptds, .sups{
            width:250px;
        }
        
        .tableHeader{
            width:98% !important;
            height: 30px !important;
            font-size: 14px !important;
        }
        
        .tableDiv{
            margin: 0px 0px 0px 20px !important;
            padding: 0 50px !important;
        }
        
        .sups{
            background-color: #d9d9d9;
             border-bottom: 1px solid black;
        }
        
        // .emptds{
        //     border-bottom: 1px solid black;
        //  }

         #header{
            text-align: center;
            font-size: 20px!important;
            margin-top: 50px;


         }
        </style>
      
        </head>
        <body>
        <div id="header">
            <div>Work Log Report</div>
            <div> Period ${dates.StartDate.split('-').reverse().join('-')} to ${dates.EndDate.split('-').reverse().join('-')}</div>
        </div>
        <div class="col-md-12 tableDiv" >
    
        <div class="col-md-10 tableHeader" style="background-color: #203764; color:white">Insufficient or Missing Work Log</div>
            <table>
            ${table}
            </table>
                   
            </div>
           
        </body>

    </html>`

    return html;
}

exports.system_requirements_report = (req, res) => {

    var pdf = require('html-pdf');

    let query = `SELECT sr.*,p.ProjectCode,p.ProjectName,fa.FunctionalAreaId,fa.Description as "FunctionalAreaDescription",fa.FunctionalAreaCode
                 FROM system_requirement  sr 
                 JOIN  project p ON sr.ProjectId = p.ProjectId
                 JOIN functional_area fa ON sr.FunctionalAreaId = fa.FunctionalAreaId
                 WHERE sr.ProjectId = ${req.params.ProjectId} ;
                 
                 SELECT  sr.SystemRequirementId,a.ActorId,a.ActorName 
                 FROM system_requirement sr 
                 LEFT JOIN  system_requirement_actor_map sram ON  sr.SystemRequirementId = sram.SystemRequirementId
                 LEFT JOIN actor a ON sram.ActorId = a.ActorId
                 WHERE sr.ProjectId = ${req.params.ProjectId} ;

                 SELECT sr.SystemRequirementId ,br.BusinessRuleId,br.BusinessRuleName
                 FROM system_requirement sr 
                 JOIN business_rule br ON sr.SystemRequirementId = br.SystemRequirementId
                 WHERE sr.ProjectId = ${req.params.ProjectId} ;

                 SELECT sr.SystemRequirementId ,ac.AcceptanceCriteriaId,ac.AcceptanceCriteriaName 
                 FROM system_requirement sr 
                 JOIN acceptance_criteria ac ON sr.SystemRequirementId = ac.SystemRequirementId
                 WHERE sr.ProjectId = ${req.params.ProjectId} ; `

    console.log(query)
    connection.query(query, function (obj) {
        console.log(obj.response[0])



        var data = ``;
        obj.response[0].forEach(e => {
            data += `<h2 style="style="font-weight:bold">Functional Area : ${e.FunctionalAreaCode ? e.FunctionalAreaCode + "-" + e.FunctionalAreaDescription : e.FunctionalAreaDescription}</h2>`;
            data += `<div style="margin-left:30px;"><h2 style="margin-bottom:10px; margin-top:15px; color:#59a">System Requirement :${e.SystemRequirementName}</h2>`;
            data += `<h3>Description : ${e.SystemRequirementDescription ? e.SystemRequirementDescription : ""}</b></h3>`;
            data += `<div style="margin-left:30px;"><h2 style="margin-bottom:10px; margin-top:15px; color:#59a">Actor:</h2>`;
            data += `<ul>`
            obj.response[1].forEach(a => {
                if (a.SystemRequirementId == e.SystemRequirementId) {
                    if (a.ActorName != null) {
                        data += `<li>${a.ActorName}</li>`;
                    }
                }
            });

            data += `</ul>`;
            data += `<h2 style="margin-bottom:10px; margin-top:15px; color:#59a">Business Rule:</h2>`;
            data += `<ul>`;
            obj.response[2].forEach(br => {
                if (br.SystemRequirementId == e.SystemRequirementId) {
                    if (br.BusinessRuleName != null) {
                        data += `<li>${br.BusinessRuleName}</li>`;
                    }
                }
            });

            data += `</ul>`;
            data += `<h2 style="margin-bottom:10px; margin-top:15px; color:#59a">Acceptance Criteria:</h2>`;
            data += `<ul>`;
            obj.response[3].forEach(ac => {
                if (ac.SystemRequirementId == e.SystemRequirementId) {
                    if (ac.AcceptanceCriteriaName != null) {
                        data += `<li>${ac.AcceptanceCriteriaName}</li>`;
                    }
                }
            });

            data += `</ul>`;
            data += `</div></div>`;
            data += `<p style="page-break-after:always">&nbsp;</p>`;
        })
        paging = `Project Requirements Document`;
        var html = getDocumentTemplate(data, paging);


        var options = {
            format: 'A4',
            orientation: 'Portrait',
            border: '0.5in',
            footer: {
                height: "28mm",
                contents: {
                    default: '<div style="text-align:right"><span style="color: #444;">{{page}}</span> of <span>{{pages}}</span></div>'
                }
            }
        };

        var timestamp = (new Date()).toISOString().replace(/:/g, "__");
        var pdfFilename = "REPORT__" + timestamp + ".pdf";
        var fullFilename = Constants.PDF_PATH + pdfFilename;

        pdf.create(html, options).toFile(fullFilename, function (err, resPdf) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: '500: Internal Server Error',
                    data: null,
                    filename: null
                });
            }
            else {
                return res.status(200).send({
                    success: true,
                    message: 'Success',
                    data: resPdf,
                    filename: pdfFilename
                });
            }
        });


        // res.send({
        //     success: obj.error == null,
        //     message: obj.error || `Success`,
        //     data: response
        // });

    })
}