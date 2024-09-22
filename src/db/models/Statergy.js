const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    type: { type: String, enum: ["INTERVAL", "FILTER"] },
    name: String,
    statergyName: String,
    timeFrame: String,
    eventName: String,
    running: { type: Boolean, default: false },
    isMultiTimeFrame: { type: Boolean, default: false, },
    multiTimeFrams: [String],
    query: {
        type: Object,
    },
    fields: {
        type: Map,
        of: String
    }
})

const Statergy = mongoose.model('Statergy', schema);

module.exports = Statergy;
