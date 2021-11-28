const mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;

const TimeSheetSchema = mongoose.Schema({
    EmployeeId: ObjectId,
    TimeSheetDate: Date,
    TimeSheetPerTask: [
        {
            TaskId: {
                type: ObjectId,
                ref: 'Task'
            },
            Hours: String,
            Remarks: String
        }
    ]
}, { collection: 'EMPLOYEE_TIMESHEET' });

module.exports = mongoose.model('TimeSheet', TimeSheetSchema);