# سیستم مدیریت موقعیت هوشمند - Smart Position Management System

## مقدمه (Introduction)

سیستم مدیریت موقعیت هوشمند یک ویژگی پیشرفته برای ربات DEX است که امکان مدیریت حرفه‌ای موقعیت‌های معاملاتی را فراهم می‌کند. این سیستم شامل استراتژی‌های خروج خودکار، مانیتورینگ قیمت و مدیریت ریسک است.

## ویژگی‌های کلیدی (Key Features)

### 1. مدیریت موقعیت‌های پیشرفته

- **ردیابی موقعیت‌ها**: ثبت و ردیابی تمام موقعیت‌های باز
- **استراتژی‌های خروج**: تعریف استراتژی‌های خروج خودکار
- **محاسبه P&L**: محاسبه سود/زیان برای هر موقعیت
- **تاریخچه معاملات**: نگهداری تاریخچه کامل معاملات

### 2. استراتژی‌های خروج خودکار

- **Stop Loss**: توقف ضرر بر اساس قیمت تعریف شده
- **Take Profit**: کسب سود بر اساس قیمت هدف
- **Trailing Stop**: توقف دنباله‌دار برای حفظ سود
- **Time-based Exit**: خروج بر اساس زمان نگهداری

### 3. مانیتورینگ قیمت

- **Real-time Monitoring**: نظارت مداوم بر قیمت‌ها
- **Automatic Execution**: اجرای خودکار شرایط خروج
- **Price Alerts**: هشدارهای قیمتی
- **Market Analysis**: تحلیل بازار

### 4. مدیریت ریسک

- **Risk Percentage**: مدیریت ریسک بر اساس درصد سرمایه
- **Position Sizing**: تعیین اندازه موقعیت
- **Correlation Analysis**: تحلیل همبستگی
- **Portfolio Risk**: ریسک پرتفوی

## معماری سیستم (System Architecture)

### 1. SmartPositionManager

```javascript
class SmartPositionManager {
    constructor() {
        this.positions = new Map();
        this.exitStrategies = new Map();
        this.positionIdCounter = 1;
    }

    // باز کردن موقعیت جدید
    openPosition(positionData, exitStrategy) {
        // Implementation
    }

    // بستن موقعیت
    closePosition(positionId, closeData, reason) {
        // Implementation
    }

    // بررسی شرایط خروج
    checkExitConditions(positionId, currentPrice) {
        // Implementation
    }

    // به‌روزرسانی توقف دنباله‌دار
    updateTrailingStop(positionId, currentPrice) {
        // Implementation
    }
}
```

### 2. PriceMonitor

```javascript
class PriceMonitor {
    constructor(bot, positionManager) {
        this.bot = bot;
        this.positionManager = positionManager;
        this.monitoringInterval = null;
        this.monitoringIntervalMs = 30000;
    }

    // شروع مانیتورینگ
    startMonitoring() {
        // Implementation
    }

    // توقف مانیتورینگ
    stopMonitoring() {
        // Implementation
    }

    // بررسی تمام موقعیت‌ها
    async checkAllPositions() {
        // Implementation
    }

    // اجرای خروج
    async executeExit(position, currentPrice, reason) {
        // Implementation
    }
}
```

### 3. DataPersistenceManager

```javascript
class DataPersistenceManager {
    constructor() {
        this.dataDir = './bot_data';
        this.ensureDataDirectory();
    }

    // ذخیره موقعیت‌ها
    async savePositions(positions) {
        // Implementation
    }

    // بارگذاری موقعیت‌ها
    async loadPositions() {
        // Implementation
    }

    // ذخیره تمام داده‌ها
    async saveAllData(bot, activeTrades, positions) {
        // Implementation
    }
}
```

## دستورات (Commands)

### 1. باز کردن موقعیت

```bash
openposition <tokenAddress> <amount> <type> <stopLoss> <takeProfit> [maxHoldTime]
```

**مثال:**

```bash
openposition 0x123... 0.1 long 0.05 0.15 24
```

**پارامترها:**

- `tokenAddress`: آدرس توکن
- `amount`: مقدار معامله
- `type`: نوع موقعیت (long/short)
- `stopLoss`: قیمت توقف ضرر
- `takeProfit`: قیمت کسب سود
- `maxHoldTime`: حداکثر زمان نگهداری (ساعت)

### 2. نمایش موقعیت‌های باز

```bash
positions
```

### 3. بستن موقعیت خاص

```bash
closeposition <positionId>
```

### 4. شروع مانیتورینگ

```bash
startmonitoring
```

### 5. توقف مانیتورینگ

```bash
stopmonitoring
```

### 6. به‌روزرسانی توقف ضرر

```bash
updatestop <positionId> <newStopLoss>
```

### 7. به‌روزرسانی هدف سود

```bash
updatetarget <positionId> <newTakeProfit>
```

## استراتژی‌های خروج (Exit Strategies)

### 1. Stop Loss

```javascript
const exitStrategy = {
    stopLoss: 0.05, // 5% ضرر
    takeProfit: 0.15, // 15% سود
    trailingStop: 5, // 5% توقف دنباله‌دار
    maxHoldTime: 24, // 24 ساعت
    riskPercentage: 2, // 2% ریسک
};
```

### 2. Take Profit

```javascript
// کسب سود خودکار
if (currentPrice >= takeProfit) {
    executeExit(position, 'take_profit');
}
```

### 3. Trailing Stop

```javascript
// توقف دنباله‌دار
if (position.type === 'long') {
    const newStopLoss = currentPrice * (1 - trailingPercent);
    if (newStopLoss > position.stopLoss) {
        position.stopLoss = newStopLoss;
    }
}
```

### 4. Time-based Exit

```javascript
// خروج بر اساس زمان
const hoursHeld = (now - entryTime) / (1000 * 60 * 60);
if (hoursHeld >= maxHoldTime) {
    executeExit(position, 'time_exit');
}
```

## مدیریت ریسک (Risk Management)

### 1. محاسبه اندازه موقعیت

```javascript
function calculatePositionSize(accountBalance, riskPercentage, stopLossDistance) {
    const riskAmount = accountBalance * (riskPercentage / 100);
    const positionSize = riskAmount / stopLossDistance;
    return positionSize;
}
```

### 2. بررسی همبستگی

```javascript
async function checkCorrelation(positions) {
    const correlations = [];
    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            const correlation = await calculateCorrelation(positions[i].tokenAddress, positions[j].tokenAddress);
            correlations.push({
                pair: [positions[i].id, positions[j].id],
                correlation: correlation,
            });
        }
    }
    return correlations;
}
```

### 3. محاسبه ریسک پرتفوی

```javascript
function calculatePortfolioRisk(positions) {
    let totalRisk = 0;
    positions.forEach((position) => {
        const positionRisk = position.amount * position.riskPercentage;
        totalRisk += positionRisk;
    });
    return totalRisk;
}
```

## ذخیره‌سازی داده‌ها (Data Persistence)

### 1. ساختار فایل‌ها

```
bot_data/
├── bot_state.json          # وضعیت ربات
├── tokens_registry.json    # رجیستری توکن‌ها
├── active_trades.json      # معاملات فعال
├── positions.json          # موقعیت‌ها
└── backup/                 # پشتیبان‌گیری
    ├── positions_backup_1.json
    └── positions_backup_2.json
```

### 2. فرمت داده موقعیت

```json
{
    "id": "pos_1",
    "type": "long",
    "tokenAddress": "0x123...",
    "entryAmount": "0.1",
    "entryPrice": "0.08",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "status": "open",
    "stopLoss": "0.05",
    "takeProfit": "0.15",
    "trailingStop": 5,
    "maxHoldTime": 24,
    "riskPercentage": 2,
    "txHash": "0xabc...",
    "profitLoss": null
}
```

### 3. بازیابی وضعیت

```javascript
async function recoverBotState() {
    const positions = await persistenceManager.loadPositions();
    const activeTrades = await persistenceManager.loadActiveTrades();
    const tokens = await persistenceManager.loadTokensRegistry();

    // بازیابی موقعیت‌ها
    positionManager.positions = positions;

    // شروع مانیتورینگ برای موقعیت‌های باز
    const openPositions = positionManager.getOpenPositions();
    if (openPositions.length > 0) {
        priceMonitor.startMonitoring();
    }
}
```

## مثال‌های کاربردی (Practical Examples)

### 1. باز کردن موقعیت با استراتژی کامل

```javascript
// تعریف استراتژی خروج
const exitStrategy = {
    stopLoss: 0.05, // 5% ضرر
    takeProfit: 0.15, // 15% سود
    trailingStop: 5, // 5% توقف دنباله‌دار
    maxHoldTime: 24, // 24 ساعت
    riskPercentage: 2, // 2% ریسک
};

// باز کردن موقعیت
const positionId = await positionManager.openPosition(
    {
        type: 'long',
        tokenAddress: '0x123...',
        amount: '0.1',
        entryPrice: '0.08',
        txHash: '0xabc...',
    },
    exitStrategy
);

console.log(`Position opened: ${positionId}`);
```

### 2. مانیتورینگ موقعیت‌ها

```javascript
// شروع مانیتورینگ
priceMonitor.startMonitoring();

// بررسی موقعیت‌های باز
const openPositions = positionManager.getOpenPositions();
console.log(`Monitoring ${openPositions.length} positions`);

// توقف مانیتورینگ
priceMonitor.stopMonitoring();
```

### 3. مدیریت ریسک

```javascript
// محاسبه اندازه موقعیت
const accountBalance = await getBalance(bot);
const positionSize = calculatePositionSize(
    accountBalance,
    2, // 2% ریسک
    0.05 // 5% فاصله توقف ضرر
);

console.log(`Recommended position size: ${positionSize}`);
```

## نکات مهم (Important Notes)

### 1. امنیت

- **Private Key Protection**: محافظت از کلیدهای خصوصی
- **Data Encryption**: رمزنگاری داده‌های حساس
- **Access Control**: کنترل دسترسی
- **Audit Trail**: ردیابی فعالیت‌ها

### 2. عملکرد

- **Optimized Monitoring**: مانیتورینگ بهینه
- **Efficient Storage**: ذخیره‌سازی کارآمد
- **Fast Execution**: اجرای سریع
- **Resource Management**: مدیریت منابع

### 3. قابلیت اطمینان

- **Error Handling**: مدیریت خطا
- **Recovery Mechanisms**: مکانیزم‌های بازیابی
- **Backup Systems**: سیستم‌های پشتیبان
- **Monitoring**: نظارت بر سیستم

## تست و اعتبارسنجی (Testing & Validation)

### 1. تست واحد

```javascript
describe('SmartPositionManager', () => {
    test('should open position correctly', () => {
        // Test implementation
    });

    test('should check exit conditions', () => {
        // Test implementation
    });

    test('should update trailing stop', () => {
        // Test implementation
    });
});
```

### 2. تست یکپارچگی

```javascript
describe('Position Management Integration', () => {
    test('should monitor positions correctly', async () => {
        // Test implementation
    });

    test('should execute exits automatically', async () => {
        // Test implementation
    });
});
```

### 3. تست عملکرد

```javascript
describe('Performance Tests', () => {
    test('should handle multiple positions', () => {
        // Test implementation
    });

    test('should monitor prices efficiently', () => {
        // Test implementation
    });
});
```

## نتیجه‌گیری (Conclusion)

سیستم مدیریت موقعیت هوشمند یک ویژگی پیشرفته و قدرتمند برای ربات DEX است که امکان مدیریت حرفه‌ای موقعیت‌های معاملاتی را فراهم می‌کند. این سیستم شامل:

- ✅ **مدیریت موقعیت‌های پیشرفته**
- ✅ **استراتژی‌های خروج خودکار**
- ✅ **مانیتورینگ قیمت**
- ✅ **مدیریت ریسک**
- ✅ **ذخیره‌سازی داده‌ها**
- ✅ **بازیابی وضعیت**

این سیستم برای معامله‌گران حرفه‌ای که نیاز به مدیریت دقیق موقعیت‌های خود دارند، بسیار مفید است.

---

**تاریخ آخرین به‌روزرسانی**: 2024  
**نسخه**: 1.0.0  
**نویسنده**: تیم توسعه DEX Bot
