# Advanced Telegram Bot for DEX Trading

ربات پیشرفته تلگرام برای معاملات DEX با قابلیت‌های هوش مصنوعی و تحلیل پیشرفته

## ویژگی‌های کلیدی

### 🤖 هوش مصنوعی پیشرفته

- تحلیل پیام‌های کاربر با NLP
- پیش‌بینی قیمت با مدل‌های یادگیری ماشین
- تحلیل احساسات بازار
- توصیه‌های شخصی‌سازی شده

### 🔒 امنیت چندلایه

- رمزنگاری پیشرفته
- احراز هویت چندگانه
- محدودیت نرخ
- مدیریت جلسات امن

### 🌍 چندزبانه

- پشتیبانی از 15+ زبان
- تشخیص خودکار زبان
- ترجمه هوشمند
- محلی‌سازی کامل

### 📊 معاملات هوشمند

- معاملات خودکار
- DCA (Dollar Cost Averaging)
- Grid Trading
- مدیریت ریسک پیشرفته

### 🔔 سیستم هشدار پیشرفته

- هشدارهای قیمت
- هشدارهای حجم
- هشدارهای تکنیکال
- نوتیفیکیشن‌های هوشمند

### 👥 ویژگی‌های اجتماعی

- دنبال کردن تریدرها
- کپی تریدینگ
- جدول رتبه‌بندی
- اشتراک‌گذاری معاملات

## نصب و راه‌اندازی

### پیش‌نیازها

- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB (اختیاری)
- Redis (اختیاری)

### نصب

```bash
# کلون کردن پروژه
git clone https://github.com/your-username/advanced-telegram-bot.git
cd advanced-telegram-bot

# نصب وابستگی‌ها
npm install

# کپی کردن فایل تنظیمات
cp .env.example .env

# ویرایش تنظیمات
nano .env
```

### تنظیمات

فایل `.env` را ویرایش کنید و متغیرهای زیر را تنظیم کنید:

```env
# توکن ربات تلگرام
TELEGRAM_BOT_TOKEN=your_bot_token_here

# تنظیمات امنیت
ENCRYPTION_MASTER_KEY=your-secure-key

# تنظیمات AI (اختیاری)
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
```

### اجرا

```bash
# حالت توسعه
npm run dev

# حالت تولید
npm start

# با PM2
npm run deploy
```

## دستورات اصلی

### دستورات پایه

- `/start` - شروع کار با ربات
- `/help` - راهنمای کامل
- `/status` - وضعیت سیستم
- `/settings` - تنظیمات کاربر

### دستورات معاملاتی

- `/balance` - نمایش موجودی
- `/portfolio` - نمایش پرتفوی
- `/buy [توکن] [مقدار]` - خرید
- `/sell [توکن] [مقدار]` - فروش
- `/positions` - موقعیت‌های باز

### دستورات تحلیل

- `/price [توکن]` - قیمت فعلی
- `/analyze [توکن]` - تحلیل کامل
- `/predict [توکن]` - پیش‌بینی قیمت
- `/recommend` - توصیه‌های شخصی

### دستورات اجتماعی

- `/follow [کاربر]` - دنبال کردن
- `/leaderboard` - جدول رتبه‌بندی
- `/copy [کاربر] [درصد]` - کپی تریدینگ

## ساختار پروژه

```
src/telegram-bot/
├── src/
│   ├── core/                 # هسته اصلی
│   │   ├── TelegramBotManager.js
│   │   ├── UserSessionManager.js
│   │   └── NotificationManager.js
│   ├── features/             # ویژگی‌های اضافی
│   ├── utils/                # ابزارهای کمکی
│   ├── ai/                   # هوش مصنوعی
│   ├── security/             # امنیت
│   └── analytics/            # تحلیل و آمار
├── config/                   # تنظیمات
├── tests/                    # تست‌ها
├── docs/                     # مستندات
└── assets/                   # فایل‌های استاتیک
```

## API

### Webhook Endpoints

- `POST /api/telegram/webhook` - دریافت به‌روزرسانی‌های تلگرام
- `GET /api/telegram/status` - وضعیت ربات
- `POST /api/telegram/broadcast` - ارسال پیام گروهی

### REST API

- `GET /api/users/:id` - اطلاعات کاربر
- `POST /api/alerts` - ایجاد هشدار
- `GET /api/analytics` - آمار و تحلیل

## تست

```bash
# اجرای تست‌ها
npm test

# تست با پوشش
npm run test:coverage

# تست در حالت watch
npm run test:watch
```

## توسعه

### کد نویسی

```bash
# بررسی کد
npm run lint

# اصلاح خودکار
npm run lint:fix

# فرمت کردن
npm run format
```

### Git Hooks

پروژه از Husky و lint-staged استفاده می‌کند:

- بررسی کد قبل از commit
- فرمت خودکار
- اجرای تست‌ها

## مستندات

- [راهنمای کامل](docs/COMPLETE_GUIDE.md)
- [API Documentation](docs/API.md)
- [Security Guide](docs/SECURITY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## مشارکت

1. Fork کنید
2. Branch جدید بسازید (`git checkout -b feature/amazing-feature`)
3. Commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request بسازید

## لایسنس

این پروژه تحت لایسنس MIT منتشر شده است. برای جزئیات بیشتر فایل [LICENSE](LICENSE) را مطالعه کنید.

## پشتیبانی

- 📧 ایمیل: support@dexbot.com
- 💬 تلگرام: @dexbot_support
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/advanced-telegram-bot/issues)

## تغییرات

### نسخه 2.0.0

- ✅ هوش مصنوعی پیشرفته
- ✅ سیستم چندزبانه
- ✅ معاملات خودکار
- ✅ ویژگی‌های اجتماعی
- ✅ امنیت چندلایه

### نسخه 1.0.0

- ✅ ربات پایه تلگرام
- ✅ معاملات ساده
- ✅ هشدارهای قیمت
- ✅ مدیریت پرتفوی

---

**توسعه داده شده با ❤️ توسط تیم DEX Bot**
