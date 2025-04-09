const Stock = require('../models/Stock');
const { getStockQuote } = require('./stockService');

const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 5; // Process 5 stocks at a time to respect API limits

async function updateStockPrices() {
    try {
        // Get all stocks from database
        const stocks = await Stock.find({}, 'symbol');
        
        // Process stocks in batches
        for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
            const batch = stocks.slice(i, i + BATCH_SIZE);
            
            // Update each stock in the batch
            await Promise.all(batch.map(async (stock) => {
                try {
                    const quote = await getStockQuote(stock.symbol);
                    await Stock.findOneAndUpdate(
                        { symbol: stock.symbol },
                        { 
                            ...quote,
                            lastUpdated: new Date(),
                            cached: false
                        }
                    );
                    console.log(`Updated ${stock.symbol} successfully`);
                } catch (error) {
                    console.error(`Error updating ${stock.symbol}:`, error.message);
                }
            }));

            // Wait 1 minute between batches to respect API rate limits
            if (i + BATCH_SIZE < stocks.length) {
                await new Promise(resolve => setTimeout(resolve, 60 * 1000));
            }
        }
    } catch (error) {
        console.error('Error in update job:', error);
    }
}

function startUpdateJob() {
    console.log('Starting stock price update job');
    updateStockPrices();
    setInterval(updateStockPrices, UPDATE_INTERVAL);
}

module.exports = { startUpdateJob };