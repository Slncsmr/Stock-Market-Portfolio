import React, { useState, useEffect } from 'react';
import api from '../services/api';
import webSocketService from '../services/websocket';
import { formatIndianNumber } from '../utils/numberFormat';

const StockSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    webSocketService.connect();
    fetchUserBalance();
    const unsubscribe = webSocketService.subscribe((stockData) => {
      setStocks(prevStocks => {
        return prevStocks.map(stock => {
          if (stock.symbol === stockData.symbol) {
            const updatedStock = {
              ...stock,
              currentPrice: stockData.currentPrice,
              dayHigh: stockData.dayHigh,
              dayLow: stockData.dayLow,
              volume: stockData.volume,
              lastUpdated: new Date()
            };
            return updatedStock;
          }
          return stock;
        });
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const fetchUserBalance = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUserBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const symbol = searchTerm.toUpperCase();
    try {
      const response = await api.get(`/stocks/${symbol}`);
      const stockData = Array.isArray(response.data) ? response.data : [response.data];
      
      if (stockData.length === 0) {
        setError(`No stock found with symbol "${symbol}"`);
        setStocks([]);
      } else {
        setStocks(stockData.map(stock => ({
          ...stock,
          lastUpdated: new Date()
        })));
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
      const errorMessage = error.response?.data?.message || error.message;
      
      if (errorMessage.includes('API rate limit')) {
        setError(`API rate limit reached. Please wait a minute before trying again.`);
      } else if (errorMessage.includes('AlphaVantage API key not configured')) {
        setError(`To search international stocks like ${symbol}, please configure the API key. Contact administrator.`);
      } else {
        setError(errorMessage || `Failed to fetch data for ${symbol}. Please verify the symbol and try again.`);
      }
      setStocks([]);
    }
    setLoading(false);
  };

  const addToPortfolio = async (stock) => {
    try {
      if (stock.currentPrice > userBalance) {
        setError(`Insufficient balance. Required: ${formatIndianNumber(stock.currentPrice)}, Available: ${formatIndianNumber(userBalance)}`);
        return;
      }

      await api.post('/portfolio', {
        symbol: stock.symbol,
        quantity: 1,
        buyPrice: stock.currentPrice
      });

      setUserBalance(prevBalance => prevBalance - stock.currentPrice);
      setSuccess('Stock added to portfolio!');
      setError('');

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      setError(error.response?.data?.message || 'Error adding stock to portfolio');
    }
  };

  return (
    <div className="stock-search">
      <div className="balance-info">
        <h3>Available Balance</h3>
        <p className="balance">{formatIndianNumber(userBalance)}</p>
      </div>

      <h2>Search Stocks</h2>
      <form onSubmit={handleSearch} className="search-form" style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter stock symbol (e.g., RELIANCE)"
            required
            style={{ width: '100%' }}
          />
        </div>
        <button type="submit">Search</button>
      </form>

      {loading && <div>Loading...</div>}
      {error && <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
      {success && <div className="success-message" style={{ color: 'green', margin: '10px 0' }}>{success}</div>}

      <div className="search-results">
        {stocks.map((stock) => (
          <div key={stock.symbol} className="stock-card">
            <h3>{stock.symbol}</h3>
            <p className="company-name">{stock.companyName}</p>
            <div className="stock-details">
              <div className="detail">
                <span>Current Price:</span>
                <span>{formatIndianNumber(stock.currentPrice)}</span>
              </div>
              <div className="detail">
                <span>Day High:</span>
                <span>{stock.dayHigh ? formatIndianNumber(stock.dayHigh) : 'N/A'}</span>
              </div>
              <div className="detail">
                <span>Day Low:</span>
                <span>{stock.dayLow ? formatIndianNumber(stock.dayLow) : 'N/A'}</span>
              </div>
              <div className="detail">
                <span>Volume:</span>
                <span>{stock.volume?.toLocaleString() || 'N/A'}</span>
              </div>
              {stock.lastUpdated && (
                <div className="detail">
                  <span>Last Updated:</span>
                  <span>{new Date(stock.lastUpdated).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => addToPortfolio(stock)}
              className="add-to-portfolio-btn"
              disabled={stock.currentPrice > userBalance}
            >
              {stock.currentPrice > userBalance ? 'Insufficient Balance' : 'Buy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockSearch;