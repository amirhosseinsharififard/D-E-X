/**
 * Advanced Telegram Bot for DEX Trading
 * ربات پیشرفته تلگرام برای معاملات DEX
 */

const TelegramBotManager = require('./core/TelegramBotManager');
const UserSessionManager = require('./core/UserSessionManager');
const NotificationManager = require('./core/NotificationManager');
const config = require('../config/telegram-bot.config');

class AdvancedTelegramBot {
  constructor() {
    this.config = config;
    this.botManager = null;
    this.sessionManager = null;
    this.notificationManager = null;
    this.isRunning = false;

    this.initialize();
  }

  /**
   * راه‌اندازی اولیه
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Advanced Telegram Bot...');

      // ایجاد مدیر جلسات
      this.sessionManager = new UserSessionManager();

      // ایجاد مدیر ربات تلگرام
      this.botManager = new TelegramBotManager({
        ...this.config,
        sessionManager: this.sessionManager,
      });

      // ایجاد مدیر نوتیفیکیشن
      this.notificationManager = new NotificationManager(this.botManager.bot);

      // تنظیم event handlers
      this.setupEventHandlers();

      // راه‌اندازی تایمرها
      this.setupTimers();

      console.log('✅ Advanced Telegram Bot initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Advanced Telegram Bot:', error);
      throw error;
    }
  }

  /**
   * راه‌اندازی event handlers
   */
  setupEventHandlers() {
    // مدیریت خطاهای ربات
    this.botManager.on('error', (error) => {
      console.error('Bot Manager Error:', error);
    });

    // مدیریت جلسات
    this.sessionManager.on('sessionCreated', (session) => {
      console.log(`👤 New session created for user ${session.userId}`);
    });

    this.sessionManager.on('sessionDeleted', (session) => {
      console.log(`🗑️ Session deleted for user ${session.userId}`);
    });

    // مدیریت نوتیفیکیشن‌ها
    this.notificationManager.on('alertTriggered', (alert, value) => {
      console.log(`🚨 Alert triggered: ${alert.id} - Value: ${value}`);
    });

    this.notificationManager.on('notificationSent', (notification) => {
      console.log(`📤 Notification sent to user ${notification.userId}`);
    });
  }

  /**
   * راه‌اندازی تایمرها
   */
  setupTimers() {
    // بررسی هشدارها هر 30 ثانیه
    setInterval(async () => {
      try {
        await this.notificationManager.checkAlerts();
      } catch (error) {
        console.error('Error checking alerts:', error);
      }
    }, 30000);

    // پاکسازی جلسات غیرفعال هر 5 دقیقه
    setInterval(() => {
      this.sessionManager.cleanupInactiveSessions();
    }, 300000);

    // گزارش وضعیت هر ساعت
    setInterval(() => {
      this.logStatus();
    }, 3600000);
  }

  /**
   * شروع ربات
   */
  async start() {
    try {
      if (this.isRunning) {
        console.log('⚠️ Bot is already running');
        return;
      }

      console.log('🔄 Starting Advanced Telegram Bot...');

      // بارگذاری جلسات ذخیره شده
      await this.sessionManager.loadSessionsFromFile('./data/sessions.json');

      this.isRunning = true;
      console.log('✅ Advanced Telegram Bot started successfully');

      // ارسال پیام شروع به ادمین
      if (this.config.admin.userId) {
        await this.botManager.sendMessage(
          this.config.admin.userId,
          '🤖 Advanced Telegram Bot started successfully!'
        );
      }
    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      throw error;
    }
  }

  /**
   * توقف ربات
   */
  async stop() {
    try {
      if (!this.isRunning) {
        console.log('⚠️ Bot is not running');
        return;
      }

      console.log('🛑 Stopping Advanced Telegram Bot...');

      // ذخیره جلسات
      await this.sessionManager.saveSessionsToFile('./data/sessions.json');

      // توقف مدیران
      this.notificationManager.stop();
      this.sessionManager.stop();
      await this.botManager.stop();

      this.isRunning = false;
      console.log('✅ Advanced Telegram Bot stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping bot:', error);
      throw error;
    }
  }

  /**
   * دریافت وضعیت ربات
   */
  getStatus() {
    const sessionStats = this.sessionManager.getSessionStats();
    const alertStats = this.notificationManager.getAlertStats();

    return {
      isRunning: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      sessions: sessionStats,
      alerts: alertStats,
      config: {
        language: this.config.localization.defaultLanguage,
        notifications: this.config.notifications.enabled,
        ai: this.config.ai.enabled,
      },
    };
  }

  /**
   * گزارش وضعیت
   */
  logStatus() {
    const status = this.getStatus();
    console.log('📊 Bot Status:', {
      running: status.isRunning,
      activeSessions: status.sessions.active,
      totalAlerts: status.alerts.total,
      activeAlerts: status.alerts.active,
    });
  }

  /**
   * ارسال پیام به کاربر
   */
  async sendMessageToUser(userId, message) {
    try {
      return await this.botManager.sendMessage(userId, message);
    } catch (error) {
      console.error(`Error sending message to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * ارسال پیام به گروه کاربران
   */
  async broadcastMessage(userIds, message) {
    try {
      const results = await this.sessionManager.broadcastToUsers(
        userIds,
        message,
        this.botManager.bot
      );
      return results;
    } catch (error) {
      console.error('Error broadcasting message:', error);
      throw error;
    }
  }

  /**
   * ایجاد هشدار برای کاربر
   */
  async createAlert(userId, type, params) {
    try {
      switch (type) {
        case 'price':
          return await this.notificationManager.setPriceAlert(
            userId,
            params.tokenAddress,
            params.targetPrice,
            params.condition
          );
        case 'volume':
          return await this.notificationManager.setVolumeAlert(
            userId,
            params.tokenAddress,
            params.targetVolume,
            params.condition
          );
        case 'technical':
          return await this.notificationManager.setTechnicalAlert(
            userId,
            params.tokenAddress,
            params.indicator,
            params.threshold,
            params.condition
          );
        default:
          throw new Error(`Unknown alert type: ${type}`);
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * دریافت هشدارهای کاربر
   */
  getUserAlerts(userId) {
    return this.notificationManager.getUserAlerts(userId);
  }

  /**
   * حذف هشدار
   */
  deleteAlert(alertId) {
    return this.notificationManager.deleteAlert(alertId);
  }

  /**
   * دریافت جلسه کاربر
   */
  getUserSession(userId) {
    return this.sessionManager.getSession(userId);
  }

  /**
   * به‌روزرسانی تنظیمات کاربر
   */
  updateUserPreferences(userId, preferences) {
    return this.sessionManager.updatePreferences(userId, preferences);
  }

  /**
   * دریافت آمار کلی
   */
  getAnalytics() {
    return {
      sessions: this.sessionManager.getSessionStats(),
      alerts: this.notificationManager.getAlertStats(),
      notifications: {
        queued: this.notificationManager.notificationQueue.length,
        rateLimits: this.notificationManager.rateLimits.size,
      },
    };
  }
}

// ایجاد instance اصلی
const telegramBot = new AdvancedTelegramBot();

// مدیریت graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  try {
    await telegramBot.stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  try {
    await telegramBot.stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// مدیریت خطاهای پردازش نشده
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// شروع ربات اگر مستقیماً اجرا شود
if (require.main === module) {
  telegramBot.start().catch((error) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
  });
}

module.exports = telegramBot;
