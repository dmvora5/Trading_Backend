const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    status: Boolean,
    date: Date,
    name: String
})

const Job = mongoose.model('Job', schema);

module.exports = Job;