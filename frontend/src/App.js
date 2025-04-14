import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './App.css';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import StockSearch from './components/StockSearch';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import TopUp from './components/TopUp';

// Protected Route component moved outside App
const ProtectedRoute = ({ children }) => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return <Navigate to="/login" />;
  }
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">BSE Portfolio Tracker</div>
          <ul className="nav-links">
            {user ? (
              <>
                <li><Link to="/">Dashboard</Link></li>
                <li><Link to="/portfolio">Portfolio</Link></li>
                <li><Link to="/search">Search Stocks</Link></li>
                <li><Link to="/profile">Profile</Link></li>
                <li><Link to="/topup">Top Up</Link></li>
                <li>
                  <button onClick={handleLogout} className="logout-btn">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </>
            )}
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/login" element={
              user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            } />
            <Route path="/register" element={
              user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/portfolio" element={
              <ProtectedRoute>
                <Portfolio />
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <StockSearch />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/topup" element={
              <ProtectedRoute>
                <TopUp />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
