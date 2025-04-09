import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/portfolio/summary');
      setSummary(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!summary) return <div>No portfolio data available</div>;

  return (
    <div className="dashboard">
      <h2>Portfolio Overview</h2>
      <div className="summary-cards">
        <div className="card">
          <h3>Total Investment</h3>
          <p>₹{summary.totalInvestment.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>Current Value</h3>
          <p>₹{summary.currentValue.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>Total P/L</h3>
          <p className={summary.currentValue - summary.totalInvestment >= 0 ? 'profit' : 'loss'}>
            ₹{(summary.currentValue - summary.totalInvestment).toFixed(2)}
            <span>
              ({((summary.currentValue - summary.totalInvestment) / summary.totalInvestment * 100).toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>

      <div className="holdings-table">
        <h3>Your Holdings</h3>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Avg. Buy Price</th>
              <th>Current Price</th>
              <th>Investment</th>
              <th>Current Value</th>
              <th>P/L</th>
            </tr>
          </thead>
          <tbody>
            {summary.items.map((item) => (
              <tr key={item.symbol}>
                <td>{item.symbol}</td>
                <td>{item.quantity}</td>
                <td>₹{item.averageBuyPrice.toFixed(2)}</td>
                <td>₹{item.currentPrice.toFixed(2)}</td>
                <td>₹{item.investment.toFixed(2)}</td>
                <td>₹{item.currentValue.toFixed(2)}</td>
                <td className={item.profitLoss >= 0 ? 'profit' : 'loss'}>
                  ₹{item.profitLoss.toFixed(2)}
                  <span>({item.profitLossPercentage.toFixed(2)}%)</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;