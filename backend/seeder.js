const mongoose = require('mongoose');
const Stock = require('./models/Stock');
const { getStockQuote, getCompanyInfo } = require('./services/stockService');
require('dotenv').config();

const stockSymbols = [
  'RELIANCE',
  'TCS',
  'INFY',
  'HDFCBANK',
  'ICICIBANK',
  'HINDUNILVR',
  'BHARTIARTL',
  'SBIN'
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await Stock.deleteMany({});
    console.log('Cleared existing stocks');
    
    // Fetch real-time data for each stock
    const stockPromises = stockSymbols.map(async (symbol) => {
      try {
        const [quote, info] = await Promise.all([
          getStockQuote(symbol),
          getCompanyInfo(symbol)
        ]);
        
        return {
          symbol,
          companyName: info.companyName,
          currentPrice: quote.currentPrice,
          dayHigh: quote.dayHigh,
          dayLow: quote.dayLow,
          volume: quote.volume,
          sector: info.sector,
          industry: info.industry,
          lastUpdated: new Date()
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return null;
      }
    });

    const stocksData = (await Promise.all(stockPromises)).filter(stock => stock !== null);
    
    // Insert stocks with real-time data
    await Stock.insertMany(stocksData);
    console.log('Stocks inserted successfully with real-time data');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();