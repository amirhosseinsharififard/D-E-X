/**
 * User Session Manager
 * مدیریت جلسات کاربران
 */

const EventEmitter = require('events');

class UserSessionManager extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes

    this.startCleanupTimer();
  }

  /**
   * ایجاد جلسه جدید
   */
  createSession(userId, userInfo = {}) {
    const session = {
      userId,
      userInfo: {
        id: userInfo.id || userId,
        username: userInfo.username || null,
        first_name: userInfo.first_name || null,
        last_name: userInfo.last_name || null,
        language_code: userInfo.language_code || 'fa',
      },
      preferences: {
        language: 'fa',
        currency: 'USD',
        timezone: 'Asia/Tehran',
        notifications: {
          price_alerts: true,
          trade_notifications: true,
          news_updates: false,
          social_updates: true,
        },
        trading: {
          default_slippage: 0.5,
          max_trade_amount: 1000,
          auto_confirm: false,
        },
      },
      state: 'idle',
      stateData: {},
      lastActivity: Date.now(),
      createdAt: Date.now(),
      isActive: true,
    };

    this.sessions.set(userId, session);
    this.emit('sessionCreated', session);

    console.log(`✅ Session created for user ${userId}`);
    return session;
  }

  /**
   * دریافت جلسه کاربر
   */
  getSession(userId) {
    const session = this.sessions.get(userId);
    if (session) {
      session.lastActivity = Date.now();
      return session;
    }
    return null;
  }

  /**
   * دریافت یا ایجاد جلسه
   */
  getOrCreateSession(userId, userInfo = {}) {
    let session = this.getSession(userId);
    if (!session) {
      session = this.createSession(userId, userInfo);
    }
    return session;
  }

  /**
   * به‌روزرسانی جلسه
   */
  updateSession(userId, updates) {
    const session = this.getSession(userId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = Date.now();
      this.sessions.set(userId, session);
      this.emit('sessionUpdated', session);
      return session;
    }
    return null;
  }

  /**
   * به‌روزرسانی state
   */
  updateState(userId, state, stateData = {}) {
    return this.updateSession(userId, {
      state,
      stateData,
    });
  }

  /**
   * به‌روزرسانی preferences
   */
  updatePreferences(userId, preferences) {
    const session = this.getSession(userId);
    if (session) {
      session.preferences = { ...session.preferences, ...preferences };
      session.lastActivity = Date.now();
      this.sessions.set(userId, session);
      this.emit('preferencesUpdated', session);
      return session;
    }
    return null;
  }

  /**
   * دریافت تنظیمات کاربر
   */
  getPreferences(userId) {
    const session = this.getSession(userId);
    return session ? session.preferences : null;
  }

  /**
   * دریافت state فعلی
   */
  getState(userId) {
    const session = this.getSession(userId);
    return session ? { state: session.state, data: session.stateData } : null;
  }

  /**
   * پاک کردن جلسه
   */
  deleteSession(userId) {
    const session = this.sessions.get(userId);
    if (session) {
      this.sessions.delete(userId);
      this.emit('sessionDeleted', session);
      console.log(`🗑️ Session deleted for user ${userId}`);
      return true;
    }
    return false;
  }

  /**
   * دریافت تمام جلسات فعال
   */
  getActiveSessions() {
    const now = Date.now();
    return Array.from(this.sessions.values()).filter(
      (session) => session.isActive && now - session.lastActivity < this.sessionTimeout
    );
  }

  /**
   * دریافت آمار جلسات
   */
  getSessionStats() {
    const now = Date.now();
    const sessions = Array.from(this.sessions.values());

    return {
      total: sessions.length,
      active: sessions.filter((s) => s.isActive && now - s.lastActivity < this.sessionTimeout)
        .length,
      inactive: sessions.filter((s) => !s.isActive || now - s.lastActivity >= this.sessionTimeout)
        .length,
      averageSessionTime: this.calculateAverageSessionTime(sessions),
    };
  }

  /**
   * محاسبه میانگین زمان جلسه
   */
  calculateAverageSessionTime(sessions) {
    if (sessions.length === 0) return 0;

    const totalTime = sessions.reduce((sum, session) => {
      return sum + (Date.now() - session.createdAt);
    }, 0);

    return Math.round(totalTime / sessions.length / 1000 / 60); // minutes
  }

  /**
   * شروع تایمر پاکسازی
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, this.cleanupInterval);
  }

  /**
   * پاکسازی جلسات غیرفعال
   */
  cleanupInactiveSessions() {
    const now = Date.now();
    const inactiveSessions = [];

    for (const [userId, session] of this.sessions) {
      if (!session.isActive || now - session.lastActivity >= this.sessionTimeout) {
        inactiveSessions.push(userId);
      }
    }

    inactiveSessions.forEach((userId) => {
      this.deleteSession(userId);
    });

    if (inactiveSessions.length > 0) {
      console.log(`🧹 Cleaned up ${inactiveSessions.length} inactive sessions`);
    }
  }

  /**
   * ذخیره جلسات در فایل
   */
  async saveSessionsToFile(filePath) {
    const fs = require('fs').promises;
    const sessionsData = Array.from(this.sessions.entries());

    try {
      await fs.writeFile(filePath, JSON.stringify(sessionsData, null, 2));
      console.log(`💾 Sessions saved to ${filePath}`);
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  /**
   * بارگذاری جلسات از فایل
   */
  async loadSessionsFromFile(filePath) {
    const fs = require('fs').promises;

    try {
      const data = await fs.readFile(filePath, 'utf8');
      const sessionsData = JSON.parse(data);

      this.sessions.clear();
      sessionsData.forEach(([userId, session]) => {
        this.sessions.set(userId, session);
      });

      console.log(`📂 Loaded ${sessionsData.length} sessions from ${filePath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading sessions:', error);
      }
    }
  }

  /**
   * دریافت کاربران بر اساس معیار
   */
  getUsersByCriteria(criteria) {
    const sessions = Array.from(this.sessions.values());

    return sessions.filter((session) => {
      switch (criteria.type) {
        case 'language':
          return session.preferences.language === criteria.value;
        case 'currency':
          return session.preferences.currency === criteria.value;
        case 'timezone':
          return session.preferences.timezone === criteria.value;
        case 'active':
          const now = Date.now();
          return session.isActive && now - session.lastActivity < this.sessionTimeout;
        default:
          return true;
      }
    });
  }

  /**
   * ارسال پیام به گروه کاربران
   */
  async broadcastToUsers(userIds, message, bot) {
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await bot.sendMessage(userId, message);
        results.push({ userId, success: true, result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * دریافت لیست کاربران برای نوتیفیکیشن
   */
  getUsersForNotification(type) {
    const sessions = Array.from(this.sessions.values());

    return sessions
      .filter((session) => {
        const notifications = session.preferences.notifications;

        switch (type) {
          case 'price_alert':
            return notifications.price_alerts;
          case 'trade_notification':
            return notifications.trade_notifications;
          case 'news_update':
            return notifications.news_updates;
          case 'social_update':
            return notifications.social_updates;
          default:
            return true;
        }
      })
      .map((session) => session.userId);
  }

  /**
   * توقف مدیر جلسات
   */
  stop() {
    this.cleanupInactiveSessions();
    console.log('🛑 User Session Manager stopped');
  }
}

module.exports = UserSessionManager;
