const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    index: { type: String, default: null },
    symbol: String,
    sector: String,
    filter: { type: String, default: null },
})

const FilteredStock = mongoose.model('FilteredStock', schema);

module.exports = FilteredStock;