const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    index: { type: String, default: null },
    symbol: String,
    sector: String,
})

const Stocks = mongoose.model('Stocks', schema);

module.exports = Stocks;