class WebSocketService {
  constructor() {
    this.ws = null;
    this.subscribers = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.ws = new WebSocket('ws://localhost:5001');

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          switch (message.type) {
            case 'STOCK_UPDATE':
              this.notifySubscribers(message.data);
              break;
            case 'CONNECTION_ESTABLISHED':
              console.log('Connection confirmed:', message.data.message);
              break;
            default:
              console.log('Received unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached. Please refresh the page.');
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    
    // If we're not connected, try to connect
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }
    
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }
}

export default new WebSocketService();
