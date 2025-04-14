import React, { useState, useEffect } from 'react';
import api from '../services/api';
import webSocketService from '../services/websocket';
import { formatIndianNumber } from '../utils/numberFormat';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
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
      const response = await api.get('/portfolio/summary');
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
      {user && <h2>Welcome, {user.name}!</h2>}
      
      <div className="portfolio-card">
        <h3>Portfolio Overview</h3>
        <div className="summary-cards">
          <div className="summary-item">
            <h4>Total Investment</h4>
            <p>{formatIndianNumber(summary.totalInvestment)}</p>
          </div>
          <div className="summary-item">
            <h4>Current Value</h4>
            <p>{formatIndianNumber(summary.currentValue)}</p>
          </div>
          <div className="summary-item">
            <h4>Total P/L</h4>
            <p style={{ color: totalProfitLoss >= 0 ? '#22c55e' : '#ef4444' }}>
              {formatIndianNumber(totalProfitLoss)}
              <span style={{ marginLeft: '4px' }}>
                ({totalProfitLossPercentage.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="portfolio-card">
        <h3>Your Holdings</h3>
        <div className="holdings-table">
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
                  <td>{formatIndianNumber(item.averageBuyPrice)}</td>
                  <td>{formatIndianNumber(item.currentPrice)}</td>
                  <td>{formatIndianNumber(item.investment)}</td>
                  <td>{formatIndianNumber(item.currentValue)}</td>
                  <td className={item.profitLoss >= 0 ? 'profit' : 'loss'}>
                    {formatIndianNumber(item.profitLoss)}
                    <span>({item.profitLossPercentage.toFixed(2)}%)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;