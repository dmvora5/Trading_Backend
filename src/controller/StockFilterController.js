const Stocks = require("../db/models/Stocks");
const { sdStatergy } = require("../strategies/sdStatergy");
const { catchAsyncError } = require("../utils");




exports.getIndicesAction = catchAsyncError(async (req, res, next) => {
    const indices = await Stocks.distinct('index');

    res.status(200).json({
        success: true,
        data: indices
    });
})