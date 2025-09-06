# ربات معاملاتی DEX با قابلیت معاملات آتی

## 📋 توضیحات پروژه

این پروژه یک ربات معاملاتی پیشرفته برای صرافی‌های غیرمتمرکز (DEX) است که قابلیت‌های زیر را ارائه می‌دهد:

- **معاملات خودکار**: خرید و فروش توکن‌ها در صرافی‌های غیرمتمرکز
- **معاملات آتی**: باز کردن و بستن پوزیشن‌های آتی با اهرم
- **نظارت Real-time**: نظارت بر تراکنش‌ها و بلاک‌های جدید
- **مدیریت کیف پول**: مدیریت موجودی و تایید توکن‌ها
- **پشتیبانی از چندین شبکه**: Ethereum Mainnet، Sepolia Testnet و Optimism

## 🚀 ویژگی‌های کلیدی

### 🔄 معاملات DEX

- تبدیل ETH به توکن‌های ERC-20
- تبدیل توکن‌ها به ETH
- تبدیل مستقیم بین توکن‌ها
- محاسبه خودکار slippage tolerance
- مدیریت گاز و قیمت‌گذاری

### 📈 معاملات آتی

- باز کردن پوزیشن‌های لانگ و شورت
- تنظیم اهرم دلخواه
- بستن پوزیشن‌ها
- نظارت بر وضعیت پوزیشن‌ها

### 🔍 نظارت و مانیتورینگ

- نظارت بر تراکنش‌های در انتظار
- دریافت اطلاع از بلاک‌های جدید
- نمایش وضعیت کیف پول
- لاگ‌گیری کامل از عملیات

## 🛠️ تکنولوژی‌های استفاده شده

- **Ethers.js v6**: کتابخانه اصلی برای تعامل با بلاک‌چین
- **Hardhat**: فریمورک توسعه قراردادهای هوشمند
- **TypeScript**: زبان برنامه‌نویسی با پشتیبانی از تایپ
- **WebSocket**: اتصال Real-time به شبکه
- **Node.js**: محیط اجرای JavaScript

## 📦 نصب و راه‌اندازی

### پیش‌نیازها

- Node.js (نسخه 16 یا بالاتر)
- npm یا yarn
- کلید خصوصی کیف پول اتریوم
- URL RPC (Infura، Alchemy یا ارائه‌دهنده دیگر)

### مراحل نصب

1. **کلون کردن پروژه**

```bash
git clone <repository-url>
cd ethers.js
```

2. **نصب وابستگی‌ها**

```bash
npm install
```

3. **پیکربندی متغیرهای محیطی**
   فایل `.env` ایجاد کنید:

```env
SEPOLIA_RPC_URL=your_rpc_url_here
SEPOLIA_PRIVATE_KEY=your_private_key_here
```

4. **پیکربندی ربات**
   فایل `index.js` را ویرایش کنید و مقادیر زیر را تنظیم کنید:

```javascript
const config = {
  rpcUrl: "YOUR_INFURA_OR_ALCHEMY_URL",
  wsUrl: "YOUR_WEBSOCKET_URL",
  privateKey: "YOUR_PRIVATE_KEY",
  // سایر تنظیمات...
};
```

5. **اجرای ربات**

```bash
node index.js
```

## ⚙️ پیکربندی

### تنظیمات اصلی

```javascript
const config = {
  // شبکه
  rpcUrl: "YOUR_RPC_URL",
  wsUrl: "YOUR_WEBSOCKET_URL",

  // کیف پول
  privateKey: "YOUR_PRIVATE_KEY",

  // آدرس‌های قرارداد
  routerAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
  wethAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",

  // تنظیمات گاز
  gasLimit: 300000,
  gasPrice: ethers.utils.parseUnits("30", "gwei"),

  // تنظیمات معامله
  slippageTolerance: 1, // 1%
  tradeAmount: ethers.utils.parseUnits("0.1", "ether"),
};
```

### شبکه‌های پشتیبانی شده

- **Ethereum Mainnet**: شبکه اصلی اتریوم
- **Sepolia Testnet**: شبکه تست اتریوم
- **Optimism**: شبکه Layer 2
- **Hardhat Local**: شبکه محلی برای توسعه

## 📚 نحوه استفاده

### مثال‌های پایه

#### 1. خرید توکن با ETH

```javascript
await tradingBot.buyTokenWithETH(tokenAddress, ethAmount);
```

#### 2. فروش توکن برای ETH

```javascript
await tradingBot.sellTokenForETH(tokenAddress, tokenAmount);
```

#### 3. تبدیل بین توکن‌ها

```javascript
await tradingBot.swapTokens(fromTokenAddress, toTokenAddress, amount);
```

#### 4. باز کردن پوزیشن آتی

```javascript
const result = await tradingBot.openFuturesPosition(
  marketAddress,
  collateralAmount,
  true, // لانگ
  5 // اهرم 5x
);
```

#### 5. بستن پوزیشن آتی

```javascript
await tradingBot.closeFuturesPosition(positionId);
```

### مدیریت موجودی

```javascript
// دریافت موجودی همه توکن‌ها
const balances = await tradingBot.getAllBalances();

// نمایش وضعیت کیف پول
await tradingBot.displayStatus();
```

## 🔒 امنیت

### نکات مهم امنیتی

1. **کلید خصوصی**: هرگز کلید خصوصی را در کد قرار ندهید
2. **متغیرهای محیطی**: از فایل `.env` برای ذخیره اطلاعات حساس استفاده کنید
3. **تست**: همیشه ابتدا در شبکه تست آزمایش کنید
4. **مقدار معامله**: با مقادیر کم شروع کنید
5. **نظارت**: همیشه بر عملکرد ربات نظارت داشته باشید

### بهترین روش‌ها

- استفاده از کیف پول جداگانه برای ربات
- تنظیم محدودیت‌های معاملاتی
- نظارت مداوم بر لاگ‌ها
- پشتیبان‌گیری منظم از تنظیمات

## 🧪 تست

### اجرای تست‌ها

```bash
npm test
```

### تست در شبکه محلی

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## 📊 مانیتورینگ و لاگ‌گیری

ربات اطلاعات زیر را لاگ می‌کند:

- وضعیت اتصال به شبکه
- موجودی کیف پول
- تراکنش‌های ارسالی و دریافتی
- خطاها و استثناها
- وضعیت پوزیشن‌های آتی

## 🚨 عیب‌یابی

### مشکلات رایج

1. **خطای اتصال RPC**

   - بررسی URL RPC
   - بررسی اتصال اینترنت
   - بررسی محدودیت‌های API

2. **خطای گاز ناکافی**

   - افزایش gasLimit
   - افزایش gasPrice
   - بررسی موجودی ETH

3. **خطای تایید توکن**
   - بررسی allowance
   - اجرای مجدد approve
   - بررسی آدرس router

## 🤝 مشارکت

برای مشارکت در پروژه:

1. Fork کنید
2. شاخه جدید ایجاد کنید
3. تغییرات را commit کنید
4. Pull Request ارسال کنید

## 📄 مجوز

این پروژه تحت مجوز ISC منتشر شده است.

## ⚠️ هشدار

این نرم‌افزار برای اهداف آموزشی و تحقیقاتی ارائه شده است. استفاده از آن در معاملات واقعی با ریسک همراه است. همیشه قبل از استفاده در شبکه اصلی، به طور کامل تست کنید.

## 📞 پشتیبانی

برای سوالات و پشتیبانی:

- GitHub Issues
- ایمیل: [your-email@example.com]
- تلگرام: [@your-telegram]

---

**نکته**: این ربات در حال توسعه است و ممکن است تغییرات زیادی داشته باشد. همیشه آخرین نسخه را استفاده کنید.
