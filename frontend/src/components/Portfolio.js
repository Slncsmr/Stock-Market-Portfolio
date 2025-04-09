import React, { useState, useEffect } from 'react';
import api from '../services/api';
import webSocketService from '../services/websocket';
import { formatIndianNumber } from '../utils/numberFormat';

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
              investment,
              profitLoss,
              profitLossPercentage: (profitLoss / investment) * 100,
              lastUpdated: new Date()
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
      const response = await api.get('/portfolio');
      setPortfolio(response.data);
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
      await api.post('/portfolio', {
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
      const response = await api.delete(`/portfolio/${id}`);
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
                <td>{formatIndianNumber(stock.averageBuyPrice)}</td>
                <td>{formatIndianNumber(stock.currentPrice || stock.averageBuyPrice)}</td>
                <td>{formatIndianNumber(stock.quantity * stock.averageBuyPrice)}</td>
                <td>{formatIndianNumber(stock.currentValue || (stock.quantity * stock.averageBuyPrice))}</td>
                <td className={stock.profitLoss >= 0 ? 'profit' : 'loss'}>
                  {formatIndianNumber(stock.profitLoss || 0)}
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