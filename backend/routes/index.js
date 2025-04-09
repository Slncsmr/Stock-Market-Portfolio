const express = require('express');
const router = express.Router();
const stockRoutes = require('./stocks');
const portfolioRoutes = require('./portfolio');
const authRoutes = require('./auth');
const authMiddleware = require('../middleware/auth');

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/stocks', authMiddleware, stockRoutes);
router.use('/portfolio', authMiddleware, portfolioRoutes);

module.exports = router;