const yahooFinance = require('yahoo-finance2').default;



async function fetchStockDateWise({ interval = '1d', symbol, pastDate}) {
    const now = new Date();
    const period2 = Math.floor(now.getTime() / 1000);

    const period1 = Math.floor(pastDate.getTime() / 1000);

    const queryOptions = { period1, period2, interval };

    try {
        const result = await yahooFinance.chart(symbol, queryOptions);

        if (!result || !result.quotes) {
            throw new Error('No quotes found in the response.');
        }

       return  result.quotes


    } catch (error) {
        console.error(`Error fetching data for symbol ${symbol}:`, error);
        throw error;
    }
}


async function fetchStockData({days = 2, interval = '15m', symbol}) {
    const now = new Date();
    const period2 = Math.floor(now.getTime() / 1000);

    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - days);
    const period1 = Math.floor(pastDate.getTime() / 1000);

    const queryOptions = { period1, period2, interval };

    try {
        const result = await yahooFinance.chart(symbol, queryOptions);

        if (!result || !result.quotes) {
            throw new Error('No quotes found in the response.');
        }

       return  result.quotes


    } catch (error) {
        console.error(`Error fetching data for symbol ${symbol}:`, error);
        throw error;
    }
}


module.exports = { fetchStockData, fetchStockDateWise }