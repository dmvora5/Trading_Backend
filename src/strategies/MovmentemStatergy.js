const { RsiIndicator: { Rsi } } = require('technical-strategies');
const { fetchStockData, fetchStockDateWise } = require('../services/stockDataFetcher');
const { logger } = require('../utils/logger');
const Stocks = require('../db/models/Stocks');

class MovmentemStrategy {
    constructor() {
        this.now = new Date();
        this.rsi = new Rsi();
        this.filteredStock = [];
    }

    applyRsi(data) {
        try {
            const rsiData = this.rsi.apply(data);
            const filteredData = rsiData.filter(ele => ele.date >= this.now);
            return filteredData[0]?.rsi || 0; // Fallback to 0 if RSI is undefined
        } catch (error) {
            logger.error('Failed to calculate RSI:', error.message);
            return 0;
        }
    }

    async conditionCheck(symbol) {
        try {
            const [halfHourData, fiveMinutesData] = await Promise.all([
                fetchStockData({ days: 15, interval: '30m', symbol }),
                fetchStockData({ days: 10, interval: '5m', symbol })
            ]);


            this.now = new Date(fiveMinutesData[fiveMinutesData.length - 1].date);
            this.now.setHours(9, 15, 0, 0); // Adjust based on your market's opening time

            const halfHourRsi = this.applyRsi(halfHourData);
            const fiveMinutesRsi = this.applyRsi(fiveMinutesData);

            const todayData = fiveMinutesData.filter(ele => new Date(ele.date) >= this.now);
            if (todayData.length < 5) {
                logger.warn(`Insufficient data for symbol ${symbol}`);
                return;
            }

            const [firstCandle, secondCandle, thirdCandle, fourthCandle] = todayData;
            const yesterdayLastCandle = fiveMinutesData[fiveMinutesData.indexOf(firstCandle) - 1];

            const pastDate = new Date(yesterdayLastCandle.date);
            pastDate.setHours(9,15,0,0);


            const previousDayData = await fetchStockDateWise({ interval: '1d', symbol, pastDate });
            const previousDayCandle = previousDayData[0];
           

            const openGreaterThanYesterdayHigh = firstCandle.open > previousDayCandle.high;
            const todayFiveMinCloseAboveYesterday = firstCandle.close >= previousDayCandle.high;
            const openLessThanYesterdayLow = firstCandle.open < previousDayCandle.low;
            const todayCloseBelowYesterday = firstCandle.close <= previousDayCandle.low;

            const secondCandleCondition = secondCandle.close > firstCandle.low && secondCandle.close < firstCandle.high;
            const thirdCandleCondition = thirdCandle.close > firstCandle.low && thirdCandle.close < firstCandle.high;
            const fourthCandleCondition = fourthCandle.close > firstCandle.low && fourthCandle.close < firstCandle.high;

            if (
                openGreaterThanYesterdayHigh &&
                todayFiveMinCloseAboveYesterday &&
                fiveMinutesRsi > 60 &&
                halfHourRsi > 60 &&
                secondCandleCondition &&
                thirdCandleCondition &&
                fourthCandleCondition
            ) {
                return { signal: "Buy", symbol };
            }

            if (
                openLessThanYesterdayLow &&
                todayCloseBelowYesterday &&
                fiveMinutesRsi < 40 &&
                halfHourRsi < 40 &&
                secondCandleCondition &&
                thirdCandleCondition &&
                fourthCandleCondition
            ) {
                return { signal: "Sell", symbol };
            }
        } catch (error) {
            logger.error(`Error processing symbol ${symbol}: ${error.message}`);
            return null; // Return null when there's an error to avoid further processing
        }
    }

    async run({ batchSize = 20, query = {} }) {
        logger.info(`MovmentemFilterRun started at ${new Date().toLocaleString()}`);

        try {
            const count = await Stocks.countDocuments(query);
            const totalPages = Math.ceil(count / batchSize);
            console.log('count', count)
            console.log("start", totalPages);
            for (let i = 1; i <= totalPages; i++) {
                console.log('i', i)
                const stocks = await Stocks.find(query).skip(i * batchSize).limit(batchSize).lean();
                const symbols = stocks.map(stock => stock.symbol);

                const results = await Promise.allSettled(symbols.map(symbol => this.conditionCheck(symbol)));

                results.forEach(result => {
                    if (result.status === 'fulfilled' && result.value) {
                        this.filteredStock.push(result.value);
                    } else if (result.status === 'rejected') {
                        logger.error(`Error processing stock: ${result.reason}`);
                    }
                });
            }
            console.log("finish")

            return this.filteredStock;

            // Further actions or logging for filtered stocks
        } catch (err) {
            logger.error(`Run encountered an error: ${err.message}`);
        }
    }
}


module.exports = { MovmentemStrategy };
