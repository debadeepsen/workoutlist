const mongoose = require('mongoose');

const EmployeeSchema = mongoose.Schema({
    email: String,
    password: String
}, {collection: 'EMPLOYEE'});

module.exports = mongoose.model('Employee', EmployeeSchema);