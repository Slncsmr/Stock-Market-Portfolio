import React, { useState, useEffect } from 'react';
import axios from 'axios';
import webSocketService from '../services/websocket';

const StockSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    webSocketService.connect();
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

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5001/api/stocks/${searchTerm.toUpperCase()}`);
      const stockData = Array.isArray(response.data) ? response.data : [response.data];
      setStocks(stockData.map(stock => ({
        ...stock,
        lastUpdated: new Date()
      })));
    } catch (error) {
      console.error('Error searching stocks:', error);
      setStocks([]);
    }
    setLoading(false);
  };

  const addToPortfolio = async (stock) => {
    try {
      await axios.post('http://localhost:5001/api/portfolio', {
        symbol: stock.symbol,
        quantity: 1,
        buyPrice: stock.currentPrice
      });
      alert('Stock added to portfolio!');
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      alert('Error adding stock to portfolio');
    }
  };

  return (
    <div className="stock-search">
      <h2>Search BSE Stocks</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter stock symbol (e.g., RELIANCE)"
          required
        />
        <button type="submit">Search</button>
      </form>

      {loading && <div>Loading...</div>}

      <div className="search-results">
        {stocks.map((stock) => (
          <div key={stock.symbol} className="stock-card">
            <h3>{stock.symbol}</h3>
            <p className="company-name">{stock.companyName}</p>
            <div className="stock-details">
              <div className="detail">
                <span>Current Price:</span>
                <span>₹{stock.currentPrice.toFixed(2)}</span>
              </div>
              <div className="detail">
                <span>Day High:</span>
                <span>₹{stock.dayHigh?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="detail">
                <span>Day Low:</span>
                <span>₹{stock.dayLow?.toFixed(2) || 'N/A'}</span>
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
            >
              Add to Portfolio
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockSearch;