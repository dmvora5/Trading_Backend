const catchAsyncError = fun => (req, res, next) => Promise.resolve(fun(req, res, next)).catch(err => next(err))


const TIMEFRAME = {
    ONEM: '1m',
    TWOM: "2m",
    FIVEM: "5m",
    FIFTEENM: "15m",
    THIRTYM: "30m",
    SIXTEEM: "60m",
    NINTYM: "90m",
    ONEHOUR: "1h",
    ONEDAY: "1d",
    FIVEDAY: "5d",
    ONEWEEK: "1wk",
    ONEMONTH: "1mo",
    THREEMONTH: "3mo"
}


const getTimeFramsBackDays = (timeFrame) => {
    switch (timeFrame) {
        case TIMEFRAME.FIVEM:
            return 59;
        case TIMEFRAME.FIFTEENM:
            return 59
        case TIMEFRAME.ONEDAY:
            return 2000
        case TIMEFRAME.ONEHOUR:
            return 729;
        case TIMEFRAME.ONEWEEK:
            return 10000;
        case TIMEFRAME.ONEMONTH:
            return 40000;
        default:
            return 59;

    }
}


module.exports = {catchAsyncError, TIMEFRAME, getTimeFramsBackDays }