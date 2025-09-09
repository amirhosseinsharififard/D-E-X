# Data Architecture - معماری داده

## English Section

### Data Sources
- On-chain: Smart contract events, mempool, chain state
- Off-chain: DEX APIs, Oracle feeds, liquidity pools
- Historical: Price history, volume trends, volatility data

### Processing Pipeline
1. Real-time Event Streaming (Web3 subscriptions)
2. Data Normalization (Token decimals, timestamp sync)
3. Enrichment (Add metadata, risk scores)
4. Storage (Time-series database, cache layer)
5. Analysis (Statistical models, ML predictions)

### Key Metrics
- Liquidity Depth: Available tokens in pools
- Price Impact: Slippage per trade size
- MEV Risk Score: Probability of sandwich attack
- Profitability Index: Historical strategy performance

## فارسی - بخش فارسی

### منابع داده
- زنجیره ای: رویدادهای قرارداد هوشمند، ممپول، وضعیت زنجیره
- خارج زنجیره: API های صرافی، فیدهای اوراکل، استخرهای نقدینگی
- تاریخی: تاریخچه قیمت، روند حجم، داده های نوسان

### خط لوله پردازش
1. جریان دهی رویدادهای بلادرنگ (اشتراک های Web3)
2. نرمال سازی داده (اعشار توکن، همگام سازی زمان)
3. غنی سازی (افزودن متادیتا، امتیازهای ریسک)
4. ذخیره سازی (پایگاه داده سری زمانی، لایه کش)
5. تحلیل (مدل های آماری، پیش بینی های یادگیری ماشین)

### معیارهای کلیدی
- عمق نقدینگی: توکن های موجود در استخرها
- تاثیر قیمت: لغزش بر اساس اندازه معامله
- امتیاز ریسک MEV: احتمال حمله ساندویچ
- شاخص سودآوری: عملکرد تاریخی استراتژی
