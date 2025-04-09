import React, { useState, useEffect } from 'react';
import axios from 'axios';
import webSocketService from '../services/websocket';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    buyPrice: ''
  });

  useEffect(() => {
    fetchPortfolio();
    
    // Connect to WebSocket and subscribe to updates
    webSocketService.connect();
    const unsubscribe = webSocketService.subscribe((stockData) => {
      setPortfolio(prevPortfolio => {
        return prevPortfolio.map(item => {
          if (item.symbol === stockData.symbol) {
            const currentValue = item.quantity * stockData.currentPrice;
            const investment = item.quantity * item.averageBuyPrice;
            const profitLoss = currentValue - investment;
            return {
              ...item,
              currentPrice: stockData.currentPrice,
              currentValue,
              profitLoss,
              profitLossPercentage: (profitLoss / investment) * 100
            };
          }
          return item;
        });
      });
    });

    return () => {
      // Cleanup subscription when component unmounts
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/portfolio');
      // Add current price and calculations to each portfolio item
      const portfolioWithPrices = await Promise.all(
        response.data.map(async (item) => {
          try {
            const stockResponse = await axios.get(`http://localhost:5001/api/stocks/${item.symbol}`);
            const currentPrice = stockResponse.data.currentPrice;
            const currentValue = item.quantity * currentPrice;
            const investment = item.quantity * item.averageBuyPrice;
            const profitLoss = currentValue - investment;
            
            return {
              ...item,
              currentPrice,
              currentValue,
              profitLoss,
              profitLossPercentage: (profitLoss / investment) * 100
            };
          } catch (error) {
            console.error(`Error fetching price for ${item.symbol}:`, error);
            return item;
          }
        })
      );
      setPortfolio(portfolioWithPrices);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/portfolio', {
        symbol: formData.symbol.toUpperCase(),
        quantity: Number(formData.quantity),
        buyPrice: Number(formData.buyPrice)
      });
      setFormData({ symbol: '', quantity: '', buyPrice: '' });
      fetchPortfolio();
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:5001/api/portfolio/${id}`);
      if (response.data.message === 'Stock sold successfully') {
        fetchPortfolio(); // Refresh the portfolio after successful sell
      }
    } catch (error) {
      console.error('Error selling stock:', error);
      alert('Error selling stock. Please try again.');
    }
  };

  return (
    <div className="portfolio">
      <h2>Buy Stock</h2>
      <form onSubmit={handleSubmit} className="add-stock-form">
        <div className="form-group">
          <input
            type="text"
            name="symbol"
            placeholder="Stock Symbol (e.g., RELIANCE)"
            value={formData.symbol}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="number"
            name="buyPrice"
            placeholder="Buy Price (₹)"
            value={formData.buyPrice}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit">Buy Stock</button>
      </form>

      <div className="portfolio-list">
        <h3>Your Portfolio</h3>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Avg. Buy Price</th>
              <th>Current Price</th>
              <th>Total Investment</th>
              <th>Current Value</th>
              <th>P/L</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((stock) => (
              <tr key={stock._id}>
                <td>{stock.symbol}</td>
                <td>{stock.quantity}</td>
                <td>₹{stock.averageBuyPrice.toFixed(2)}</td>
                <td>₹{(stock.currentPrice || stock.averageBuyPrice).toFixed(2)}</td>
                <td>₹{(stock.quantity * stock.averageBuyPrice).toFixed(2)}</td>
                <td>₹{(stock.currentValue || (stock.quantity * stock.averageBuyPrice)).toFixed(2)}</td>
                <td className={stock.profitLoss >= 0 ? 'profit' : 'loss'}>
                  ₹{(stock.profitLoss || 0).toFixed(2)}
                  <span>({(stock.profitLossPercentage || 0).toFixed(2)}%)</span>
                </td>
                <td>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to sell all ${stock.quantity} shares of ${stock.symbol}?`)) {
                        handleDelete(stock._id);
                      }
                    }}
                    className="delete-btn"
                  >
                    Sell
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Portfolio;