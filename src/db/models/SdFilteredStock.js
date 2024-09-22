const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    index: { type: String, default: null },
    sid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "statergies",
    },
    symbol: { type: String, required: true },
    sector: String,
    high: Number,
    low: Number,
    close: Number,
    open: Number,
    volume: Number,
    retest: String,
    retestDate: Date,
    date: Date,
}, {
    timestamps: true
});

// Create a unique index on sid and symbol to avoid duplicates
schema.index({ sid: 1, symbol: 1 }, { unique: true });

const SdFilteredStock = mongoose.model('SdFilteredStock', schema);

module.exports = SdFilteredStock;
