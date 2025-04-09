const mongoose = require('mongoose');
const Stock = require('./models/Stock');
require('dotenv').config();

const sampleStocks = [
  {
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Ltd.',
    currentPrice: 2450.75,
    dayHigh: 2460.00,
    dayLow: 2435.50,
    volume: 1245678
  },
  {
    symbol: 'TCS',
    companyName: 'Tata Consultancy Services Ltd.',
    currentPrice: 3250.80,
    dayHigh: 3275.25,
    dayLow: 3240.00,
    volume: 987654
  },
  {
    symbol: 'INFY',
    companyName: 'Infosys Ltd.',
    currentPrice: 1475.60,
    dayHigh: 1480.00,
    dayLow: 1470.25,
    volume: 876543
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await Stock.deleteMany({});
    console.log('Cleared existing stocks');
    
    // Insert sample stocks
    await Stock.insertMany(sampleStocks);
    console.log('Sample stocks inserted successfully');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();