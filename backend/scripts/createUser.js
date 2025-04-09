const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createInitialUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = new User({
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'Password123!'
    });

    await user.save();
    console.log('Demo user created successfully!');
    console.log('Email: demo@example.com');
    console.log('Password: Password123!');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
};

createInitialUser();