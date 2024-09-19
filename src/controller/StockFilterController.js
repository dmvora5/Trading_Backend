const { sdStatergy } = require("../strategies/sdStatergy");
const { catchAsyncError } = require("../utils");




exports.strucralSDFilter = catchAsyncError(async (req, res, next) => {

    const { timeFrame, query } = req.query;

    const stocks = await sdStatergy({
        timeFrame,
        query
    })

    return res.status(200).json({
        success: true,
        data: stocks,
        message: "Filtered stocks",
    });

});