/**
 * Advanced Telegram Bot Configuration
 * پیکربندی پیشرفته ربات تلگرام
 */

require('dotenv').config();

const config = {
  // تنظیمات پایه ربات
  bot: {
    token: process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
    webhook: {
      url: process.env.TELEGRAM_WEBHOOK_URL || null,
      port: parseInt(process.env.TELEGRAM_WEBHOOK_PORT) || 3000,
      enabled: process.env.TELEGRAM_WEBHOOK_ENABLED === 'true',
    },
    polling: {
      enabled: process.env.TELEGRAM_POLLING_ENABLED !== 'false',
      interval: parseInt(process.env.TELEGRAM_POLLING_INTERVAL) || 1000,
      timeout: parseInt(process.env.TELEGRAM_POLLING_TIMEOUT) || 10,
    },
    options: {
      onlyFirstMatch: true,
      request: {
        agentOptions: {
          keepAlive: true,
          family: 4,
        },
      },
    },
  },

  // تنظیمات امنیت
  security: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotation: process.env.ENCRYPTION_KEY_ROTATION || '24h',
      masterKey: process.env.ENCRYPTION_MASTER_KEY || 'your-master-key-here',
    },
    authentication: {
      requiredLayers: ['telegram', 'wallet'],
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 1800000, // 30 minutes
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900000, // 15 minutes
    },
    rateLimiting: {
      requestsPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE) || 60,
      burstLimit: parseInt(process.env.RATE_LIMIT_BURST) || 10,
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    },
    whitelist: {
      enabled: process.env.WHITELIST_ENABLED === 'true',
      users: (process.env.WHITELIST_USERS || '').split(',').filter(Boolean),
    },
  },

  // تنظیمات AI
  ai: {
    enabled: process.env.AI_ENABLED !== 'false',
    models: {
      nlp: process.env.AI_NLP_MODEL || 'gpt-4',
      prediction: process.env.AI_PREDICTION_MODEL || 'custom-lstm',
      sentiment: process.env.AI_SENTIMENT_MODEL || 'bert-base',
      translation: process.env.AI_TRANSLATION_MODEL || 'google-translate',
    },
    confidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) || 0.7,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    apiKeys: {
      openai: process.env.OPENAI_API_KEY,
      google: process.env.GOOGLE_API_KEY,
      huggingface: process.env.HUGGINGFACE_API_KEY,
    },
  },

  // تنظیمات چندزبانه
  localization: {
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'fa',
    supportedLanguages: [
      'fa',
      'en',
      'ar',
      'tr',
      'ru',
      'zh',
      'ja',
      'ko',
      'es',
      'fr',
      'de',
      'it',
      'pt',
      'hi',
      'ur',
    ],
    autoDetect: process.env.AUTO_DETECT_LANGUAGE !== 'false',
    fallbackLanguage: 'en',
    translationCache: {
      enabled: true,
      ttl: 3600000, // 1 hour
    },
  },

  // تنظیمات نوتیفیکیشن
  notifications: {
    enabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
    channels: {
      telegram: {
        enabled: true,
        priority: 'high',
      },
      email: {
        enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
      },
      sms: {
        enabled: process.env.SMS_NOTIFICATIONS_ENABLED === 'true',
        provider: process.env.SMS_PROVIDER || 'twilio',
        apiKey: process.env.SMS_API_KEY,
        apiSecret: process.env.SMS_API_SECRET,
      },
    },
    priorities: {
      critical: ['telegram', 'email', 'sms'],
      high: ['telegram', 'email'],
      medium: ['telegram'],
      low: ['telegram'],
    },
    rateLimits: {
      perUser: {
        perMinute: 30,
        perHour: 100,
        perDay: 500,
      },
      global: {
        perMinute: 1000,
        perHour: 10000,
      },
    },
  },

  // تنظیمات معاملات
  trading: {
    enabled: process.env.TRADING_ENABLED !== 'false',
    defaultSlippage: parseFloat(process.env.DEFAULT_SLIPPAGE) || 0.5,
    maxTradeAmount: parseFloat(process.env.MAX_TRADE_AMOUNT) || 1000,
    minTradeAmount: parseFloat(process.env.MIN_TRADE_AMOUNT) || 0.001,
    autoConfirm: process.env.AUTO_CONFIRM_TRADES === 'true',
    confirmationTimeout: parseInt(process.env.TRADE_CONFIRMATION_TIMEOUT) || 300000, // 5 minutes
    supportedTokens: (process.env.SUPPORTED_TOKENS || 'ETH,USDC,USDT,BTC').split(','),
    exchanges: {
      uniswap: {
        enabled: true,
        router: process.env.UNISWAP_ROUTER || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      },
      sushiswap: {
        enabled: process.env.SUSHISWAP_ENABLED === 'true',
        router: process.env.SUSHISWAP_ROUTER || '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      },
    },
  },

  // تنظیمات پایگاه داده
  database: {
    type: process.env.DATABASE_TYPE || 'mongodb',
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-bot',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    },
  },

  // تنظیمات API
  api: {
    enabled: process.env.API_ENABLED !== 'false',
    port: parseInt(process.env.API_PORT) || 3001,
    host: process.env.API_HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
  },

  // تنظیمات لاگ
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    transports: {
      console: {
        enabled: true,
        level: 'debug',
      },
      file: {
        enabled: process.env.FILE_LOGGING_ENABLED === 'true',
        filename: process.env.LOG_FILE || './logs/telegram-bot.log',
        level: 'info',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      },
      database: {
        enabled: process.env.DB_LOGGING_ENABLED === 'true',
        level: 'warn',
      },
    },
  },

  // تنظیمات کش
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    type: process.env.CACHE_TYPE || 'memory',
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_CACHE_DB) || 1,
    },
  },

  // تنظیمات ادمین
  admin: {
    userId: process.env.ADMIN_USER_ID,
    username: process.env.ADMIN_USERNAME,
    permissions: {
      broadcast: true,
      manageUsers: true,
      viewAnalytics: true,
      manageAlerts: true,
      systemControl: true,
    },
  },

  // تنظیمات توسعه
  development: {
    enabled: process.env.NODE_ENV === 'development',
    debug: process.env.DEBUG === 'true',
    mockData: process.env.MOCK_DATA === 'true',
    testMode: process.env.TEST_MODE === 'true',
  },

  // تنظیمات مانیتورینگ
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    healthCheck: {
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
    },
    metrics: {
      enabled: process.env.METRICS_ENABLED === 'true',
      port: parseInt(process.env.METRICS_PORT) || 9090,
    },
    alerts: {
      enabled: process.env.MONITORING_ALERTS_ENABLED === 'true',
      webhook: process.env.MONITORING_WEBHOOK_URL,
    },
  },

  // تنظیمات فایل‌ها
  files: {
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,txt').split(','),
    cleanupInterval: parseInt(process.env.FILE_CLEANUP_INTERVAL) || 3600000, // 1 hour
  },

  // تنظیمات زمان‌بندی
  scheduler: {
    enabled: process.env.SCHEDULER_ENABLED !== 'false',
    timezone: process.env.SCHEDULER_TIMEZONE || 'Asia/Tehran',
    jobs: {
      cleanup: {
        enabled: true,
        schedule: '0 2 * * *', // Daily at 2 AM
        timezone: 'Asia/Tehran',
      },
      backup: {
        enabled: process.env.BACKUP_ENABLED === 'true',
        schedule: '0 3 * * 0', // Weekly on Sunday at 3 AM
        timezone: 'Asia/Tehran',
      },
      analytics: {
        enabled: true,
        schedule: '0 */6 * * *', // Every 6 hours
        timezone: 'Asia/Tehran',
      },
    },
  },
};

// اعتبارسنجی تنظیمات
function validateConfig() {
  const required = ['TELEGRAM_BOT_TOKEN'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn('⚠️ Missing required environment variables:', missing);
    console.warn('Please set these variables in your .env file');
  }

  // اعتبارسنجی تنظیمات ربات
  if (!config.bot.token || config.bot.token === 'YOUR_BOT_TOKEN_HERE') {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }

  // اعتبارسنجی تنظیمات امنیت
  if (config.security.encryption.masterKey === 'your-master-key-here') {
    console.warn(
      '⚠️ Using default encryption key. Please set ENCRYPTION_MASTER_KEY for production'
    );
  }

  return true;
}

// اعتبارسنجی و export
validateConfig();

module.exports = config;
