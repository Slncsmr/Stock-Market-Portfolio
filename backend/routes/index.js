const express = require('express');
const router = express.Router();
const stockRoutes = require('./stocks');
const portfolioRoutes = require('./portfolio');

router.use('/stocks', stockRoutes);
router.use('/portfolio', portfolioRoutes);

module.exports = router;