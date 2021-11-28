const moment = require('moment');
const connection = require('./mysql.controller');


exports.checkNewTask = (req, res) => {
    let query = `SELECT * FROM task_assignment_history tah
                    JOIN task t ON tah.TaskId = t.TaskId
                    JOIN project p ON p.ProjectId = t.ProjectId
                    WHERE tah.EmployeeId = ${req.params.employeeId} AND TIMESTAMPDIFF(MINUTE, n.TimeStampSent, NOW()) <= 1`;

    console.log(query);
    connection.query(query, function (obj) {
        return res.status(200).send({
            success: obj.error == null,
            message: obj.error || 'Success',
            data: obj.response
        })
    })
}

exports.checkNewNotifications = (req, res) => {

    let lastNotificationQuery = `SELECT MAX(n.TimeStampSeen) N FROM notification n WHERE n.RecipientId = ${req.params.employeeId}`;

    console.log(lastNotificationQuery);

    connection.query(lastNotificationQuery, function (objLN) {

        // convert to local time
        let mmt = require('moment-timezone');
        let lastNotificationSeenTime = mmt.tz(objLN.response[0].N, mmt.tz.guess()).format("YYYY-MM-DD HH:mm:ss");


        var lastSeenTime = lastNotificationSeenTime == "Invalid date" ? mmt().format("YYYY-MM-DD") + " " + "00:00:00" : lastNotificationSeenTime;
        console.log(lastSeenTime)


        let query = `SELECT * FROM notification n
                        WHERE n.RecipientId = ${req.params.employeeId} AND TIMEDIFF(n.TimeStampSent, '${lastSeenTime}') > 0`;

        console.log(query)


        console.log("--------------------------------------------------------------------------");
        // console.log(query);

        connection.query(query, function (obj) {
            return res.status(200).send({
                success: obj.error == null,
                message: obj.error || 'Success',
                data: obj.response
            })
        })
    })
}

exports.update = (req, res) => {

    if (!req.body.Notifications) {
        return res.status(400).send({
            success: false,
            message: 'Error: notifications need to be supplied',
            data: null
        })
    }

    var allNotifications = req.body.Notifications;
    var notificationIds = ``;

    allNotifications.forEach(e => {
        notificationIds += e.NotificationId + ",";
    });

    notificationIds = notificationIds.substr(0, notificationIds.length - 1);

    if (!notificationIds) {
        return res.status(204).send({
            success: false,
            message: 'No row updated',
            data: null
        })
    }

    let query = `UPDATE notification SET TimeStampSeen = NOW() WHERE NotificationId IN (${notificationIds})`;

    connection.query(query, function (obj) {
        return res.status(200).send({
            success: obj.error == null,
            message: obj.error || 'Success',
            data: obj.response
        })
    })

}

exports.getAll = (req, res) => {
    let query = `SELECT * FROM notification n WHERE n.RecipientId = ${req.params.employeeId}`;

    connection.query(query, function (obj) {
        return res.status(200).send({
            success: obj.error == null,
            message: obj.error || 'Success',
            data: obj.response
        })
    })
}

