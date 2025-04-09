const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  currentPrice: {
    type: Number,
    required: true,
  },
  dayHigh: Number,
  dayLow: Number,
  volume: Number,
  sector: String,
  industry: String,
  description: String,
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  cached: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Stock', stockSchema);