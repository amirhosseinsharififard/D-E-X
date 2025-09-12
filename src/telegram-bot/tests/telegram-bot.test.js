const TelegramBotManager = require('../src/core/TelegramBotManager');
const UserSessionManager = require('../src/core/UserSessionManager');
const NotificationManager = require('../src/core/NotificationManager');

describe('Advanced Telegram Bot', () => {
  let botManager;
  let sessionManager;
  let notificationManager;

  beforeEach(() => {
    const config = {
      bot: {
        token: 'test_token',
        polling: { enabled: false },
        webhook: { url: null },
      },
    };

    sessionManager = new UserSessionManager();
    botManager = new TelegramBotManager(config);
    notificationManager = new NotificationManager(botManager.bot);
  });

  describe('TelegramBotManager', () => {
    test('should initialize correctly', () => {
      expect(botManager).toBeDefined();
      expect(botManager.config).toBeDefined();
    });

    test('should handle start command', async () => {
      const mockMsg = {
        from: { id: 123 },
        chat: { id: 123 },
        text: '/start',
      };

      await expect(botManager.handleStartCommand(mockMsg, [], {})).resolves.not.toThrow();
    });

    test('should handle help command', async () => {
      const mockMsg = {
        from: { id: 123 },
        chat: { id: 123 },
        text: '/help',
      };

      await expect(botManager.handleHelpCommand(mockMsg, [], {})).resolves.not.toThrow();
    });
  });

  describe('UserSessionManager', () => {
    test('should create session', () => {
      const session = sessionManager.createSession(123, { username: 'test' });
      expect(session).toBeDefined();
      expect(session.userId).toBe(123);
    });

    test('should get session', () => {
      sessionManager.createSession(123);
      const session = sessionManager.getSession(123);
      expect(session).toBeDefined();
    });

    test('should update session', () => {
      sessionManager.createSession(123);
      const updated = sessionManager.updateSession(123, { state: 'active' });
      expect(updated.state).toBe('active');
    });
  });

  describe('NotificationManager', () => {
    test('should create price alert', async () => {
      const alert = await notificationManager.setPriceAlert(123, 'ETH', 2000, 'above');
      expect(alert).toBeDefined();
      expect(alert.userId).toBe(123);
    });

    test('should get user alerts', async () => {
      await notificationManager.setPriceAlert(123, 'ETH', 2000, 'above');
      const alerts = notificationManager.getUserAlerts(123);
      expect(alerts).toHaveLength(1);
    });

    test('should delete alert', async () => {
      const alert = await notificationManager.setPriceAlert(123, 'ETH', 2000, 'above');
      const deleted = notificationManager.deleteAlert(alert.id);
      expect(deleted).toBe(true);
    });
  });
});
