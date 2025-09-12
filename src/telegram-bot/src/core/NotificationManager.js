/**
 * Notification Manager
 * مدیریت نوتیفیکیشن‌ها و هشدارها
 */

const EventEmitter = require('events');

class NotificationManager extends EventEmitter {
  constructor(telegramBot) {
    super();
    this.telegramBot = telegramBot;
    this.alerts = new Map();
    this.notificationQueue = [];
    this.isProcessing = false;
    this.rateLimits = new Map();
    this.maxNotificationsPerMinute = 30;

    this.startProcessingQueue();
  }

  /**
   * تنظیم هشدار قیمت
   */
  async setPriceAlert(userId, tokenAddress, targetPrice, condition = 'above') {
    const alertId = this.generateAlertId();
    const alert = {
      id: alertId,
      userId,
      tokenAddress,
      targetPrice: parseFloat(targetPrice),
      condition, // 'above', 'below', 'equals'
      status: 'active',
      createdAt: Date.now(),
      lastTriggered: null,
      triggerCount: 0,
    };

    this.alerts.set(alertId, alert);
    this.emit('alertCreated', alert);

    console.log(
      `🔔 Price alert created for user ${userId}: ${tokenAddress} ${condition} ${targetPrice}`
    );
    return alert;
  }

  /**
   * تنظیم هشدار حجم
   */
  async setVolumeAlert(userId, tokenAddress, targetVolume, condition = 'above') {
    const alertId = this.generateAlertId();
    const alert = {
      id: alertId,
      userId,
      tokenAddress,
      targetVolume: parseFloat(targetVolume),
      condition,
      type: 'volume',
      status: 'active',
      createdAt: Date.now(),
      lastTriggered: null,
      triggerCount: 0,
    };

    this.alerts.set(alertId, alert);
    this.emit('alertCreated', alert);

    console.log(
      `📊 Volume alert created for user ${userId}: ${tokenAddress} ${condition} ${targetVolume}`
    );
    return alert;
  }

  /**
   * تنظیم هشدار تکنیکال
   */
  async setTechnicalAlert(userId, tokenAddress, indicator, threshold, condition = 'above') {
    const alertId = this.generateAlertId();
    const alert = {
      id: alertId,
      userId,
      tokenAddress,
      indicator, // 'RSI', 'MACD', 'Bollinger', etc.
      threshold: parseFloat(threshold),
      condition,
      type: 'technical',
      status: 'active',
      createdAt: Date.now(),
      lastTriggered: null,
      triggerCount: 0,
    };

    this.alerts.set(alertId, alert);
    this.emit('alertCreated', alert);

    console.log(
      `📈 Technical alert created for user ${userId}: ${tokenAddress} ${indicator} ${condition} ${threshold}`
    );
    return alert;
  }

  /**
   * بررسی هشدارها
   */
  async checkAlerts() {
    const activeAlerts = Array.from(this.alerts.values()).filter(
      (alert) => alert.status === 'active'
    );

    for (const alert of activeAlerts) {
      try {
        await this.checkAlert(alert);
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * بررسی یک هشدار
   */
  async checkAlert(alert) {
    let shouldTrigger = false;
    let currentValue = 0;

    switch (alert.type || 'price') {
      case 'price':
        currentValue = await this.getCurrentPrice(alert.tokenAddress);
        shouldTrigger = this.evaluatePriceCondition(
          currentValue,
          alert.targetPrice,
          alert.condition
        );
        break;
      case 'volume':
        currentValue = await this.getCurrentVolume(alert.tokenAddress);
        shouldTrigger = this.evaluateVolumeCondition(
          currentValue,
          alert.targetVolume,
          alert.condition
        );
        break;
      case 'technical':
        currentValue = await this.getTechnicalIndicator(alert.tokenAddress, alert.indicator);
        shouldTrigger = this.evaluateTechnicalCondition(
          currentValue,
          alert.threshold,
          alert.condition
        );
        break;
    }

    if (shouldTrigger) {
      await this.triggerAlert(alert, currentValue);
    }
  }

  /**
   * ارزیابی شرط قیمت
   */
  evaluatePriceCondition(currentPrice, targetPrice, condition) {
    switch (condition) {
      case 'above':
        return currentPrice > targetPrice;
      case 'below':
        return currentPrice < targetPrice;
      case 'equals':
        return Math.abs(currentPrice - targetPrice) < targetPrice * 0.01; // 1% tolerance
      default:
        return false;
    }
  }

  /**
   * ارزیابی شرط حجم
   */
  evaluateVolumeCondition(currentVolume, targetVolume, condition) {
    switch (condition) {
      case 'above':
        return currentVolume > targetVolume;
      case 'below':
        return currentVolume < targetVolume;
      case 'equals':
        return Math.abs(currentVolume - targetVolume) < targetVolume * 0.05; // 5% tolerance
      default:
        return false;
    }
  }

  /**
   * ارزیابی شرط تکنیکال
   */
  evaluateTechnicalCondition(currentValue, threshold, condition) {
    switch (condition) {
      case 'above':
        return currentValue > threshold;
      case 'below':
        return currentValue < threshold;
      case 'equals':
        return Math.abs(currentValue - threshold) < threshold * 0.02; // 2% tolerance
      default:
        return false;
    }
  }

  /**
   * فعال‌سازی هشدار
   */
  async triggerAlert(alert, currentValue) {
    alert.lastTriggered = Date.now();
    alert.triggerCount++;

    const message = this.formatAlertMessage(alert, currentValue);

    await this.sendNotification(alert.userId, message, 'alert');
    this.emit('alertTriggered', alert, currentValue);

    console.log(`🚨 Alert triggered: ${alert.id} for user ${alert.userId}`);
  }

  /**
   * فرمت پیام هشدار
   */
  formatAlertMessage(alert, currentValue) {
    const emoji = this.getAlertEmoji(alert.type || 'price');
    const conditionText = this.getConditionText(alert.condition);

    let message = `${emoji} <b>هشدار فعال شد!</b>\n\n`;
    message += `📊 توکن: ${alert.tokenAddress}\n`;

    if (alert.type === 'technical') {
      message += `📈 شاخص: ${alert.indicator}\n`;
      message += `💰 مقدار فعلی: ${currentValue.toFixed(4)}\n`;
      message += `🎯 شرط: ${conditionText} ${alert.threshold}\n`;
    } else if (alert.type === 'volume') {
      message += `📊 حجم فعلی: $${currentValue.toLocaleString()}\n`;
      message += `🎯 شرط: ${conditionText} $${alert.targetVolume.toLocaleString()}\n`;
    } else {
      message += `💰 قیمت فعلی: $${currentValue.toFixed(2)}\n`;
      message += `🎯 شرط: ${conditionText} $${alert.targetPrice.toFixed(2)}\n`;
    }

    message += `\n⏰ زمان: ${new Date().toLocaleString('fa-IR')}`;

    return message;
  }

  /**
   * دریافت ایموجی هشدار
   */
  getAlertEmoji(type) {
    switch (type) {
      case 'price':
        return '💰';
      case 'volume':
        return '📊';
      case 'technical':
        return '📈';
      default:
        return '🔔';
    }
  }

  /**
   * دریافت متن شرط
   */
  getConditionText(condition) {
    switch (condition) {
      case 'above':
        return 'بالاتر از';
      case 'below':
        return 'پایین‌تر از';
      case 'equals':
        return 'برابر با';
      default:
        return condition;
    }
  }

  /**
   * ارسال نوتیفیکیشن
   */
  async sendNotification(userId, message, type = 'info', priority = 'normal') {
    const notification = {
      userId,
      message,
      type,
      priority,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: 3,
    };

    this.notificationQueue.push(notification);
    this.emit('notificationQueued', notification);
  }

  /**
   * شروع پردازش صف نوتیفیکیشن
   */
  startProcessingQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processQueue();
  }

  /**
   * پردازش صف نوتیفیکیشن
   */
  async processQueue() {
    while (this.isProcessing && this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();

      try {
        await this.sendNotificationToUser(notification);
      } catch (error) {
        console.error('Error sending notification:', error);

        notification.attempts++;
        if (notification.attempts < notification.maxAttempts) {
          this.notificationQueue.push(notification);
        }
      }

      // Rate limiting
      await this.applyRateLimit(notification.userId);
    }

    if (this.isProcessing) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  /**
   * ارسال نوتیفیکیشن به کاربر
   */
  async sendNotificationToUser(notification) {
    try {
      await this.telegramBot.sendMessage(notification.userId, notification.message);
      this.emit('notificationSent', notification);
    } catch (error) {
      if (error.response && error.response.statusCode === 403) {
        // User blocked the bot
        this.emit('userBlocked', notification.userId);
      }
      throw error;
    }
  }

  /**
   * اعمال محدودیت نرخ
   */
  async applyRateLimit(userId) {
    const now = Date.now();
    const userLimits = this.rateLimits.get(userId) || { count: 0, resetTime: now + 60000 };

    if (now > userLimits.resetTime) {
      userLimits.count = 0;
      userLimits.resetTime = now + 60000;
    }

    userLimits.count++;
    this.rateLimits.set(userId, userLimits);

    if (userLimits.count > this.maxNotificationsPerMinute) {
      const delay = userLimits.resetTime - now;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  /**
   * دریافت هشدارهای کاربر
   */
  getUserAlerts(userId) {
    return Array.from(this.alerts.values()).filter((alert) => alert.userId === userId);
  }

  /**
   * حذف هشدار
   */
  deleteAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      this.alerts.delete(alertId);
      this.emit('alertDeleted', alert);
      console.log(`🗑️ Alert deleted: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * غیرفعال کردن هشدار
   */
  deactivateAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'inactive';
      this.alerts.set(alertId, alert);
      this.emit('alertDeactivated', alert);
      console.log(`⏸️ Alert deactivated: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * فعال کردن هشدار
   */
  activateAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'active';
      this.alerts.set(alertId, alert);
      this.emit('alertActivated', alert);
      console.log(`▶️ Alert activated: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * دریافت آمار هشدارها
   */
  getAlertStats() {
    const alerts = Array.from(this.alerts.values());

    return {
      total: alerts.length,
      active: alerts.filter((a) => a.status === 'active').length,
      inactive: alerts.filter((a) => a.status === 'inactive').length,
      triggered: alerts.filter((a) => a.triggerCount > 0).length,
      totalTriggers: alerts.reduce((sum, a) => sum + a.triggerCount, 0),
    };
  }

  /**
   * شبیه‌سازی دریافت قیمت فعلی
   */
  async getCurrentPrice(tokenAddress) {
    // در پیاده‌سازی واقعی، این باید از API قیمت‌ها دریافت شود
    return Math.random() * 1000 + 1000;
  }

  /**
   * شبیه‌سازی دریافت حجم فعلی
   */
  async getCurrentVolume(tokenAddress) {
    // در پیاده‌سازی واقعی، این باید از API حجم دریافت شود
    return Math.random() * 1000000 + 500000;
  }

  /**
   * شبیه‌سازی دریافت شاخص تکنیکال
   */
  async getTechnicalIndicator(tokenAddress, indicator) {
    // در پیاده‌سازی واقعی، این باید از API تحلیل تکنیکال دریافت شود
    switch (indicator) {
      case 'RSI':
        return Math.random() * 100;
      case 'MACD':
        return Math.random() * 10 - 5;
      case 'Bollinger':
        return Math.random() * 100;
      default:
        return Math.random() * 100;
    }
  }

  /**
   * تولید ID هشدار
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * توقف مدیر نوتیفیکیشن
   */
  stop() {
    this.isProcessing = false;
    console.log('🛑 Notification Manager stopped');
  }
}

module.exports = NotificationManager;
