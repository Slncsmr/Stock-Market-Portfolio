import React from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const PriceChart = ({ portfolioData }) => {
  if (!portfolioData || portfolioData.length === 0) {
    return null;
  }

  // Combine all transactions from all stocks and sort by timestamp
  const allTransactions = portfolioData.reduce((acc, stock) => {
    const stockTransactions = stock.transactionHistory || [];
    return [...acc, ...stockTransactions.map(t => ({
      ...t,
      symbol: stock.symbol
    }))];
  }, []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Calculate cumulative values at each transaction point
  let cumulativeValue = 0;
  const dataPoints = allTransactions.map(transaction => {
    if (transaction.type === 'buy') {
      cumulativeValue += transaction.value;
    } else {
      cumulativeValue -= transaction.value;
    }
    return {
      x: new Date(transaction.timestamp),
      y: cumulativeValue
    };
  });

  // Calculate current total value
  const currentTotalValue = portfolioData.reduce((total, stock) => 
    total + (stock.currentValue || 0), 0);

  // Add current value as the last point if there are transactions
  if (dataPoints.length > 0) {
    dataPoints.push({
      x: new Date(),
      y: currentTotalValue
    });
  }

  const data = {
    datasets: [
      {
        label: 'Portfolio Value',
        data: dataPoints,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Portfolio Value Over Time',
        color: '#1a237e',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `Value: ₹${value.toLocaleString('en-IN', {
              maximumFractionDigits: 2
            })}`;
          },
          title: function(context) {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short'
            });
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day'
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Portfolio Value (₹)'
        },
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN', {
              maximumFractionDigits: 2
            });
          }
        }
      }
    }
  };

  return (
    <div className="price-chart">
      <Line data={data} options={options} />
    </div>
  );
};

PriceChart.propTypes = {
  portfolioData: PropTypes.arrayOf(
    PropTypes.shape({
      symbol: PropTypes.string.isRequired,
      currentPrice: PropTypes.number,
      currentValue: PropTypes.number,
      averageBuyPrice: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
      transactionHistory: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.oneOf(['buy', 'sell']).isRequired,
          quantity: PropTypes.number.isRequired,
          price: PropTypes.number.isRequired,
          value: PropTypes.number.isRequired,
          timestamp: PropTypes.string.isRequired
        })
      )
    })
  ).isRequired
};

export default PriceChart;