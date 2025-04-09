import React, { useState } from 'react';
import axios from 'axios';

const StockSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5001/api/stocks/${searchTerm.toUpperCase()}`);
      setStocks(Array.isArray(response.data) ? response.data : [response.data]);
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