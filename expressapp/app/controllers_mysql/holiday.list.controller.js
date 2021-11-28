const connection = require('./mysql.controller');

// check holiday
exports.check_holiday = (req, res) => {

    let Query = `SELECT HolidayId, HolidayName FROM holiday_list  WHERE Date='${req.query.EntryDate}'`;

    console.log(Query);
    connection.query(Query, function (obj) {
        res.send({
            success: obj.error == null,
            message: "success",
            data: obj.response
        });
    });

}

// Holiday List (not in use)

exports.holidayList = (req, res) => {

    let query = `SELECT  * FROM holiday_list WHERE OrganizationId='${req.query.OrganizationId}'`;
    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: "success",
            data: obj.response
        });
    });

}


// Holiday List by year
exports.holidayListByYear = (req, res) => {

    let query = `SELECT  * FROM holiday_list WHERE OrganizationId='${req.query.OrganizationId}' AND year(Date) = '${req.query.Year}'`;
    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: "success",
            data: obj.response
        });
    });

}

exports.saveHoliday = (req, res) => {
    console.log(req.body.Items);
    let query = `DELETE FROM holiday_list WHERE OrganizationId='${req.body.OrganizationId}' AND year(Date) = '${req.query.Year}';  INSERT INTO holiday_list(HolidayName, Date, Remarks, TotalDays, CreatedBy, OrganizationId) VALUES`;
    if (req.body.Items) {
        req.body.Items.forEach(e => {
            if(e.remarks == "" || e.remarks ==null || e.remarks == "null")
                query += `('${e.holidayName.replace(/'/g, "''")}','${e.date}',NULL, ${e.noOfDays}, ${req.body.CreatedBy}, ${req.body.OrganizationId}),`

            else
                query += `('${e.holidayName.replace(/'/g, "''")}','${e.date}', '${e.remarks.replace(/'/g, "''")}' , ${e.noOfDays}, ${req.body.CreatedBy}, ${req.body.OrganizationId}),`
        });
    }

    console.log(query);

    // trim the ending comma
    query = query.substr(0, query.length - 1);

    console.log(query)

    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}