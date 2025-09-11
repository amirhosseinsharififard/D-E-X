# سیستم مدیریت ریسک (Risk Management)

## توضیحات

در دنیای پرنوسان و رقابتی MEV، مدیریت ریسک یک جزء ضروری برای بقا و سودآوری بلندمدت است. یک سیستم مدیریت ریسک قوی به ربات کمک می‌کند تا از ضررهای فاجعه‌بار جلوگیری کرده و در شرایط نامطلوب بازار، عملکرد پایداری داشته باشد. این سیستم مانند یک شبکه ایمنی عمل می‌کند که قبل از اجرای هر استراتژی، پارامترهای حیاتی را بررسی می‌کند.

## قابلیت‌ها

- **بررسی لغزش قیمت (Slippage Check)**: محاسبه و اعمال حداکثر لغزش قیمت مجاز برای یک معامله. اگر لغزش قیمت از آستانه تعیین‌شده بیشتر باشد، تراکنش لغو می‌شود.
- **بررسی هزینه Gas**: ارزیابی هزینه Gas مورد نیاز برای اجرای یک استراتژی و مقایسه آن با سود بالقوه. اگر هزینه Gas بیش از حد بالا باشد، استراتژی اجرا نخواهد شد.
- **ارزیابی سودآوری (Profitability Assessment)**: تحلیل سود و زیان (PnL) یک فرصت MEV قبل از اجرا. این سیستم تضمین می‌کند که فقط استراتژی‌های با سود خالص مثبت دنبال شوند.
- **مدیریت سرمایه**: کنترل میزان سرمایه‌ای که در هر معامله یا استراتژی درگیر می‌شود تا از ریسک بیش از حد جلوگیری شود.
- **لیست سیاه (Blacklist)**: شناسایی و مسدود کردن آدرس‌ها یا قراردادهای هوشمند مشکوک و پرریسک.

## مثال کد (JavaScript)

این مثال یک تابع ساده برای بررسی سودآوری یک استراتژی آربیتراژ را نشان می‌دهد.

```javascript
const ethers = require('ethers');

class RiskManager {
    constructor(maxSlippageBps = 50, minProfitUsd = 10) {
        this.maxSlippageBps = maxSlippageBps; // حداکثر لغزش قیمت به Basis Points (e.g., 50 BPS = 0.5%)
        this.minProfitUsd = minProfitUsd;     // حداقل سود مورد انتظار به دلار
    }

    /**
     * بررسی می‌کند که آیا یک استراتژی با توجه به پارامترهای ریسک قابل قبول است یا خیر
     * @param {object} strategyDetails - جزئیات استراتژی
     * @param {number} strategyDetails.estimatedProfitUsd - سود تخمینی به دلار
     * @param {number} strategyDetails.estimatedGasCostUsd - هزینه Gas تخمینی به دلار
     * @param {number} strategyDetails.slippageBps - لغزش قیمت تخمینی
     * @returns {boolean} - آیا استراتژی تأیید می‌شود یا خیر
     */
    isStrategyAcceptable(strategyDetails) {
        const { estimatedProfitUsd, estimatedGasCostUsd, slippageBps } = strategyDetails;

        // 1. بررسی لغزش قیمت
        if (slippageBps > this.maxSlippageBps) {
            console.warn(`Risk Check Failed: Slippage (${slippageBps} BPS) exceeds maximum allowed (${this.maxSlippageBps} BPS).`);
            return false;
        }

        // 2. محاسبه سود خالص
        const netProfitUsd = estimatedProfitUsd - estimatedGasCostUsd;

        // 3. بررسی حداقل سود
        if (netProfitUsd < this.minProfitUsd) {
            console.warn(`Risk Check Failed: Net profit (${netProfitUsd} USD) is below minimum required (${this.minProfitUsd} USD).`);
            return false;
        }

        console.log(`Risk Check Passed: Strategy is acceptable with a net profit of ${netProfitUsd.toFixed(2)} USD.`);
        return true;
    }
}

// مثال استفاده
function main() {
    const riskManager = new RiskManager(50, 20); // لغزش 0.5%، حداقل سود 20 دلار

    // سناریو ۱: سودآور
    const profitableStrategy = {
        estimatedProfitUsd: 100,
        estimatedGasCostUsd: 30,
        slippageBps: 25,
    };
    console.log('--- Checking Profitable Strategy ---');
    riskManager.isStrategyAcceptable(profitableStrategy);

    // سناریو ۲: لغزش قیمت بالا
    const highSlippageStrategy = {
        estimatedProfitUsd: 100,
        estimatedGasCostUsd: 30,
        slippageBps: 70, // بالاتر از حد مجاز
    };
    console.log('\n--- Checking High Slippage Strategy ---');
    riskManager.isStrategyAcceptable(highSlippageStrategy);

    // سناریو ۳: سود خالص ناکافی
    const lowProfitStrategy = {
        estimatedProfitUsd: 50,
        estimatedGasCostUsd: 35, // سود خالص 15 دلار، کمتر از 20 دلار
        slippageBps: 20,
    };
    console.log('\n--- Checking Low Profit Strategy ---');
    riskManager.isStrategyAcceptable(lowProfitStrategy);
}

main();
```

## نکات مهم

- **پارامترهای داینامیک**: پارامترهای مدیریت ریسک (مانند لغزش قیمت و حداقل سود) باید به صورت داینامیک و بر اساس شرایط بازار (مانند نوسانات و قیمت Gas) تنظیم شوند.
- **یکپارچه‌سازی**: سیستم مدیریت ریسک باید قبل از `Strategy Executor` فراخوانی شود تا از اجرای تراکنش‌های پرریسک جلوگیری کند.
- **مانیتورینگ مداوم**: عملکرد سیستم ریسک باید به طور مداوم نظارت شود تا اطمینان حاصل شود که به درستی از سرمایه محافظت می‌کند.