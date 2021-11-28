const connection = require('./mysql.controller');

//Create Meeting
exports.crup = (req, res) => {

    // if (!req.body.Agenda) {
    //     return res.status(400).send({
    //         message: "Agenda  cannot be empty"
    //     });
    // }

    // if (!req.body.MinuteTakerId) {
    //     return res.status(400).send({
    //         message: "Minute Taker Id  cannot be empty"
    //     });
    // }
    var StartTime = `${req.body.StartDate} ${req.body.StartTime}`;
    var EndTime = `${req.body.EndDate} ${req.body.EndTime}`;

    let duplicateQuery = `SELECT VenueId,StartTime,EndTime FROM meeting 
                        where VenueId ='${req.body.VenueId}' and StartTime between '${StartTime}' and  '${EndTime}'
                        and EndTime between  '${StartTime}' and '${EndTime}'${req.body.MeetingId ? " and MeetingId <> " + req.body.MeetingId : ""} `;

    console.log(duplicateQuery);

    connection.query(duplicateQuery, function (obj) {
        if (obj.response.length)
            res.status(400).send({
                success: false,
                message: `The Meeting Venue Alredy Booked has booked`,
                data: null
            });
    });

    let crupQuery = req.body.MeetingId ?
        `UPDATE  meeting set 
                Agenda ='${req.body.Agenda}',
                Remarks ='${req.body.Remarks}',
                MeetingTitle = '${req.body.MeetingTitle}',
                LastUpdatedBy ='${req.body.LastUpdatedBy}',
                VenueId ='${req.body.VenueId}',
                StartTime = '${StartTime}',
                EndTime = '${EndTime}'
                where MeetingId = ${req.body.MeetingId}` :
        `INSERT INTO meeting (Agenda,Remarks,MeetingTitle,CreatedBy,VenueId,StartTime,EndTime)
                        VALUES('${req.body.Agenda}',
                        '${req.body.Remarks}',
                        '${req.body.MeetingTitle}',
                        '${req.body.CreatedBy}',
                        '${req.body.VenueId}',
                        '${StartTime}',
                        '${EndTime}' )`;

    if (req.body.MeetingId && req.query.delete) {
        crupQuery = `UPDATE meeting set  Deleted ='Y',DeletedBy='${req.body.LastUpdatedBy}',DeletedDateTime=now() where MeetingId = ${req.body.MeetingId}`;
        console.log(crupQuery);
    }

    console.log(crupQuery);

    connection.query(crupQuery, function (obj) {

        let MeetingId = obj.response.insertId;
        let AttendeeQuery = req.body.MeetingId ?
            `UPDATE meeting_attendee_map SET
                    EmployeeId ='${req.body.CreatedBy}',
                    MeetingRoleId = '${1}',
                    LastUpdatedBy = '${req.body.LastUpdatedBy}'
                    Where MeetingId = ${req.body.MeetingId}` :
            `INSERT INTO  meeting_attendee_map (MeetingId,EmployeeId,MeetingRoleId,CreatedBy)
                        VALUES('${MeetingId}',
                                '${req.body.CreatedBy}',
                                '${1}',
                                '${req.body.CreatedBy}')`;
        console.log(AttendeeQuery);
        connection.query(AttendeeQuery, function (obj) {

            res.send({
                success: obj.error == null,
                message: obj.error || `Success`,
                data: obj.response

            });
        });

    });
}

// Meeting Attendee Map 
exports.meetingAttendeeMap = (req, res) => {

    let query = `INSERT INTO meeting_attendee_map(MeetingId,EmployeeId,MeetingRoleId,CreatedBy) VALUES `;

    // build the query
    req.body.Items.forEach(e => {
        query += `('${e.MeetingId}','${e.EmployeeId}','${e.MeetingRoleId}','${e.CreatedBy}'),`;
    });

    // trim the ending comma
    query = query.substr(0, query.length - 1);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}
// list 
exports.list = (req, res) => {

    let listQuery = req.params.MeetingId ?
        `SELECT
        m.MeetingTitle,v.VenueName,m.StartTime,m.EndTime
        FROM  meeting  as m INNER JOIN  venue_master as v ON m.VenueId = v.VenueId INNER JOIN employee as e
        ON m.CreatedBy = e.EmployeeId  where m.MeetingId =${req.params.MeetingId}` :
        `SELECT
    m.MeetingTitle,v.VenueName,m.StartTime,m.EndTime
     FROM  meeting  as m INNER JOIN  venue_master as v ON m.VenueId = v.VenueId INNER JOIN employee as e
     ON m.CreatedBy = e.EmployeeId `;


    console.log(listQuery);
    connection.query(listQuery, function (obj) {
        res.status(200).send({ success: true, message: null, data: obj.response });
    });
}

exports.assignedList = (req, res) => {

    var query = `SELECT m.* , v.* , mrm.* FROM meeting  m JOIN venue_master  v
                ON m.VenueId = v.VenueId   JOIN meeting_attendee_map  map ON m.MeetingId = map.MeetingId JOIN  meeting_role_master mrm
                ON map.MeetingRoleId = mrm.MeetingRoleMasterId
                             WHERE map.EmployeeId = '${req.params.assigneeId}' `;

    // var query = `SELECT m.* FROM meeting m 
    //             JOIN meeting_attendee_map map ON m.MeetingId = map.MeetingId
    //             WHERE map.EmployeeId = '${req.params.assigneeId}'`;
    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}

// Venue List 
exports.venue_list = (req, res) => {
    var query = (req.params.VenueId) ?
        `SELECT * from venue_master where VenueId = '${req.params.VenueId}'` :
        `SELECT * from venue_master`;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}

// Meeting Role Master List 
exports.meetingRoleMaster_list = (req, res) => {
    var query =
        // `SELECT * from venue_master where VenueId = '${req.params.VenueId}'` :
        `SELECT * from meeting_role_master`;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}

//Meeting Details By Meeting Id
exports.meeting_details_list = (req, res) => {

    let detailsQuery =
        `SELECT m.*,v.VenueName,e.FullName FROM  meeting as m INNER JOIN venue_master as v ON  m.VenueId = v.VenueId 
     INNER JOIN  employee as e ON m.CreatedBy = e.EmployeeId where m.MeetingId ='${req.params.meetingId}' `;

    console.log(detailsQuery);
    connection.query(detailsQuery, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}

// Meeting Attendees By Meeting Id
exports.meeting_attendees_list = (req, res) => {

    let detailsQuery =
        `SELECT mam.*,e.FullName,mrm.MeetingRoleName,ep.ProfilePic FROM  meeting_attendee_map as mam
     INNER JOIN employee as e ON mam.EmployeeId = e.EmployeeId INNER JOIN  meeting_role_master as mrm
     ON mam.MeetingRoleId = mrm.MeetingRoleMasterId LEFT JOIN employee_profile as ep 
     ON e.EmployeeId = ep.EmployeeId where mam.MeetingId = '${req.params.meetingId}'; `;

    console.log(detailsQuery);
    connection.query(detailsQuery, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}

// Create Meeting Minutes By Minute Tacker Id

exports.meeting_minutes_crup = (req, res) => {

    let crupQuery = req.body.MinuteId ?
        `UPDATE meeting_minutes set
                 MeetingId = '${req.body.MeetingId}',
                 MinuteText = '${req.body.MinuteText}',
                 LastUpdatedBy = '${req.body.LastUpdatedBy}'
                 where MinuteId = ${req.body.MinuteId}` :
        `INSERT INTO meeting_minutes (MeetingId,MinuteText,CreatedBy)  
                 VALUES('${req.body.MeetingId}',
                        '${req.body.MinuteText}',
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

// list of Meeting Minutes By Minute Tacker Id 
exports.assignedMinutrTacker = (req, res) => {

    var query =
        `SELECT m.MeetingId,m.MeetingTitle,mam.* FROM meeting_attendee_map as mam INNER JOIN meeting as m 
    ON mam.MeetingId = m.MeetingId where mam.MeetingRoleId ='${3}' and  mam.EmployeeId = '${req.params.EmployeeId}' `;
    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}