
const csv = require('csv-parser');
const stream = require('stream');
const { catchAsyncError } = require('../utils');
const Stocks = require('../db/models/Stocks');


exports.insertStocksFromCsvAction = catchAsyncError(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorHandler("No file uploaded.", 400))
    }

    const indices = req.body.indices;

    const results = [];
    const fileStream = new stream.Readable();
    fileStream.push(req.file.buffer);
    fileStream.push(null);

    fileStream
        .pipe(csv())
        .on('data', (data) => {
            // Clean up the keys in the data object
            const cleanedData = {};
            for (let key in data) {
                const cleanedKey = key.trim().replace(/^"|"$/g, ''); // Trim spaces and remove surrounding quotes
                cleanedData[cleanedKey] = data[key];
            }
            results.push(cleanedData);
        })
        .on('end', async () => {
            const symbols = [...new Set(results.map(row => row['SYMBOL \n'] ? `${row['SYMBOL \n'].trim()}.NS` : null).filter(Boolean))];
            const filteredSymbols = symbols.filter(symbol => !symbol.includes(' ')).map(symbol => ({ symbol, index: indices }));

            await Stocks.insertMany(filteredSymbols);

            res.status(200).json({
                success: true,
                message: 'Stocks inserted successfully!',
                data: filteredSymbols
            });
        })
        .on('error', (err) => {
            res.status(500).send('Error processing file.');
        });
})