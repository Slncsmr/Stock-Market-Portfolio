# Stock Market Portfolio

A full-stack web application for managing and tracking your stock market investments. This application allows users to create and manage their stock portfolios, track real-time stock prices, and analyze their investment performance.
<---
## Features

- Real-time stock price tracking
- Portfolio management and analysis
- Stock search functionality
- Historical price data visualization
- Multiple portfolio support
- Automated price updates

-->

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB
- RESTful API

### Frontend
- React.js
- Material-UI
- Chart.js for data visualization
- Axios for API calls

## Project Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Install Dependencies

To install all required dependencies, run:

```
npm install
```

To install the exact versions specified in package-lock.json (recommended for consistency across team members), run:

```
npm ci
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
```

## API Documentation

The API endpoints are available at `http://localhost:5000/api`

### Main Endpoints:
- `/api/stocks` - Stock-related operations
- `/api/portfolio` - Portfolio management
- `/api/users` - User authentication and management

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

## Contributors

<a href="https://github.com/Slncsmr/Stock-Market-Portfolio/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Slncsmr/Stock-Market-Portfolio" />
</a>

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.