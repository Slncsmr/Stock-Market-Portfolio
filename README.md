# Stock Market Portfolio

A full-stack web application for managing and tracking your stock market investments. This application allows users to create and manage their stock portfolios, track real-time stock prices, and analyze their investment performance.

## Features

- Real-time stock price tracking using WebSocket connections
- Portfolio management with multiple portfolio support
- Live stock search functionality
- Interactive price charts with historical data
- User authentication and profile management
- Automated price updates via background services
- Real-time portfolio value calculations
- Cash balance management with top-up functionality

## Architecture

### Backend Architecture
- **Node.js & Express**: RESTful API server
- **MongoDB**: Database for storing user, portfolio, and stock data
- **WebSocket Server**: Real-time price updates and portfolio changes
- **Background Services**: 
  - Automated stock price updates
  - Market data synchronization
  - Portfolio value calculations

### Frontend Architecture
- **React.js**: Single page application
- **Material-UI**: Modern and responsive UI components
- **Chart.js**: Interactive price and portfolio charts
- **WebSocket Client**: Real-time data updates
- **Axios**: HTTP client for API communication

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB
- WebSocket (ws)
- JWT Authentication

### Frontend
- React.js
- Material-UI
- Chart.js for data visualization
- Axios for API calls
- React Context for state management

## Project Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Install Dependencies

To install all required dependencies, run:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd frontend
npm install
```

### Setting Up the Development Environment

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file with necessary configurations
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Environment Variables

Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
JWT_SECRET=your_jwt_secret
STOCK_API_KEY=your_stock_api_key
WEBSOCKET_PORT=5001
```

## API Documentation

The API endpoints are available at `http://localhost:5000/api`

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Stock Endpoints
- `GET /api/stocks/search` - Search for stocks
- `GET /api/stocks/:symbol` - Get stock details
- `GET /api/stocks/:symbol/history` - Get historical prices

### Portfolio Endpoints
- `GET /api/portfolio` - Get user portfolios
- `POST /api/portfolio` - Create new portfolio
- `PUT /api/portfolio/:id` - Update portfolio
- `DELETE /api/portfolio/:id` - Delete portfolio
- `POST /api/portfolio/:id/buy` - Buy stocks
- `POST /api/portfolio/:id/sell` - Sell stocks

### User Management
- `PUT /api/users/topup` - Add funds to account
- `GET /api/users/balance` - Get account balance
- `PUT /api/users/profile` - Update user profile

## WebSocket Events

The application uses WebSocket for real-time updates:
- `price_update` - Real-time stock price updates
- `portfolio_update` - Portfolio value changes
- `trade_confirmation` - Trade execution confirmations

## Security

- JWT-based authentication
- Password hashing using bcrypt
- Protected API endpoints
- Input validation and sanitization
- Rate limiting on API endpoints

## Running Tests

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors who have helped with the development
- Built with modern web technologies 
