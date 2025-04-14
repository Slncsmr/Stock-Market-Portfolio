import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatIndianNumber } from '../utils/numberFormat';

const TopUp = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [lastTransactionAmount, setLastTransactionAmount] = useState(0);
  const [transactionType, setTransactionType] = useState('topup'); // 'topup' or 'withdraw'
  const [lastTransactionType, setLastTransactionType] = useState('topup');

  useEffect(() => {
    fetchUserBalance();
  }, []);

  const fetchUserBalance = async () => {
    try {
      const response = await api.get('/auth/profile');
      setCurrentBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const predefinedAmounts = [1000, 5000, 10000, 25000, 50000];

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount.toString());
    setShowCustomAmount(false);
    setError('');
    setShowSuccessScreen(false);
  };

  const handleCustomAmount = () => {
    setAmount('');
    setShowCustomAmount(true);
    setError('');
    setShowSuccessScreen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = transactionType === 'topup' ? '/auth/topup' : '/auth/withdraw';
      const response = await api.post(endpoint, { amount: Number(amount) });
      const newBalance = response.data.balance;
      setCurrentBalance(newBalance);
      setLastTransactionAmount(Number(amount));
      setLastTransactionType(transactionType);
      setShowSuccessScreen(true);
      setAmount('');
      setShowCustomAmount(false);
      
      // Update stored user data with new balance
      const storedUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        balance: newBalance
      }));
    } catch (error) {
      setError(error.response?.data?.message || `Failed to process ${transactionType}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="topup-container">
      <h2>Manage Your Funds</h2>
      
      <div className="topup-card">
        <div className="balance-section">
          <h3>Current Balance</h3>
          <p className="balance">{formatIndianNumber(currentBalance)}</p>
        </div>

        {showSuccessScreen ? (
          <div className="success-screen">
            <div className="success-icon">✓</div>
            <div className="success-message">
              <h3>{lastTransactionType === 'topup' ? 'Top-up' : 'Withdrawal'} Successful!</h3>
              <p className="amount-added">
                {lastTransactionType === 'topup' ? 'Amount Added: ' : 'Amount Withdrawn: '}
                {formatIndianNumber(lastTransactionAmount)}
              </p>
              <p className="new-balance">New Balance: {formatIndianNumber(currentBalance)}</p>
            </div>
            <button 
              onClick={() => setShowSuccessScreen(false)} 
              className="continue-btn"
            >
              Make Another Transaction
            </button>
          </div>
        ) : (
          <>
            <div className="transaction-type-selector">
              <button 
                className={`type-btn ${transactionType === 'topup' ? 'selected' : ''}`}
                onClick={() => setTransactionType('topup')}
              >
                Add Funds
              </button>
              <button 
                className={`type-btn ${transactionType === 'withdraw' ? 'selected' : ''}`}
                onClick={() => setTransactionType('withdraw')}
              >
                Withdraw Funds
              </button>
            </div>

            <div className="predefined-amounts">
              <h3>{transactionType === 'topup' ? 'Select Amount to Add' : 'Select Amount to Withdraw'}</h3>
              <div className="amount-buttons">
                {predefinedAmounts.map((preAmount) => (
                  <button
                    key={preAmount}
                    type="button"
                    onClick={() => handleAmountSelect(preAmount)}
                    className={`amount-btn ${Number(amount) === preAmount ? 'selected' : ''}`}
                    disabled={transactionType === 'withdraw' && preAmount > currentBalance}
                  >
                    {formatIndianNumber(preAmount)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleCustomAmount}
                  className={`amount-btn ${showCustomAmount ? 'selected' : ''}`}
                >
                  Custom Amount
                </button>
              </div>
            </div>

            {(showCustomAmount || amount) && (
              <form onSubmit={handleSubmit} className="topup-form">
                {showCustomAmount && (
                  <div className="form-group">
                    <label htmlFor="amount">Enter Amount</label>
                    <div className="amount-input">
                      <span className="currency-symbol">₹</span>
                      <input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="100"
                        max={transactionType === 'withdraw' ? currentBalance : undefined}
                        required
                      />
                    </div>
                  </div>
                )}

                {error && <div className="error-message">{error}</div>}

                {amount && (
                  <button 
                    type="submit" 
                    disabled={loading || (transactionType === 'withdraw' && Number(amount) > currentBalance)}
                  >
                    {loading ? 'Processing...' : `${transactionType === 'topup' ? 'Add' : 'Withdraw'} ${formatIndianNumber(Number(amount))}`}
                  </button>
                )}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TopUp;