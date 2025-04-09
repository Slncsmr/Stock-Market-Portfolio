import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import StockSearch from './components/StockSearch';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">BSE Portfolio Tracker</div>
          <ul className="nav-links">
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/portfolio">Portfolio</Link></li>
            <li><Link to="/search">Search Stocks</Link></li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/search" element={<StockSearch />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
