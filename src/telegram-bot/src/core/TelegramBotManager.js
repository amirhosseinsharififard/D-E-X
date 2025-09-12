/**
 * Advanced Telegram Bot Manager
 * مدیریت پیشرفته ربات تلگرام برای DEX Trading Bot
 */

const TelegramBot = require('node-telegram-bot-api');
const EventEmitter = require('events');

class TelegramBotManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.bot = new TelegramBot(config.bot.token, {
      polling: config.bot.polling.enabled,
      webHook: config.bot.webhook.url
        ? {
            url: config.bot.webhook.url,
            port: config.bot.webhook.port,
          }
        : false,
    });

    this.userSessions = new Map();
    this.commandHandlers = new Map();
    this.callbackHandlers = new Map();
    this.isInitialized = false;

    this.initialize();
  }

  /**
   * راه‌اندازی اولیه ربات
   */
  async initialize() {
    try {
      await this.setupEventHandlers();
      await this.setupCommands();
      await this.setupMenus();
      this.isInitialized = true;
      this.emit('initialized');
      console.log('✅ Telegram Bot Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Telegram Bot Manager:', error);
      this.emit('error', error);
    }
  }

  /**
   * راه‌اندازی event handlers
   */
  async setupEventHandlers() {
    // مدیریت پیام‌ها
    this.bot.on('message', async (msg) => {
      try {
        await this.handleMessage(msg);
      } catch (error) {
        console.error('Error handling message:', error);
        await this.sendError(msg.chat.id, 'خطا در پردازش پیام');
      }
    });

    // مدیریت callback queries
    this.bot.on('callback_query', async (callbackQuery) => {
      try {
        await this.handleCallbackQuery(callbackQuery);
      } catch (error) {
        console.error('Error handling callback query:', error);
        await this.answerCallbackQuery(callbackQuery.id, 'خطا در پردازش درخواست');
      }
    });

    // مدیریت inline queries
    this.bot.on('inline_query', async (inlineQuery) => {
      try {
        await this.handleInlineQuery(inlineQuery);
      } catch (error) {
        console.error('Error handling inline query:', error);
      }
    });

    // مدیریت خطاها
    this.bot.on('error', (error) => {
      console.error('Telegram Bot Error:', error);
      this.emit('error', error);
    });

    this.bot.on('polling_error', (error) => {
      console.error('Telegram Bot Polling Error:', error);
      this.emit('polling_error', error);
    });
  }

  /**
   * راه‌اندازی دستورات
   */
  async setupCommands() {
    // دستورات پایه
    this.registerCommand('start', this.handleStartCommand.bind(this));
    this.registerCommand('help', this.handleHelpCommand.bind(this));
    this.registerCommand('status', this.handleStatusCommand.bind(this));
    this.registerCommand('settings', this.handleSettingsCommand.bind(this));

    // دستورات معاملاتی
    this.registerCommand('balance', this.handleBalanceCommand.bind(this));
    this.registerCommand('portfolio', this.handlePortfolioCommand.bind(this));
    this.registerCommand('buy', this.handleBuyCommand.bind(this));
    this.registerCommand('sell', this.handleSellCommand.bind(this));
    this.registerCommand('positions', this.handlePositionsCommand.bind(this));
    this.registerCommand('history', this.handleHistoryCommand.bind(this));

    // دستورات مانیتورینگ
    this.registerCommand('price', this.handlePriceCommand.bind(this));
    this.registerCommand('alerts', this.handleAlertsCommand.bind(this));
    this.registerCommand('monitor', this.handleMonitorCommand.bind(this));

    // دستورات AI
    this.registerCommand('analyze', this.handleAnalyzeCommand.bind(this));
    this.registerCommand('predict', this.handlePredictCommand.bind(this));
    this.registerCommand('recommend', this.handleRecommendCommand.bind(this));

    // دستورات اجتماعی
    this.registerCommand('follow', this.handleFollowCommand.bind(this));
    this.registerCommand('leaderboard', this.handleLeaderboardCommand.bind(this));
    this.registerCommand('copy', this.handleCopyCommand.bind(this));
  }

  /**
   * ثبت دستور جدید
   */
  registerCommand(command, handler) {
    this.commandHandlers.set(command, handler);
  }

  /**
   * مدیریت پیام‌ها
   */
  async handleMessage(msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;

    // ایجاد یا دریافت جلسه کاربر
    const session = await this.getUserSession(userId);
    session.lastActivity = Date.now();

    // پردازش دستورات
    if (text && text.startsWith('/')) {
      const command = text.split(' ')[0].substring(1);
      const args = text.split(' ').slice(1);

      if (this.commandHandlers.has(command)) {
        await this.commandHandlers.get(command)(msg, args, session);
      } else {
        await this.sendMessage(chatId, '❌ دستور نامعتبر است. از /help برای راهنما استفاده کنید.');
      }
    } else if (text) {
      // پردازش پیام‌های متنی عادی
      await this.handleTextMessage(msg, session);
    }
  }

  /**
   * مدیریت callback queries
   */
  async handleCallbackQuery(callbackQuery) {
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id;
    const chatId = callbackQuery.message.chat.id;

    // پاسخ به callback query
    await this.bot.answerCallbackQuery(callbackQuery.id);

    // پردازش callback data
    if (this.callbackHandlers.has(data)) {
      await this.callbackHandlers.get(data)(callbackQuery);
    } else {
      await this.sendMessage(chatId, '❌ عملیات نامعتبر است.');
    }
  }

  /**
   * مدیریت inline queries
   */
  async handleInlineQuery(inlineQuery) {
    const query = inlineQuery.query;
    const results = [];

    if (query.length > 0) {
      // جستجوی توکن‌ها
      const tokens = await this.searchTokens(query);
      tokens.forEach((token) => {
        results.push({
          type: 'article',
          id: token.symbol,
          title: `${token.symbol} - ${token.name}`,
          description: `قیمت: $${token.price} | تغییر: ${token.change24h}%`,
          input_message_content: {
            message_text: `📊 اطلاعات ${token.symbol}\n💰 قیمت: $${token.price}\n📈 تغییر 24h: ${token.change24h}%\n📊 حجم: $${token.volume}`,
          },
        });
      });
    }

    await this.bot.answerInlineQuery(inlineQuery.id, results);
  }

  /**
   * ارسال پیام
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * ارسال پیام با منو
   */
  async sendMessageWithMenu(chatId, text, menu) {
    return await this.sendMessage(chatId, text, { reply_markup: menu });
  }

  /**
   * ویرایش پیام
   */
  async editMessage(chatId, messageId, text, options = {}) {
    try {
      return await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options,
      });
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  /**
   * ارسال عکس
   */
  async sendPhoto(chatId, photo, caption = '', options = {}) {
    try {
      return await this.bot.sendPhoto(chatId, photo, {
        caption,
        parse_mode: 'HTML',
        ...options,
      });
    } catch (error) {
      console.error('Error sending photo:', error);
      throw error;
    }
  }

  /**
   * دریافت جلسه کاربر
   */
  async getUserSession(userId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        userId,
        language: 'fa',
        preferences: {},
        lastActivity: Date.now(),
        state: 'idle',
        data: {},
      });
    }
    return this.userSessions.get(userId);
  }

  /**
   * به‌روزرسانی جلسه کاربر
   */
  async updateUserSession(userId, updates) {
    const session = await this.getUserSession(userId);
    Object.assign(session, updates);
    this.userSessions.set(userId, session);
  }

  /**
   * دستورات پایه
   */
  async handleStartCommand(msg, args, session) {
    const chatId = msg.chat.id;
    const welcomeText = `
🤖 <b>خوش آمدید به DEX Trading Bot</b>

این ربات پیشرفته برای معاملات ارزهای دیجیتال طراحی شده است.

<b>قابلیت‌های اصلی:</b>
💰 مدیریت پرتفوی
📊 تحلیل بازار
🤖 معاملات هوشمند
🔔 هشدارهای قیمت
👥 ویژگی‌های اجتماعی

برای شروع از منوی زیر استفاده کنید:
        `;

    await this.sendMessageWithMenu(chatId, welcomeText, this.getMainMenu());
  }

  async handleHelpCommand(msg, args, session) {
    const chatId = msg.chat.id;
    const helpText = `
📖 <b>راهنمای کامل ربات</b>

<b>دستورات پایه:</b>
/start - شروع کار با ربات
/help - نمایش این راهنما
/status - وضعیت ربات
/settings - تنظیمات کاربر

<b>دستورات معاملاتی:</b>
/balance - نمایش موجودی
/portfolio - نمایش پرتفوی
/buy [توکن] [مقدار] - خرید
/sell [توکن] [مقدار] - فروش
/positions - موقعیت‌های باز
/history - تاریخچه معاملات

<b>دستورات تحلیل:</b>
/price [توکن] - قیمت فعلی
/analyze [توکن] - تحلیل کامل
/predict [توکن] - پیش‌بینی قیمت
/recommend - توصیه‌های شخصی

<b>دستورات اجتماعی:</b>
/follow [کاربر] - دنبال کردن
/leaderboard - جدول رتبه‌بندی
/copy [کاربر] - کپی تریدینگ

برای اطلاعات بیشتر از دکمه‌های منو استفاده کنید.
        `;

    await this.sendMessage(chatId, helpText);
  }

  async handleStatusCommand(msg, args, session) {
    const chatId = msg.chat.id;
    const statusText = `
📊 <b>وضعیت سیستم</b>

🤖 ربات: فعال
🌐 اتصال: برقرار
📈 بازار: باز
⏰ زمان: ${new Date().toLocaleString('fa-IR')}

<b>آمار کلی:</b>
👥 کاربران فعال: ${this.userSessions.size}
💬 پیام‌های پردازش شده: ${this.getProcessedMessagesCount()}
🔄 وضعیت: عادی
        `;

    await this.sendMessage(chatId, statusText);
  }

  async handleSettingsCommand(msg, args, session) {
    const chatId = msg.chat.id;
    const settingsText = `
⚙️ <b>تنظیمات کاربر</b>

🌍 زبان: ${session.language === 'fa' ? 'فارسی' : 'English'}
🔔 نوتیفیکیشن: فعال
📊 نمایش قیمت: USD
⏰ منطقه زمانی: Asia/Tehran

برای تغییر تنظیمات از دکمه‌های زیر استفاده کنید:
        `;

    await this.sendMessageWithMenu(chatId, settingsText, this.getSettingsMenu());
  }

  /**
   * دستورات معاملاتی
   */
  async handleBalanceCommand(msg, args, session) {
    const chatId = msg.chat.id;

    // شبیه‌سازی دریافت موجودی
    const balance = {
      ETH: '2.5',
      USDC: '1000',
      BTC: '0.1',
      totalUSD: '8500',
    };

    const balanceText = `
💰 <b>موجودی کیف پول</b>

<b>ارزهای اصلی:</b>
Ξ ETH: ${balance.ETH}
💵 USDC: ${balance.USDC}
₿ BTC: ${balance.BTC}

<b>کل ارزش (USD):</b> $${balance.totalUSD}

📊 برای مشاهده جزئیات بیشتر از /portfolio استفاده کنید.
        `;

    await this.sendMessage(chatId, balanceText);
  }

  async handlePortfolioCommand(msg, args, session) {
    const chatId = msg.chat.id;

    // شبیه‌سازی پرتفوی
    const portfolio = [
      { symbol: 'ETH', amount: '2.5', value: '5000', change: '+5.2%' },
      { symbol: 'BTC', amount: '0.1', value: '3000', change: '+2.1%' },
      { symbol: 'USDC', amount: '1000', value: '1000', change: '0%' },
    ];

    let portfolioText = `
📊 <b>پرتفوی شما</b>

`;

    portfolio.forEach((asset) => {
      portfolioText += `
${asset.symbol}: ${asset.amount} ($${asset.value}) ${asset.change}
`;
    });

    portfolioText += `
<b>کل ارزش:</b> $9000
<b>تغییر 24h:</b> +3.1%
        `;

    await this.sendMessage(chatId, portfolioText);
  }

  async handleBuyCommand(msg, args, session) {
    const chatId = msg.chat.id;

    if (args.length < 2) {
      await this.sendMessage(chatId, '❌ فرمت صحیح: /buy [توکن] [مقدار]\nمثال: /buy ETH 0.1');
      return;
    }

    const token = args[0].toUpperCase();
    const amount = args[1];

    const buyText = `
🛒 <b>درخواست خرید</b>

📊 توکن: ${token}
💰 مقدار: ${amount}
💵 قیمت تخمینی: $${(parseFloat(amount) * 2000).toFixed(2)}

⚠️ آیا مطمئن هستید؟
        `;

    await this.sendMessageWithMenu(chatId, buyText, this.getConfirmMenu('buy', token, amount));
  }

  async handleSellCommand(msg, args, session) {
    const chatId = msg.chat.id;

    if (args.length < 2) {
      await this.sendMessage(chatId, '❌ فرمت صحیح: /sell [توکن] [مقدار]\nمثال: /sell ETH 0.1');
      return;
    }

    const token = args[0].toUpperCase();
    const amount = args[1];

    const sellText = `
💸 <b>درخواست فروش</b>

📊 توکن: ${token}
💰 مقدار: ${amount}
💵 قیمت تخمینی: $${(parseFloat(amount) * 2000).toFixed(2)}

⚠️ آیا مطمئن هستید؟
        `;

    await this.sendMessageWithMenu(chatId, sellText, this.getConfirmMenu('sell', token, amount));
  }

  /**
   * دستورات تحلیل
   */
  async handlePriceCommand(msg, args, session) {
    const chatId = msg.chat.id;

    if (args.length < 1) {
      await this.sendMessage(chatId, '❌ فرمت صحیح: /price [توکن]\nمثال: /price ETH');
      return;
    }

    const token = args[0].toUpperCase();

    // شبیه‌سازی قیمت
    const price = {
      current: '2000.50',
      change24h: '+5.2%',
      volume: '1.2B',
      marketCap: '240B',
    };

    const priceText = `
📈 <b>قیمت ${token}</b>

💰 قیمت فعلی: $${price.current}
📊 تغییر 24h: ${price.change24h}
📊 حجم: $${price.volume}
🏆 مارکت کپ: $${price.marketCap}

⏰ آخرین به‌روزرسانی: ${new Date().toLocaleString('fa-IR')}
        `;

    await this.sendMessage(chatId, priceText);
  }

  async handleAnalyzeCommand(msg, args, session) {
    const chatId = msg.chat.id;

    if (args.length < 1) {
      await this.sendMessage(chatId, '❌ فرمت صحیح: /analyze [توکن]\nمثال: /analyze ETH');
      return;
    }

    const token = args[0].toUpperCase();

    const analysisText = `
🧠 <b>تحلیل هوشمند ${token}</b>

<b>تحلیل تکنیکال:</b>
📊 RSI: 65 (خنثی)
📈 MACD: صعودی
📉 باندهای بولینگر: در محدوده طبیعی

<b>تحلیل احساسات:</b>
😊 احساسات: مثبت (75%)
📰 اخبار: خنثی
🐋 فعالیت نهنگ‌ها: متوسط

<b>توصیه:</b>
🟢 سیگنال خرید قوی
💡 هدف قیمت: $2200
⚠️ حد ضرر: $1800
        `;

    await this.sendMessage(chatId, analysisText);
  }

  async handlePredictCommand(msg, args, session) {
    const chatId = msg.chat.id;

    if (args.length < 1) {
      await this.sendMessage(chatId, '❌ فرمت صحیح: /predict [توکن]\nمثال: /predict ETH');
      return;
    }

    const token = args[0].toUpperCase();

    const predictionText = `
🔮 <b>پیش‌بینی ${token}</b>

<b>پیش‌بینی 24 ساعت:</b>
📈 احتمال صعود: 70%
📉 احتمال نزول: 30%
💰 قیمت هدف: $2100-2200

<b>پیش‌بینی 7 روز:</b>
📈 احتمال صعود: 65%
📉 احتمال نزول: 35%
💰 قیمت هدف: $2300-2500

<b>عوامل تأثیرگذار:</b>
✅ تقاضای بالا
⚠️ نوسانات بازار
📊 حجم معاملات مناسب

<i>توجه: پیش‌بینی‌ها بر اساس تحلیل‌های الگوریتمی است و تضمینی نیست.</i>
        `;

    await this.sendMessage(chatId, predictionText);
  }

  async handleRecommendCommand(msg, args, session) {
    const chatId = msg.chat.id;

    const recommendationsText = `
💡 <b>توصیه‌های شخصی‌سازی شده</b>

<b>بر اساس پرتفوی شما:</b>

🥇 <b>ETH</b> - خرید قوی
💰 مقدار پیشنهادی: 0.2 ETH
📈 پتانسیل سود: +15%
⏰ زمان نگهداری: 1-3 ماه

🥈 <b>BTC</b> - نگهداری
💰 وضعیت: مناسب
📊 استراتژی: DCA
⏰ زمان نگهداری: 6+ ماه

🥉 <b>USDC</b> - فروش جزئی
💰 مقدار: 200 USDC
🔄 جایگزین: ETH یا BTC

<b>ریسک کلی:</b> متوسط
<b>توصیه:</b> متنوع‌سازی بیشتر
        `;

    await this.sendMessage(chatId, recommendationsText);
  }

  /**
   * دستورات اجتماعی
   */
  async handleFollowCommand(msg, args, session) {
    const chatId = msg.chat.id;

    if (args.length < 1) {
      await this.sendMessage(
        chatId,
        '❌ فرمت صحیح: /follow [نام کاربری]\nمثال: /follow @trader123'
      );
      return;
    }

    const username = args[0];

    const followText = `
👥 <b>دنبال کردن تریدر</b>

✅ با موفقیت ${username} را دنبال کردید!

<b>قابلیت‌های فعال:</b>
📊 مشاهده معاملات
📈 کپی تریدینگ
🔔 نوتیفیکیشن معاملات

برای مدیریت از /settings استفاده کنید.
        `;

    await this.sendMessage(chatId, followText);
  }

  async handleLeaderboardCommand(msg, args, session) {
    const chatId = msg.chat.id;

    const leaderboardText = `
🏆 <b>جدول رتبه‌بندی تریدرها</b>

🥇 @trader_pro - سود: +45.2%
🥈 @crypto_master - سود: +38.7%
🥉 @defi_king - سود: +32.1%
4️⃣ @hodl_forever - سود: +28.9%
5️⃣ @swing_trader - سود: +25.4%

<b>آمار شما:</b>
📊 رتبه: 15
📈 سود: +12.3%
💼 تعداد معاملات: 45

برای بهبود رتبه، استراتژی‌های بهتری انتخاب کنید!
        `;

    await this.sendMessage(chatId, leaderboardText);
  }

  async handleCopyCommand(msg, args, session) {
    const chatId = msg.chat.id;

    if (args.length < 1) {
      await this.sendMessage(
        chatId,
        '❌ فرمت صحیح: /copy [نام کاربری] [درصد]\nمثال: /copy @trader123 50'
      );
      return;
    }

    const username = args[0];
    const percentage = args[1] || '100';

    const copyText = `
🔄 <b>کپی تریدینگ</b>

✅ کپی تریدینگ از ${username} فعال شد!

<b>تنظیمات:</b>
👤 تریدر: ${username}
📊 درصد کپی: ${percentage}%
💰 حداکثر مبلغ: $1000
⚠️ حد ضرر: 10%

<b>وضعیت:</b> فعال
📊 معاملات کپی شده: 0

برای مدیریت از /settings استفاده کنید.
        `;

    await this.sendMessage(chatId, copyText);
  }

  /**
   * منوها
   */
  getMainMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💰 موجودی', callback_data: 'balance' },
            { text: '📊 پرتفوی', callback_data: 'portfolio' },
          ],
          [
            { text: '🛒 خرید', callback_data: 'buy' },
            { text: '💸 فروش', callback_data: 'sell' },
          ],
          [
            { text: '📈 تحلیل', callback_data: 'analysis' },
            { text: '🔔 هشدارها', callback_data: 'alerts' },
          ],
          [
            { text: '👥 اجتماعی', callback_data: 'social' },
            { text: '⚙️ تنظیمات', callback_data: 'settings' },
          ],
        ],
      },
    };
  }

  getSettingsMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🌍 زبان', callback_data: 'settings_language' },
            { text: '🔔 نوتیفیکیشن', callback_data: 'settings_notifications' },
          ],
          [
            { text: '💰 ارز نمایش', callback_data: 'settings_currency' },
            { text: '⏰ منطقه زمانی', callback_data: 'settings_timezone' },
          ],
          [{ text: '🔙 بازگشت', callback_data: 'main_menu' }],
        ],
      },
    };
  }

  getConfirmMenu(action, token, amount) {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ تأیید', callback_data: `confirm_${action}_${token}_${amount}` },
            { text: '❌ لغو', callback_data: 'cancel' },
          ],
        ],
      },
    };
  }

  /**
   * مدیریت پیام‌های متنی
   */
  async handleTextMessage(msg, session) {
    const chatId = msg.chat.id;
    const text = msg.text;

    // پردازش پیام‌های متنی بر اساس state کاربر
    switch (session.state) {
      case 'waiting_for_token':
        await this.handleTokenInput(msg, session);
        break;
      case 'waiting_for_amount':
        await this.handleAmountInput(msg, session);
        break;
      default:
        await this.sendMessage(chatId, 'برای استفاده از ربات، از دستورات یا منو استفاده کنید.');
    }
  }

  /**
   * جستجوی توکن‌ها
   */
  async searchTokens(query) {
    // شبیه‌سازی جستجوی توکن‌ها
    const tokens = [
      { symbol: 'ETH', name: 'Ethereum', price: '2000.50', change24h: '+5.2%', volume: '1.2B' },
      { symbol: 'BTC', name: 'Bitcoin', price: '30000.00', change24h: '+2.1%', volume: '2.1B' },
      { symbol: 'USDC', name: 'USD Coin', price: '1.00', change24h: '0%', volume: '500M' },
    ];

    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(query.toLowerCase()) ||
        token.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * دریافت تعداد پیام‌های پردازش شده
   */
  getProcessedMessagesCount() {
    return Math.floor(Math.random() * 10000) + 5000;
  }

  /**
   * ارسال پیام خطا
   */
  async sendError(chatId, message) {
    await this.sendMessage(chatId, `❌ ${message}`);
  }

  /**
   * پاسخ به callback query
   */
  async answerCallbackQuery(callbackQueryId, text = '') {
    try {
      await this.bot.answerCallbackQuery(callbackQueryId, { text });
    } catch (error) {
      console.error('Error answering callback query:', error);
    }
  }

  /**
   * توقف ربات
   */
  async stop() {
    try {
      if (this.bot) {
        await this.bot.stopPolling();
      }
      this.isInitialized = false;
      console.log('🛑 Telegram Bot Manager stopped');
    } catch (error) {
      console.error('Error stopping bot:', error);
    }
  }
}

module.exports = TelegramBotManager;
