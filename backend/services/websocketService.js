const WebSocket = require('ws');
let wss;

const initializeWebSocket = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('New client connected');
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'CONNECTION_ESTABLISHED',
      data: { message: 'Connected to stock updates' }
    }));

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
};

const broadcastStockUpdate = (stockData) => {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }

  const message = JSON.stringify({
    type: 'STOCK_UPDATE',
    data: {
      symbol: stockData.symbol,
      currentPrice: stockData.currentPrice,
      dayHigh: stockData.dayHigh,
      dayLow: stockData.dayLow,
      volume: stockData.volume,
      lastUpdated: stockData.lastUpdated
    }
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending message to client:', error);
      }
    }
  });
};

module.exports = { initializeWebSocket, broadcastStockUpdate };
