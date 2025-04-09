const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  averageBuyPrice: {
    type: Number,
    required: true
  },
  investmentDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Portfolio', portfolioSchema);