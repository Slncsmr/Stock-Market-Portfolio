import React, { useState, useEffect } from 'react';
import api from '../services/api';
import webSocketService from '../services/websocket';
import { formatIndianNumber } from '../utils/numberFormat';
import { isValidStock } from '../utils/stockUtils';
import PriceChart from './PriceChart';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    buyPrice: ''
  });
  const [partialSellData, setPartialSellData] = useState({
    stockId: null,
    symbol: '',
    maxQuantity: 0,
    quantity: '',
    currentPrice: 0,
    showModal: false
  });
  const [userBalance, setUserBalance] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPortfolio();
    fetchUserBalance();
    
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
      // Ensure portfolio data includes currentValue and investment calculations
      const portfolioWithValues = response.data.map(item => ({
        ...item,
        currentValue: item.quantity * (item.currentPrice || item.averageBuyPrice),
        investment: item.quantity * item.averageBuyPrice
      }));
      setPortfolio(portfolioWithValues);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUserBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
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
    setError('');
    setSuccess('');
    
    const symbol = formData.symbol.toUpperCase();
    if (!isValidStock(symbol)) {
      setError(`Invalid stock symbol. '${symbol}' is not a valid stock.`);
      return;
    }
    
    const totalCost = Number(formData.quantity) * Number(formData.buyPrice);
    
    if (totalCost > userBalance) {
      setError(`Insufficient balance. Required: ${formatIndianNumber(totalCost)}, Available: ${formatIndianNumber(userBalance)}`);
      return;
    }

    try {
      await api.post('/portfolio', {
        symbol,
        quantity: Number(formData.quantity),
        buyPrice: Number(formData.buyPrice)
      });
      
      // Update user balance and portfolio data
      setUserBalance(prevBalance => prevBalance - totalCost);
      setSuccess('Stock purchased successfully');
      setFormData({ symbol: '', quantity: '', buyPrice: '' });
      // Refresh portfolio to update the chart
      await fetchPortfolio();
    } catch (error) {
      console.error('Error adding stock:', error);
      setError(error.response?.data?.message || 'Error purchasing stock');
    }
  };

  const handleDelete = async (id, currentPrice, quantity) => {
    try {
      const response = await api.delete(`/portfolio/${id}`);
      if (response.data.message === 'Stock sold successfully') {
        // Update the local balance state
        setUserBalance(response.data.newBalance);
        
        // Update stored user data with new balance
        const storedUser = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          balance: response.data.newBalance
        }));
        
        // Refresh portfolio to update the chart
        await fetchPortfolio();
      }
    } catch (error) {
      console.error('Error selling stock:', error);
      setError('Error selling stock. Please try again.');
    }
  };

  const openPartialSellModal = (stock) => {
    setPartialSellData({
      stockId: stock._id,
      symbol: stock.symbol,
      maxQuantity: stock.quantity,
      quantity: '',
      currentPrice: stock.currentPrice,
      showModal: true
    });
  };

  const closePartialSellModal = () => {
    setPartialSellData({
      stockId: null,
      symbol: '',
      maxQuantity: 0,
      quantity: '',
      currentPrice: 0,
      showModal: false
    });
  };

  const handlePartialSellInputChange = (e) => {
    const value = e.target.value;
    if (value === '' || (Number(value) > 0 && Number(value) <= partialSellData.maxQuantity)) {
      setPartialSellData({
        ...partialSellData,
        quantity: value
      });
    }
  };

  const handlePartialSell = async () => {
    try {
      const response = await api.post(`/portfolio/${partialSellData.stockId}/partial-sell`, {
        quantity: Number(partialSellData.quantity)
      });
      
      if (response.data.message === 'Stock partially sold successfully') {
        setUserBalance(response.data.newBalance);
        
        // Update stored user data with new balance
        const storedUser = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          balance: response.data.newBalance
        }));
        
        closePartialSellModal();
        // Refresh portfolio to update the chart
        await fetchPortfolio();
        setSuccess('Stock partially sold successfully');
      }
    } catch (error) {
      console.error('Error partially selling stock:', error);
      setError(error.response?.data?.message || 'Error selling stock');
    }
  };

  return (
    <div className="portfolio">
      <div className="balance-info">
        <h3>Available Balance</h3>
        <p className="balance">{formatIndianNumber(userBalance)}</p>
      </div>

      <PriceChart portfolioData={portfolio} />

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

      <div className="message-container">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>

      <div className="portfolio-list">
        <h2>Your Portfolio</h2>
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
                  <div className="action-buttons">
                    <button 
                      onClick={() => openPartialSellModal(stock)}
                      className="partial-sell-btn"
                    >
                      Partial Sell
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to sell all ${stock.quantity} shares of ${stock.symbol}?`)) {
                          handleDelete(stock._id, stock.currentPrice, stock.quantity);
                        }
                      }}
                      className="delete-btn"
                    >
                      Sell All
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {partialSellData.showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Sell {partialSellData.symbol} Shares</h2>
            <div className="modal-body">
              <p>Current Price: ₹{formatIndianNumber(partialSellData.currentPrice)}</p>
              <p>Available Quantity: {partialSellData.maxQuantity}</p>
              <input
                type="number"
                value={partialSellData.quantity}
                onChange={handlePartialSellInputChange}
                placeholder="Enter quantity to sell"
                min="1"
                max={partialSellData.maxQuantity}
                required
              />
              {partialSellData.quantity && (
                <p>Total Value: ₹{formatIndianNumber(partialSellData.quantity * partialSellData.currentPrice)}</p>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={handlePartialSell} disabled={!partialSellData.quantity}>
                Confirm Sell
              </button>
              <button onClick={closePartialSellModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;