const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');

// Get all portfolio items
router.get('/', async (req, res) => {
  try {
    const portfolio = await Portfolio.find();
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add stock to portfolio
router.post('/', async (req, res) => {
  try {
    const existingStock = await Portfolio.findOne({ symbol: req.body.symbol.toUpperCase() });
    
    if (existingStock) {
      // Update existing position
      const newQuantity = existingStock.quantity + req.body.quantity;
      const newTotalCost = (existingStock.quantity * existingStock.averageBuyPrice) + 
                          (req.body.quantity * req.body.buyPrice);
      existingStock.quantity = newQuantity;
      existingStock.averageBuyPrice = newTotalCost / newQuantity;
      existingStock.lastUpdated = Date.now();
      
      const updatedStock = await existingStock.save();
      res.json(updatedStock);
    } else {
      // Create new position
      const portfolio = new Portfolio({
        symbol: req.body.symbol.toUpperCase(),
        quantity: req.body.quantity,
        averageBuyPrice: req.body.buyPrice
      });
      
      const newPortfolio = await portfolio.save();
      res.status(201).json(newPortfolio);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update portfolio item
router.patch('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    if (req.body.quantity) portfolio.quantity = req.body.quantity;
    if (req.body.averageBuyPrice) portfolio.averageBuyPrice = req.body.averageBuyPrice;
    portfolio.lastUpdated = Date.now();

    const updatedPortfolio = await portfolio.save();
    res.json(updatedPortfolio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete portfolio item
router.delete('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    await portfolio.remove();
    res.json({ message: 'Portfolio item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get portfolio summary with current market value
router.get('/summary', async (req, res) => {
  try {
    const portfolio = await Portfolio.find();
    const summary = {
      totalInvestment: 0,
      currentValue: 0,
      items: []
    };

    for (const item of portfolio) {
      const stock = await Stock.findOne({ symbol: item.symbol });
      const investment = item.quantity * item.averageBuyPrice;
      const currentValue = item.quantity * (stock ? stock.currentPrice : item.averageBuyPrice);
      
      summary.totalInvestment += investment;
      summary.currentValue += currentValue;
      summary.items.push({
        ...item._doc,
        currentPrice: stock ? stock.currentPrice : item.averageBuyPrice,
        investment,
        currentValue,
        profitLoss: currentValue - investment,
        profitLossPercentage: ((currentValue - investment) / investment) * 100
      });
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;