const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

class APIServer {
  constructor(tradingSystem, config) {
    this.tradingSystem = tradingSystem;
    this.config = config || {
      port: 3000,
      jwtSecret: 'your-secret-key',
      rateLimits: {
        window: 15 * 60 * 1000, // 15 minutes
        max: 100 // 100 requests per window
      }
    };
    
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    // CORS
    this.app.use(cors());
    
    // Body parser
    this.app.use(bodyParser.json());
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimits.window,
      max: this.config.rateLimits.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: 429,
        message: 'Too many requests, please try again later.'
      }
    });
    
    this.app.use(limiter);
    
    // Logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }
  
  setupRoutes() {
    // API documentation
    this.app.get('/', (req, res) => {
      res.json({
        name: 'DEX Trading Bot API',
        version: '1.0.0',
        documentation: '/docs'
      });
    });
    
    // API documentation
    this.app.get('/docs', (req, res) => {
      res.json({
        endpoints: [
          { path: '/api/auth/login', method: 'POST', description: 'Authenticate and get JWT token' },
          { path: '/api/markets', method: 'GET', description: 'Get available markets' },
          { path: '/api/markets/:symbol', method: 'GET', description: 'Get market details' },
          { path: '/api/trades', method: 'GET', description: 'Get trade history' },
          { path: '/api/trades', method: 'POST', description: 'Execute a trade' },
          { path: '/api/portfolio', method: 'GET', description: 'Get portfolio information' },
          { path: '/api/strategies', method: 'GET', description: 'Get available trading strategies' },
          { path: '/api/strategies/:id', method: 'GET', description: 'Get strategy details' },
          { path: '/api/strategies/:id/activate', method: 'POST', description: 'Activate a strategy' },
          { path: '/api/strategies/:id/deactivate', method: 'POST', description: 'Deactivate a strategy' }
        ]
      });
    });
    
    // Authentication
    this.app.post('/api/auth/login', (req, res) => {
      const { username, password } = req.body;
      
      // In a real system, authentication should be performed here
      if (username === 'admin' && password === 'password') {
        const token = jwt.sign({ username }, this.config.jwtSecret, { expiresIn: '1h' });
        res.json({ success: true, token });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    });
    
    // Authentication middleware
    const authenticate = (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, this.config.jwtSecret);
        req.user = decoded;
        next();
      } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
    };
    
    // Protected routes
    // Markets
    this.app.get('/api/markets', authenticate, (req, res) => {
      // In a real system, market information should be retrieved from the trading system here
      res.json({
        markets: [
          { symbol: 'ETH/USDT', baseAsset: 'ETH', quoteAsset: 'USDT', price: 1680.25 },
          { symbol: 'BTC/USDT', baseAsset: 'BTC', quoteAsset: 'USDT', price: 28950.75 },
          { symbol: 'SOL/USDT', baseAsset: 'SOL', quoteAsset: 'USDT', price: 24.35 }
        ]
      });
    });
    
    this.app.get('/api/markets/:symbol', authenticate, (req, res) => {
      const { symbol } = req.params;
      
      // In a real system, market information should be retrieved from the trading system here
      if (symbol === 'ETH/USDT') {
        res.json({
          symbol: 'ETH/USDT',
          baseAsset: 'ETH',
          quoteAsset: 'USDT',
          price: 1680.25,
          priceChange24h: 2.5,
          volume24h: 1250000,
          high24h: 1720.50,
          low24h: 1650.75
        });
      } else {
        res.status(404).json({ success: false, message: 'Market not found' });
      }
    });
    
    // Trades
    this.app.get('/api/trades', authenticate, (req, res) => {
      // In a real system, trade history should be retrieved from the trading system here
      res.json({
        trades: [
          { id: '1', symbol: 'ETH/USDT', side: 'buy', amount: 1.0, price: 1650.25, timestamp: '2023-01-01T12:00:00Z' },
          { id: '2', symbol: 'BTC/USDT', side: 'sell', amount: 0.5, price: 28500.75, timestamp: '2023-01-02T14:30:00Z' }
        ]
      });
    });
    
    this.app.post('/api/trades', authenticate, (req, res) => {
      const { symbol, side, amount, price } = req.body;
      
      // Validate parameters
      if (!symbol || !side || !amount) {
        return res.status(400).json({ success: false, message: 'Missing required parameters' });
      }
      
      if (side !== 'buy' && side !== 'sell') {
        return res.status(400).json({ success: false, message: 'Side must be buy or sell' });
      }
      
      // In a real system, the trade should be executed in the trading system here
      res.json({
        success: true,
        trade: {
          id: Date.now().toString(),
          symbol,
          side,
          amount: parseFloat(amount),
          price: price ? parseFloat(price) : (side === 'buy' ? 1680.25 : 1680.25),
          timestamp: new Date().toISOString()
        }
      });
    });
    
    // Portfolio
    this.app.get('/api/portfolio', authenticate, (req, res) => {
      // In a real system, portfolio information should be retrieved from the trading system here
      res.json({
        portfolio: {
          totalValue: 50000,
          assets: [
            { asset: 'USDT', balance: 25000, value: 25000 },
            { asset: 'ETH', balance: 10, value: 16802.50 },
            { asset: 'BTC', balance: 0.25, value: 7237.69 },
            { asset: 'SOL', balance: 50, value: 1217.50 }
          ]
        }
      });
    });

    // Strategies
    this.app.get('/api/strategies', authenticate, (req, res) => {
        // In a real system, the list of strategies should be retrieved from the trading system
        res.json({
            strategies: [
                { id: '1', name: 'Momentum', description: 'Trades based on market momentum', active: true },
                { id: '2', name: 'Mean Reversion', description: 'Trades based on mean reversion', active: false }
            ]
        });
    });

    this.app.get('/api/strategies/:id', authenticate, (req, res) => {
        const { id } = req.params;
        // In a real system, strategy details should be retrieved from the trading system
        if (id === '1') {
            res.json({ id: '1', name: 'Momentum', description: 'Trades based on market momentum', active: true, parameters: { lookback: 20 } });
        } else {
            res.status(404).json({ success: false, message: 'Strategy not found' });
        }
    });

    this.app.post('/api/strategies/:id/activate', authenticate, (req, res) => {
        const { id } = req.params;
        // In a real system, this would activate the strategy in the trading system
        res.json({ success: true, message: `Strategy ${id} activated` });
    });

    this.app.post('/api/strategies/:id/deactivate', authenticate, (req, res) => {
        const { id } = req.params;
        // In a real system, this would deactivate the strategy in the trading system
        res.json({ success: true, message: `Strategy ${id} deactivated` });
    });
  }
  
  start() {
    this.app.listen(this.config.port, () => {
      console.log(`API server listening on port ${this.config.port}`);
    });
  }
}

module.exports = APIServer;