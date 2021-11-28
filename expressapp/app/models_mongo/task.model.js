const mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

const TaskSchema = mongoose.Schema({
    EmployeeId: ObjectId,
    ProjectId: ObjectId,
    TaskName: String,
    TaskDescription: String
}, { collection: 'TASK' });

module.exports = mongoose.model('Task', TaskSchema);