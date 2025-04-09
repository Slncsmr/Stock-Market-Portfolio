const Stock = require('../models/Stock');
const { getStockQuote } = require('./stockService');
const { broadcastStockUpdate } = require('./websocketService');

const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 5; // Process 5 stocks at a time to respect API limits

async function updateStockPrice(stock) {
    try {
        const quote = await getStockQuote(stock.symbol);
        const updatedStock = await Stock.findOneAndUpdate(
            { symbol: stock.symbol },
            { 
                ...quote,
                lastUpdated: new Date(),
                cached: false
            },
            { new: true }
        );
        
        if (updatedStock) {
            broadcastStockUpdate(updatedStock);
            console.log(`Updated and broadcast ${stock.symbol} successfully`);
        }
    } catch (error) {
        console.error(`Error updating ${stock.symbol}:`, error.message);
    }
}

async function updateStockPrices() {
    try {
        const stocks = await Stock.find({}, 'symbol');
        if (stocks.length === 0) {
            console.log('No stocks found to update');
            return;
        }

        console.log(`Starting update for ${stocks.length} stocks`);
        
        // Process stocks in batches
        for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
            const batch = stocks.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}`);
            
            // Update each stock in the batch
            await Promise.all(batch.map(stock => updateStockPrice(stock)));

            // Wait between batches to respect API rate limits
            if (i + BATCH_SIZE < stocks.length) {
                await new Promise(resolve => setTimeout(resolve, 60 * 1000));
            }
        }
        
        console.log('Stock update cycle completed');
    } catch (error) {
        console.error('Error in update job:', error);
    }
}

function startUpdateJob() {
    console.log('Starting stock price update job');
    // Run initial update immediately
    updateStockPrices().then(() => {
        console.log('Initial stock update completed');
        // Set up recurring updates
        setInterval(updateStockPrices, UPDATE_INTERVAL);
    }).catch(error => {
        console.error('Error in initial stock update:', error);
    });
    
    // Handle process termination
    process.on('SIGTERM', () => {
        console.log('Stopping stock price update job');
        clearInterval(interval);
    });
}

module.exports = { startUpdateJob, updateStockPrices };