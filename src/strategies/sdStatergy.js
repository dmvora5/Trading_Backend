const { StructuralSdIndicator: { StructuralSD } } = require("technical-strategies");
const { logger } = require("../utils/logger");
const Stocks = require("../db/models/Stocks");
const { fetchStockData } = require("../services/stockDataFetcher");
const { TIMEFRAME, getTimeFramsBackDays } = require("../utils");
const { getSelectedStock } = require("../config/socket");
const SdFilteredStock = require("../db/models/SdFilteredStock");


const saveSdFilterData = async (data) => {
    try {
        if (!data.length) return;

        // Remove the previous records
        await SdFilteredStock.deleteMany({ sid: data[0].sid });

        // Remove the _id field from each document before inserting
        const newData = data.map((item) => {
            const { _id, ...rest } = item._doc ? item._doc : item; // Ensure no _id
            return rest;
        });

        await SdFilteredStock.insertMany(newData);
    } catch (err) {
        console.log('err', err);
    }
};


const multiTimeframeSDAnalysis = async ({
    timeFrams = [TIMEFRAME.ONEHOUR, TIMEFRAME.FIFTEENM, TIMEFRAME.FIVEM],
    statergy,
    lookBackCandlesForSignal = 2,
    batchSize = 5 // Limit concurrency
}) => {
    console.log(new Date().toTimeString());
    console.log('"run at"', new Date().toLocaleString());

    const filter = [];
    const count = await Stocks.countDocuments(statergy.query || {});
    const totalPages = Math.ceil(count / pageSize);

    // Helper function to process a single stock
    const processStock = async (stock, timeFrame) => {
        try {
            const data = await fetchStockData({
                days: getTimeFramsBackDays(timeFrame),
                interval: timeFrame,
                symbol: stock.symbol
            });

            const sd = new StructuralSD({
                data,
                indicatorConfig: {
                    lookBackCandlesForSignal
                }
            });

            const result = sd.apply({
                level: statergy.fields.level === 'true'
            });

            return result ? { sid: statergy._id, ...stock, ...result } : null;
        } catch (error) {
            logger.error(`Error processing stock ${stock.symbol}: ${error.message}`);
            return null;
        }
    };

    // Helper function to process stocks in batches
    const processBatch = async (stocks, timeFrame) => {
        const stockPromises = stocks.map(stock => processStock(stock, timeFrame));
        const results = await Promise.allSettled(stockPromises);

        return results
            .filter(res => res.status === 'fulfilled' && res.value !== null)
            .map(res => res.value);
    };

    // Helper function to paginate and process all stocks for the first timeframe
    const processPaginatedStocks = async (timeFrame) => {
        for (let page = 1; page <= totalPages; page++) {
            console.log(`Page ${page}`);
            const stocks = await Stocks.find(statergy.query || {})
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean();

            for (let i = 0; i < stocks.length; i += batchSize) {
                const stockBatch = stocks.slice(i, i + batchSize);
                const batchResults = await processBatch(stockBatch, timeFrame);
                filter.push(...batchResults);
            }
        }
    };

    // Helper function to filter stocks in subsequent timeframes
    const processFilteredStocks = async (timeFrame) => {
        for (let i = 0; i < filter.length; i += batchSize) {
            const stockBatch = filter.slice(i, i + batchSize);
            const stockPromises = stockBatch.map((stock, index) => processStock(stock, timeFrame));
            const results = await Promise.allSettled(stockPromises);

            // Remove stock if it doesn't pass the current timeframe's signal
            results.forEach((res, index) => {
                if (res.status === 'fulfilled' && (res.value === null || res.value?.retest !== filter[i + index]?.retest)) {
                    filter.splice(i + index, 1);
                }
            });            
        }
    };

    // Process each timeframe
    for (const timeFrame of timeFrams) {
        if (timeFrame === timeFrams[0]) {
            await processPaginatedStocks(timeFrame);
        } else {
            await processFilteredStocks(timeFrame);
        }
    }

    return filter;
};



const sdStatergy = async ({
    pageSize = 50,
    statergy,
    lookBackCandlesForSignal = 2
}) => {

    console.log('input log', {
        timeFrame: statergy.timeFrame,
        query: statergy.query,
        pageSize,
    })
    try {
        console.log(new Date().toTimeString())
        console.log('"run at"', new Date().toLocaleString());

        const filter = [];

        const count = await Stocks.countDocuments(statergy.query || {});
        console.log('count', count)
        const totalPages = Math.ceil(count / pageSize);

        for (let i = 1; i <= totalPages; i++) {
            console.log(i);
            const stocks = await Stocks.find(statergy.query || {}).skip((i - 1) * pageSize).limit(pageSize).lean();

            // Process stocks in parallel, but limit concurrency
            const stockPromises = stocks.map(stock => {
                return async () => {
                    try {
                        const data = await fetchStockData({ days: getTimeFramsBackDays(statergy.timeFrame), interval: statergy.timeFrame, symbol: stock.symbol });

                        const sd = new StructuralSD({
                            data: data,
                            indicatorConfig: {
                                lookBackCandlesForSignal
                            }
                        });

                        const result = sd.apply({
                            leval: statergy.fields.level === 'true' ? true : false,
                            // print: stock.symbol === 'INDIGO.NS' ? true : false
                        });
                        if (result) {
                            return {
                                sid: statergy._id,
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

        if (statergy.eventName) {
            getSelectedStock({
                eventName: statergy.eventName,
                data: filter,
                callBack: saveSdFilterData
            })
        }


        return filter;

    } catch (err) {
        logger.error(err.message);
        console.log('err.message', err.message);
    }
};

module.exports = { sdStatergy, multiTimeframeSDAnalysis };
