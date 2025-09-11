# API پیشرفته

## توضیح
توسعه یک API جامع برای تعامل با سیستم از برنامه‌های خارجی. این API امکان دسترسی به تمام قابلیت‌های سیستم را از طریق یک رابط استاندارد فراهم می‌کند.

## مزایا
- یکپارچه‌سازی آسان با سیستم‌های دیگر
- قابلیت استفاده در پلتفرم‌های مختلف
- توسعه برنامه‌های کاربردی متنوع بر اساس سیستم اصلی
- جداسازی منطق کسب و کار از رابط کاربری
- امکان ایجاد اکوسیستم گسترده‌تر

## پیاده‌سازی
ایجاد یک API RESTful یا GraphQL با مستندات کامل:

```javascript
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
      
      // در یک سیستم واقعی، اینجا باید احراز هویت انجام شود
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
      // در یک سیستم واقعی، اینجا باید اطلاعات بازارها از سیستم معاملاتی دریافت شود
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
      
      // در یک سیستم واقعی، اینجا باید اطلاعات بازار از سیستم معاملاتی دریافت شود
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
      // در یک سیستم واقعی، اینجا باید تاریخچه معاملات از سیستم معاملاتی دریافت شود
      res.json({
        trades: [
          { id: '1', symbol: 'ETH/USDT', side: 'buy', amount: 1.0, price: 1650.25, timestamp: '2023-01-01T12:00:00Z' },
          { id: '2', symbol: 'BTC/USDT', side: 'sell', amount: 0.5, price: 28500.75, timestamp: '2023-01-02T14:30:00Z' }
        ]
      });
    });
    
    this.app.post('/api/trades', authenticate, (req, res) => {
      const { symbol, side, amount, price } = req.body;
      
      // اعتبارسنجی پارامترها
      if (!symbol || !side || !amount) {
        return res.status(400).json({ success: false, message: 'Missing required parameters' });
      }
      
      if (side !== 'buy' && side !== 'sell') {
        return res.status(400).json({ success: false, message: 'Side must be buy or sell' });
      }
      
      // در یک سیستم واقعی، اینجا باید معامله در سیستم معاملاتی اجرا شود
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
      // در یک سیستم واقعی، اینجا باید اطلاعات پورتفولیو از سیستم معاملاتی دریافت شود
      res.json({
        portfolio: {
          totalValue: 15000.50,
          assets: [
            { asset: 'ETH', amount: 5.0, value: 8401.25 },
            { asset: 'BTC', amount: 0.2, value: 5790.15 },
            { asset: 'USDT', amount: 809.10, value: 809.10 }
          ]
        }
      });
    });
    
    // Strategies
    this.app.get('/api/strategies', authenticate, (req, res) => {
      // در یک سیستم واقعی، اینجا باید استراتژی‌های موجود از سیستم معاملاتی دریافت شود
      res.json({
        strategies: [
          { id: '1', name: 'MACD Crossover', description: 'MACD crossover strategy', active: true },
          { id: '2', name: 'RSI Oversold', description: 'RSI oversold strategy', active: false }
        ]
      });
    });
    
    this.app.get('/api/strategies/:id', authenticate, (req, res) => {
      const { id } = req.params;
      
      // در یک سیستم واقعی، اینجا باید اطلاعات استراتژی از سیستم معاملاتی دریافت شود
      if (id === '1') {
        res.json({
          id: '1',
          name: 'MACD Crossover',
          description: 'MACD crossover strategy',
          active: true,
          parameters: {
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9
          },
          performance: {
            winRate: 65.5,
            profitFactor: 1.8,
            sharpeRatio: 1.2
          }
        });
      } else {
        res.status(404).json({ success: false, message: 'Strategy not found' });
      }
    });
    
    this.app.post('/api/strategies/:id/activate', authenticate, (req, res) => {
      const { id } = req.params;
      
      // در یک سیستم واقعی، اینجا باید استراتژی در سیستم معاملاتی فعال شود
      res.json({
        success: true,
        message: `Strategy ${id} activated successfully`
      });
    });
    
    this.app.post('/api/strategies/:id/deactivate', authenticate, (req, res) => {
      const { id } = req.params;
      
      // در یک سیستم واقعی، اینجا باید استراتژی در سیستم معاملاتی غیرفعال شود
      res.json({
        success: true,
        message: `Strategy ${id} deactivated successfully`
      });
    });
    
    // Error handling
    this.app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    });
    
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found'
      });
    });
  }
  
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          console.log(`API server running on port ${this.config.port}`);
          resolve(this.server);
        });
      } catch (error) {
        console.error('Failed to start API server:', error);
        reject(error);
      }
    });
  }
  
  stop() {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      
      this.server.close((err) => {
        if (err) {
          console.error('Error closing API server:', err);
          reject(err);
          return;
        }
        
        console.log('API server stopped');
        resolve();
      });
    });
  }
}

// نمونه استفاده
const tradingSystem = {}; // در یک سیستم واقعی، این باید نمونه‌ای از سیستم معاملاتی باشد

const apiServer = new APIServer(tradingSystem, {
  port: 3000,
  jwtSecret: 'your-secret-key',
  rateLimits: {
    window: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window
  }
});

apiServer.start()
  .then(() => {
    console.log('API server started successfully');
  })
  .catch((error) => {
    console.error('Failed to start API server:', error);
  });

// برای توقف سرور
// apiServer.stop();
```

## نحوه پیاده‌سازی در پروژه

1. **طراحی API**:
   - تعریف نقاط پایانی (Endpoints) مورد نیاز
   - تعریف مدل‌های داده و پاسخ‌ها
   - طراحی سیستم احراز هویت و مجوزدهی

2. **انواع API قابل پیاده‌سازی**:
   - RESTful API: برای تعامل عمومی و سازگاری با اکثر سیستم‌ها
   - GraphQL: برای انعطاف‌پذیری بیشتر در درخواست‌های داده
   - WebSocket: برای ارتباط دوطرفه و داده‌های زنده

3. **امنیت**:
   - احراز هویت با JWT یا OAuth2
   - محدودیت نرخ درخواست (Rate Limiting)
   - HTTPS برای رمزگذاری انتقال داده
   - اعتبارسنجی ورودی‌ها

4. **مستندسازی**:
   - ایجاد مستندات API با Swagger یا OpenAPI
   - ارائه نمونه‌های درخواست و پاسخ
   - توضیح کامل پارامترها و کدهای خطا

5. **تست و مانیتورینگ**:
   - تست‌های واحد و یکپارچگی برای API
   - مانیتورینگ عملکرد و دسترس‌پذیری
   - ثبت لاگ برای عیب‌یابی

## مراحل پیاده‌سازی

1. **فاز 1**: طراحی API و تعریف نقاط پایانی
2. **فاز 2**: پیاده‌سازی سیستم احراز هویت و مجوزدهی
3. **فاز 3**: پیاده‌سازی نقاط پایانی اصلی
4. **فاز 4**: پیاده‌سازی ویژگی‌های پیشرفته (WebSocket، GraphQL)
5. **فاز 5**: مستندسازی و تست

## نکات مهم

- طراحی API با در نظر گرفتن نسخه‌بندی برای تغییرات آینده
- استفاده از استانداردهای HTTP برای کدهای وضعیت و متدها
- بهینه‌سازی عملکرد برای حجم بالای درخواست
- در نظر گرفتن محدودیت‌های منابع سرور
- پیاده‌سازی سیستم کش برای بهبود عملکرد