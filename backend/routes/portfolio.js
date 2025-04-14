const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Assuming auth middleware is defined
const { isIndianStock } = require('../services/stockService');

// Get all portfolio items
router.get('/', async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ user: req.user._id });
    const enrichedPortfolio = await Promise.all(portfolio.map(async (item) => {
      const stock = await Stock.findOne({ symbol: item.symbol });
      const currentPrice = stock ? stock.currentPrice : item.averageBuyPrice;
      const investment = item.quantity * item.averageBuyPrice;
      const currentValue = item.quantity * currentPrice;
      const profitLoss = currentValue - investment;
      
      return {
        ...item._doc,
        currentPrice,
        currentValue,
        investment,
        profitLoss,
        profitLossPercentage: (profitLoss / investment) * 100
      };
    }));
    
    res.json(enrichedPortfolio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add stock to portfolio
router.post('/', async (req, res) => {
  try {
    const { symbol, quantity, buyPrice } = req.body;
    
    // Validate stock symbol
    if (!isIndianStock(symbol)) {
      return res.status(400).json({ 
        message: `Invalid stock symbol. '${symbol}' is not a valid stock.` 
      });
    }

    // Validate minimum purchase amount (₹100)
    const totalCost = quantity * buyPrice;
    if (totalCost < 100) {
      return res.status(400).json({ 
        message: 'Minimum purchase amount is ₹100' 
      });
    }

    // Check user's balance
    const user = await User.findById(req.user._id);
    if (user.balance < totalCost) {
      return res.status(400).json({ 
        message: `Insufficient balance. Required: ${totalCost}, Available: ${user.balance}` 
      });
    }

    const existingStock = await Portfolio.findOne({ 
      symbol: symbol.toUpperCase(),
      user: req.user._id
    });
    
    let updatedPortfolio;
    if (existingStock) {
      // Update existing position
      const newQuantity = existingStock.quantity + quantity;
      const newTotalCost = (existingStock.quantity * existingStock.averageBuyPrice) + 
                          (quantity * buyPrice);
      existingStock.quantity = newQuantity;
      existingStock.averageBuyPrice = newTotalCost / newQuantity;
      existingStock.lastUpdated = Date.now();
      updatedPortfolio = await existingStock.save();
    } else {
      // Create new position
      const portfolio = new Portfolio({
        symbol: symbol.toUpperCase(),
        quantity,
        averageBuyPrice: buyPrice,
        user: req.user._id
      });
      updatedPortfolio = await portfolio.save();
    }
    
    // Update user's balance
    user.balance -= totalCost;
    await user.save();
    
    res.status(201).json({
      portfolio: updatedPortfolio,
      newBalance: user.balance
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get portfolio summary with current market value
router.get('/summary', async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ user: req.user._id });
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

    // Add user balance to the summary
    const user = await User.findById(req.user._id).select('balance');
    summary.balance = user.balance;

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validate portfolio item ownership middleware
const validateOwnership = async (req, res, next) => {
  try {
    const portfolioItem = await Portfolio.findById(req.params.id);
    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    
    if (portfolioItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this portfolio item' });
    }
    
    req.portfolioItem = portfolioItem;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Use ownership validation for update and delete routes
router.patch('/:id', validateOwnership, async (req, res) => {
  try {
    const portfolio = req.portfolioItem;
    if (req.body.quantity) portfolio.quantity = req.body.quantity;
    if (req.body.averageBuyPrice) portfolio.averageBuyPrice = req.body.averageBuyPrice;
    portfolio.lastUpdated = Date.now();

    const updatedPortfolio = await portfolio.save();
    res.json(updatedPortfolio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', validateOwnership, async (req, res) => {
  try {
    const portfolioItem = req.portfolioItem;
    const stock = await Stock.findOne({ symbol: portfolioItem.symbol });
    const currentPrice = stock ? stock.currentPrice : portfolioItem.averageBuyPrice;
    const saleValue = portfolioItem.quantity * currentPrice;

    // Update user's balance with sale proceeds
    const user = await User.findById(req.user._id);
    user.balance += saleValue;
    await user.save();

    await portfolioItem.deleteOne();
    res.json({ 
      message: 'Stock sold successfully',
      saleValue,
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Partial sell route with auth middleware
router.post('/:id/partial-sell', auth, validateOwnership, async (req, res) => {
  try {
    const { quantity } = req.body;
    const stock = req.portfolioItem;
    const currentStock = await Stock.findOne({ symbol: stock.symbol });

    if (!currentStock) {
      return res.status(404).json({ message: 'Current stock price not found' });
    }

    // Validate quantity
    if (!quantity || quantity <= 0 || quantity > stock.quantity) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    // Calculate sell value using current price
    const sellValue = quantity * currentStock.currentPrice;

    // Update user's balance
    const user = await User.findById(req.user._id);
    user.balance += sellValue;
    await user.save();

    if (quantity === stock.quantity) {
      // If selling all shares, remove the stock entry
      await Portfolio.deleteOne({ _id: stock._id });
    } else {
      // Update remaining quantity
      stock.quantity -= quantity;
      await stock.save();
    }

    res.json({
      message: 'Stock partially sold successfully',
      newBalance: user.balance
    });
  } catch (error) {
    console.error('Error in partial sell:', error);
    res.status(500).json({ message: error.message || 'Error selling stock' });
  }
});

module.exports = router;