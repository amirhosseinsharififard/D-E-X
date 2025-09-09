# Project Reference Guide - راهنمای مرجع پروژه

## English Section

### Core Components
- **DEX Adapters**: Unified interface for Uniswap, Sushiswap, Pancakeswap
- **MEV Protection**: Sandwich detection, frontrunning prevention, flashbots integration
- **Risk Management**: Position sizing, stop-loss strategies, volatility monitoring
- **Data Pipeline**: Real-time market data, liquidity analysis, price feeds

### Architecture
```
[Wallet Layer] -> [Risk Engine] -> [Strategy Engine] 
       ↓               ↓               ↓
[Blockchain Adapters] <-> [Data Pipeline] <-> [MEV Protection]
       ↓
[Execution Layer]
```

### Data Flow
1. Market Data Collection (Prices, Liquidity, Volumes)
2. Opportunity Identification (Arbitrage, Mean Reversion)
3. Risk Assessment (Position Sizing, Slippage Calc)
4. MEV Protection (Transaction Simulation)
5. Execution (Optimal Gas Pricing, Nonce Management)
6. Monitoring (Transaction Tracking, Performance Analysis)

### Key Algorithms
- Arbitrage Detection: Triangular arbitrage across DEXes
- Slippage Calculation: Dynamic based on liquidity depth
- Gas Optimization: EIP-1559 compliant pricing
- Position Sizing: Modified Kelly Criterion

## فارسی - بخش فارسی

### اجزای اصلی
- **سازگارهای DEX**: رابط یکپارچه برای یونی سواپ، سوشی سواپ، پنکیک سواپ
- **محافظت MEV**: تشخیص ساندویچ، جلوگیری از فرانت رانینگ، یکپارچه سازی فلش بات
- **مدیریت ریسک**: تعیین اندازه پوزیشن، استراتژی های حد ضرر، مانیتورینگ نوسانات
- **خط لوله داده**: داده های بازار بلادرنگ، تحلیل نقدینگی، فیدهای قیمتی

### معماری
```
[لایه کیف پول] -> [موتور ریسک] -> [موتور استراتژی]
       ↓               ↓               ↓
[سازگارهای بلاکچین] <-> [خط لوله داده] <-> [محافظت MEV]
       ↓
[لایه اجرایی]
```

### جریان داده
1. جمع آوری داده های بازار (قیمت ها، نقدینگی، حجم ها)
2. شناسایی فرصت ها (آربیتراژ، بازگشت به میانگین)
3. ارزیابی ریسک (تعیین اندازه پوزیشن، محاسبه لغزش)
4. محافظت MEV (شبیه سازی تراکنش)
5. اجرا (قیمت گذاری بهینه گاز، مدیریت نانس)
6. مانیتورینگ (ردیابی تراکنش، تحلیل عملکرد)

### الگوریتم های کلیدی
- تشخیص آربیتراژ: آربیتراژ مثلثی بین صرافی ها
- محاسبه لغزش: پویا بر اساس عمق نقدینگی
- بهینه سازی گاز: منطبق با EIP-1559
- تعیین اندازه پوزیشن: معیار کلی اصلاح شده
