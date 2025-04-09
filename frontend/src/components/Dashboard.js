import React, { useState, useEffect } from 'react';
import axios from 'axios';
import webSocketService from '../services/websocket';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
    
    // Connect to WebSocket
    webSocketService.connect();

    // Subscribe to stock updates
    const unsubscribe = webSocketService.subscribe((stockData) => {
      setSummary(prevSummary => {
        if (!prevSummary) return prevSummary;

        try {
          const updatedItems = prevSummary.items.map(item => {
            if (item.symbol === stockData.symbol) {
              const currentValue = item.quantity * stockData.currentPrice;
              const investment = item.quantity * item.averageBuyPrice;
              const profitLoss = currentValue - investment;
              return {
                ...item,
                currentPrice: stockData.currentPrice,
                dayHigh: stockData.dayHigh,
                dayLow: stockData.dayLow,
                currentValue,
                investment,
                profitLoss,
                profitLossPercentage: (profitLoss / investment) * 100
              };
            }
            return item;
          });

          const totalCurrentValue = updatedItems.reduce((sum, item) => sum + item.currentValue, 0);
          const totalInvestment = updatedItems.reduce((sum, item) => sum + item.investment, 0);

          return {
            totalInvestment,
            currentValue: totalCurrentValue,
            items: updatedItems
          };
        } catch (error) {
          console.error('Error processing stock update:', error);
          return prevSummary;
        }
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const fetchSummary = async () => {
    try {
      setError(null);
      const response = await axios.get('http://localhost:5001/api/portfolio/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
      setError('Failed to load portfolio data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading your portfolio data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!summary) return <div className="no-data">No portfolio data available</div>;

  const totalProfitLoss = summary.currentValue - summary.totalInvestment;
  const totalProfitLossPercentage = (totalProfitLoss / summary.totalInvestment) * 100;

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
          <p className={totalProfitLoss >= 0 ? 'profit' : 'loss'}>
            ₹{totalProfitLoss.toFixed(2)}
            <span>
              ({totalProfitLossPercentage.toFixed(2)}%)
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
              <tr key={item.symbol} className={item.profitLoss >= 0 ? 'profit-row' : 'loss-row'}>
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