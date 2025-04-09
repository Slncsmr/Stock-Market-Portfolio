import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    buyPrice: ''
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/portfolio');
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
      await axios.delete(`http://localhost:5001/api/portfolio/${id}`);
      fetchPortfolio();
    } catch (error) {
      console.error('Error deleting stock:', error);
    }
  };

  return (
    <div className="portfolio">
      <h2>Add Stock to Portfolio</h2>
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
        <button type="submit">Add Stock</button>
      </form>

      <div className="portfolio-list">
        <h3>Your Portfolio</h3>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Average Buy Price</th>
              <th>Total Investment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((stock) => (
              <tr key={stock._id}>
                <td>{stock.symbol}</td>
                <td>{stock.quantity}</td>
                <td>₹{stock.averageBuyPrice.toFixed(2)}</td>
                <td>₹{(stock.quantity * stock.averageBuyPrice).toFixed(2)}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(stock._id)}
                    className="delete-btn"
                  >
                    Delete
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