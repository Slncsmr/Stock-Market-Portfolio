import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatIndianNumber } from '../utils/numberFormat';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
      setFormData({
        name: response.data.name || '',
        phone: response.data.phone || ''
      });
    } catch (error) {
      setError('Failed to fetch profile data');
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
    setError('');
    setSuccess('');

    try {
      const response = await api.patch('/auth/profile', formData);
      setUser(response.data);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      const storedUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...storedUser, ...formData }));
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating profile');
    }
  };

  if (!user) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      <h2>Profile Management</h2>
      
      <div className="profile-card">
        <div className="balance-section">
          <h3>Available Balance</h3>
          <p className="balance">{formatIndianNumber(user.balance || 0)}</p>
          <p className="balance-info">This balance can be used to purchase stocks</p>
        </div>

        {!isEditing ? (
          <div className="profile-details">
            <h3>Profile Details</h3>
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span>{user.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span>{user.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span>{user.phone || 'Not set'}</span>
            </div>
            <button onClick={() => setIsEditing(true)} className="edit-btn">
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <h3>Edit Profile</h3>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <div className="button-group">
              <button type="submit">Save Changes</button>
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;