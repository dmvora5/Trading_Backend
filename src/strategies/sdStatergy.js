const { StructuralSdIndicator: { StructuralSD } } = require("technical-strategies");
const { logger } = require("../utils/logger");
const Stocks = require("../db/models/Stocks");
const { fetchStockData } = require("../services/stockDataFetcher");
const { TIMEFRAME, getTimeFramsBackDays } = require("../utils");
const { getSelectedStock } = require("../config/socket");


const sdStatergy = async ({
    timeFrame = TIMEFRAME.FIVEM,
    query = {},
    pageSize = 100,
    eventName,
    level = false
}) => {

    console.log('input log', {
        timeFrame,
        query,
        pageSize,
    })
    try {
        console.log(new Date().toTimeString())
        console.log('"run at"', new Date().toLocaleString());

        const filter = [];

        const count = await Stocks.countDocuments(query);
        const totalPages = Math.ceil(count / pageSize);

        for (let i = 1; i <= totalPages; i++) {
            console.log(i);
            const stocks = await Stocks.find(query).skip((i - 1) * pageSize).limit(pageSize).lean();

            // Process stocks in parallel, but limit concurrency
            const stockPromises = stocks.map(stock => {
                return async () => {
                    try {
                        const data = await fetchStockData({ days: getTimeFramsBackDays(timeFrame), interval: timeFrame, symbol: stock.symbol });

                        const sd = new StructuralSD({
                            data: data,
                            indicatorConfig: {
                                lookBackCandlesForSignal: 3
                            }
                        });

                        const result = sd.apply({
                            leval: level,
                            // print: stock.symbol === 'MPHASIS.NS' ? true : false
                        });
                        if (result) {
                            return {
                                ...stock,
                                ...result
                            };
                        } else {
                            return null;
                        }
                    } catch (error) {
                        logger.error(`Error processing stock ${stock.symbol}: ${error.message}`);
                        return null;
                    }
                };
            });
            const results = await Promise.all(stockPromises.map(p => p()));


            filter.push(...results.filter(stock => stock !== null));

            // Limit concurrency to avoid overwhelming the system
            // let currentBatch = [];
            // for (let j = 0; j < stockPromises.length; j += concurrentRequests) {
            //     currentBatch = stockPromises.slice(j, j + concurrentRequests).map(p => p());
            //     const results = await Promise.all(currentBatch);

            //     // Filter non-null results and push to filter array
            //     filter.push(...results.filter(stock => stock !== null));
            // }
        }
        console.log(new Date().toTimeString());

        if(eventName) {
            getSelectedStock({
                eventName,
                data: filter
            })
        }


        return filter;

    } catch (err) {
        logger.error(err.message);
        console.log('err.message', err.message);
    }
};

module.exports = { sdStatergy };
