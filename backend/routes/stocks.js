const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Stock = require('../models/Stock');
const { getStockQuote, getCompanyInfo } = require('../services/stockService');

// Get stock by symbol - Now uses real-time data
router.get('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    // Get real-time stock data from Alpha Vantage
    const [quote, companyInfo] = await Promise.all([
      getStockQuote(symbol),
      getCompanyInfo(symbol)
    ]);

    // Merge quote and company info
    const stockData = {
      ...quote,
      companyName: companyInfo.companyName,
      sector: companyInfo.sector,
      industry: companyInfo.industry
    };

    // Update or create stock in database for caching
    await Stock.findOneAndUpdate(
      { symbol },
      stockData,
      { upsert: true, new: true }
    );

    res.json(stockData);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    
    // Fallback to cached data if API fails
    try {
      const cachedStock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
      if (cachedStock) {
        return res.json({
          ...cachedStock.toObject(),
          cached: true
        });
      }
    } catch (dbError) {
      console.error('Error fetching cached data:', dbError);
    }
    
    res.status(500).json({ message: 'Error fetching stock data' });
  }
});

// Update stock price - Now updates from real-time data
router.patch('/:symbol/price', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const quote = await getStockQuote(symbol);
    
    const stock = await Stock.findOneAndUpdate(
      { symbol },
      quote,
      { new: true }
    );

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    res.json(stock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// The following routes remain unchanged as they operate on the cached data
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add or update stock
router.post('/', [
  body('symbol').notEmpty().trim().toUpperCase(),
  body('companyName').notEmpty().trim(),
  body('currentPrice').isFloat({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const stock = await Stock.findOne({ symbol: req.body.symbol });
    if (stock) {
      // Update existing stock
      stock.companyName = req.body.companyName;
      stock.currentPrice = req.body.currentPrice;
      stock.dayHigh = req.body.dayHigh;
      stock.dayLow = req.body.dayLow;
      stock.volume = req.body.volume;
      stock.lastUpdated = Date.now();
      
      const updatedStock = await stock.save();
      res.json(updatedStock);
    } else {
      // Create new stock
      const newStock = new Stock({
        symbol: req.body.symbol,
        companyName: req.body.companyName,
        currentPrice: req.body.currentPrice,
        dayHigh: req.body.dayHigh,
        dayLow: req.body.dayLow,
        volume: req.body.volume
      });
      
      const savedStock = await newStock.save();
      res.status(201).json(savedStock);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete stock
router.delete('/:symbol', async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    await stock.deleteOne();
    res.json({ message: 'Stock deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;