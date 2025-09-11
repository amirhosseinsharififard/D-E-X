# تحلیل بازار

## توضیح
سیستم تحلیل بازار برای شناسایی روندها، الگوها و فرصت‌های معاملاتی در بازارهای ارزهای دیجیتال. این سیستم با استفاده از تحلیل‌های تکنیکال، بنیادی و احساسی، اطلاعات ارزشمندی برای تصمیم‌گیری معاملاتی فراهم می‌کند.

## مزایا
- شناسایی فرصت‌های معاملاتی با دقت بالاتر
- کاهش ریسک با تحلیل چندجانبه بازار
- امکان پیش‌بینی روندهای آینده بازار
- بهبود عملکرد استراتژی‌های معاملاتی
- تصمیم‌گیری مبتنی بر داده به جای احساسات

## پیاده‌سازی
سیستم تحلیل بازار با قابلیت‌های زیر:

```javascript
const axios = require('axios');
const technicalIndicators = require('technicalindicators');
const natural = require('natural');
const { SentimentAnalyzer } = natural;
const sentimentAnalyzer = new SentimentAnalyzer();

class MarketAnalysisSystem {
  constructor(config) {
    this.config = config || {
      technicalAnalysis: {
        enabled: true,
        indicators: ['sma', 'ema', 'rsi', 'macd', 'bollinger']
      },
      fundamentalAnalysis: {
        enabled: true,
        metrics: ['marketCap', 'volume', 'supply', 'developerActivity']
      },
      sentimentAnalysis: {
        enabled: true,
        sources: ['twitter', 'reddit', 'news']
      },
      correlationAnalysis: {
        enabled: true,
        assets: ['BTC', 'ETH', 'SOL', 'USDT']
      },
      dataProviders: {
        price: 'https://api.example.com/price',
        news: 'https://api.example.com/news',
        social: 'https://api.example.com/social'
      }
    };
  }
  
  async analyzeTechnical(symbol, timeframe, limit = 100) {
    try {
      // در یک سیستم واقعی، اینجا باید داده‌های قیمت از منبع خارجی دریافت شود
      const priceData = await this._fetchPriceData(symbol, timeframe, limit);
      
      const results = {};
      
      if (this.config.technicalAnalysis.indicators.includes('sma')) {
        results.sma = this._calculateSMA(priceData, 20);
      }
      
      if (this.config.technicalAnalysis.indicators.includes('ema')) {
        results.ema = this._calculateEMA(priceData, 20);
      }
      
      if (this.config.technicalAnalysis.indicators.includes('rsi')) {
        results.rsi = this._calculateRSI(priceData, 14);
      }
      
      if (this.config.technicalAnalysis.indicators.includes('macd')) {
        results.macd = this._calculateMACD(priceData);
      }
      
      if (this.config.technicalAnalysis.indicators.includes('bollinger')) {
        results.bollinger = this._calculateBollingerBands(priceData, 20, 2);
      }
      
      return {
        symbol,
        timeframe,
        indicators: results,
        signals: this._generateTechnicalSignals(results)
      };
    } catch (error) {
      console.error('Error in technical analysis:', error);
      throw new Error(`Technical analysis failed: ${error.message}`);
    }
  }
  
  async analyzeFundamental(symbol) {
    try {
      if (!this.config.fundamentalAnalysis.enabled) {
        return { enabled: false };
      }
      
      // در یک سیستم واقعی، اینجا باید داده‌های بنیادی از منبع خارجی دریافت شود
      const fundamentalData = await this._fetchFundamentalData(symbol);
      
      const metrics = {};
      
      for (const metric of this.config.fundamentalAnalysis.metrics) {
        metrics[metric] = fundamentalData[metric];
      }
      
      return {
        symbol,
        metrics,
        analysis: this._analyzeFundamentalMetrics(metrics),
        signals: this._generateFundamentalSignals(metrics)
      };
    } catch (error) {
      console.error('Error in fundamental analysis:', error);
      throw new Error(`Fundamental analysis failed: ${error.message}`);
    }
  }
  
  async analyzeSentiment(symbol, days = 7) {
    try {
      if (!this.config.sentimentAnalysis.enabled) {
        return { enabled: false };
      }
      
      const results = {};
      
      for (const source of this.config.sentimentAnalysis.sources) {
        // در یک سیستم واقعی، اینجا باید داده‌های احساسی از منابع مختلف دریافت شود
        const data = await this._fetchSentimentData(symbol, source, days);
        results[source] = this._analyzeSentimentData(data);
      }
      
      const aggregatedSentiment = this._aggregateSentiment(results);
      
      return {
        symbol,
        period: `${days} days`,
        sources: results,
        aggregated: aggregatedSentiment,
        signals: this._generateSentimentSignals(aggregatedSentiment)
      };
    } catch (error) {
      console.error('Error in sentiment analysis:', error);
      throw new Error(`Sentiment analysis failed: ${error.message}`);
    }
  }
  
  async analyzeCorrelation(symbol, timeframe, limit = 100) {
    try {
      if (!this.config.correlationAnalysis.enabled) {
        return { enabled: false };
      }
      
      const correlations = {};
      
      // در یک سیستم واقعی، اینجا باید داده‌های قیمت برای همه دارایی‌ها دریافت شود
      const targetPriceData = await this._fetchPriceData(symbol, timeframe, limit);
      
      for (const asset of this.config.correlationAnalysis.assets) {
        if (asset === symbol) continue;
        
        const assetPriceData = await this._fetchPriceData(asset, timeframe, limit);
        correlations[asset] = this._calculateCorrelation(targetPriceData, assetPriceData);
      }
      
      return {
        symbol,
        timeframe,
        correlations,
        insights: this._generateCorrelationInsights(correlations)
      };
    } catch (error) {
      console.error('Error in correlation analysis:', error);
      throw new Error(`Correlation analysis failed: ${error.message}`);
    }
  }
  
  async generateComprehensiveAnalysis(symbol, timeframe) {
    try {
      const technical = await this.analyzeTechnical(symbol, timeframe);
      const fundamental = await this.analyzeFundamental(symbol);
      const sentiment = await this.analyzeSentiment(symbol);
      const correlation = await this.analyzeCorrelation(symbol, timeframe);
      
      const overallSignal = this._generateOverallSignal(technical, fundamental, sentiment, correlation);
      
      return {
        symbol,
        timestamp: new Date().toISOString(),
        technical,
        fundamental,
        sentiment,
        correlation,
        overallSignal
      };
    } catch (error) {
      console.error('Error in comprehensive analysis:', error);
      throw new Error(`Comprehensive analysis failed: ${error.message}`);
    }
  }
  
  // متدهای کمکی برای محاسبات
  _calculateSMA(priceData, period) {
    const closes = priceData.map(candle => candle.close);
    return technicalIndicators.SMA.calculate({ period, values: closes });
  }
  
  _calculateEMA(priceData, period) {
    const closes = priceData.map(candle => candle.close);
    return technicalIndicators.EMA.calculate({ period, values: closes });
  }
  
  _calculateRSI(priceData, period) {
    const closes = priceData.map(candle => candle.close);
    return technicalIndicators.RSI.calculate({ period, values: closes });
  }
  
  _calculateMACD(priceData) {
    const closes = priceData.map(candle => candle.close);
    return technicalIndicators.MACD.calculate({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      values: closes
    });
  }
  
  _calculateBollingerBands(priceData, period, stdDev) {
    const closes = priceData.map(candle => candle.close);
    return technicalIndicators.BollingerBands.calculate({
      period,
      values: closes,
      stdDev
    });
  }
  
  _calculateCorrelation(data1, data2) {
    // پیاده‌سازی محاسبه همبستگی پیرسون
    const closes1 = data1.map(candle => candle.close);
    const closes2 = data2.map(candle => candle.close);
    
    const n = Math.min(closes1.length, closes2.length);
    
    // برش آرایه‌ها به طول یکسان
    const x = closes1.slice(0, n);
    const y = closes2.slice(0, n);
    
    // محاسبه میانگین‌ها
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    
    // محاسبه همبستگی
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      
      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(xDenominator * yDenominator);
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  _analyzeSentimentData(data) {
    // تحلیل احساسی با استفاده از کتابخانه natural
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    
    for (const item of data) {
      const sentiment = sentimentAnalyzer.getSentiment(item.text.split(' '));
      
      if (sentiment > 0.2) {
        positive++;
      } else if (sentiment < -0.2) {
        negative++;
      } else {
        neutral++;
      }
    }
    
    const total = positive + negative + neutral;
    
    return {
      positive: positive / total,
      negative: negative / total,
      neutral: neutral / total,
      score: (positive - negative) / total
    };
  }
  
  _aggregateSentiment(results) {
    // تجمیع نتایج احساسی از منابع مختلف
    const sources = Object.keys(results);
    
    if (sources.length === 0) {
      return { score: 0, positive: 0, negative: 0, neutral: 0 };
    }
    
    let totalPositive = 0;
    let totalNegative = 0;
    let totalNeutral = 0;
    let totalScore = 0;
    
    for (const source of sources) {
      totalPositive += results[source].positive;
      totalNegative += results[source].negative;
      totalNeutral += results[source].neutral;
      totalScore += results[source].score;
    }
    
    return {
      positive: totalPositive / sources.length,
      negative: totalNegative / sources.length,
      neutral: totalNeutral / sources.length,
      score: totalScore / sources.length
    };
  }
  
  _analyzeFundamentalMetrics(metrics) {
    // تحلیل متریک‌های بنیادی
    const analysis = {};
    
    if (metrics.marketCap) {
      if (metrics.marketCap > 10000000000) {
        analysis.marketCapCategory = 'large';
      } else if (metrics.marketCap > 1000000000) {
        analysis.marketCapCategory = 'medium';
      } else {
        analysis.marketCapCategory = 'small';
      }
    }
    
    if (metrics.volume && metrics.marketCap) {
      analysis.volumeToMarketCap = metrics.volume / metrics.marketCap;
    }
    
    if (metrics.developerActivity) {
      if (metrics.developerActivity > 100) {
        analysis.developerActivityCategory = 'high';
      } else if (metrics.developerActivity > 20) {
        analysis.developerActivityCategory = 'medium';
      } else {
        analysis.developerActivityCategory = 'low';
      }
    }
    
    return analysis;
  }
  
  // متدهای تولید سیگنال
  _generateTechnicalSignals(indicators) {
    const signals = [];
    
    // سیگنال‌های RSI
    if (indicators.rsi) {
      const lastRSI = indicators.rsi[indicators.rsi.length - 1];
      
      if (lastRSI < 30) {
        signals.push({ indicator: 'RSI', signal: 'buy', strength: 'strong', value: lastRSI });
      } else if (lastRSI > 70) {
        signals.push({ indicator: 'RSI', signal: 'sell', strength: 'strong', value: lastRSI });
      }
    }
    
    // سیگنال‌های MACD
    if (indicators.macd && indicators.macd.length >= 2) {
      const lastMACD = indicators.macd[indicators.macd.length - 1];
      const prevMACD = indicators.macd[indicators.macd.length - 2];
      
      if (lastMACD.MACD > lastMACD.signal && prevMACD.MACD <= prevMACD.signal) {
        signals.push({ indicator: 'MACD', signal: 'buy', strength: 'medium', value: lastMACD });
      } else if (lastMACD.MACD < lastMACD.signal && prevMACD.MACD >= prevMACD.signal) {
        signals.push({ indicator: 'MACD', signal: 'sell', strength: 'medium', value: lastMACD });
      }
    }
    
    // سیگنال‌های Bollinger Bands
    if (indicators.bollinger && indicators.bollinger.length > 0) {
      const lastBB = indicators.bollinger[indicators.bollinger.length - 1];
      const lastClose = lastBB.middle + (lastBB.upper - lastBB.middle) * 0.95; // فرض کنید این قیمت بسته شدن آخرین شمع است
      
      if (lastClose < lastBB.lower) {
        signals.push({ indicator: 'Bollinger', signal: 'buy', strength: 'medium', value: lastBB });
      } else if (lastClose > lastBB.upper) {
        signals.push({ indicator: 'Bollinger', signal: 'sell', strength: 'medium', value: lastBB });
      }
    }
    
    return signals;
  }
  
  _generateFundamentalSignals(metrics) {
    const signals = [];
    
    if (metrics.volumeToMarketCap && metrics.volumeToMarketCap > 0.2) {
      signals.push({
        metric: 'Volume/MarketCap',
        signal: 'buy',
        strength: 'medium',
        reason: 'High trading volume relative to market cap indicates strong interest'
      });
    }
    
    if (metrics.developerActivityCategory === 'high') {
      signals.push({
        metric: 'Developer Activity',
        signal: 'buy',
        strength: 'weak',
        reason: 'High developer activity suggests continued project development'
      });
    }
    
    return signals;
  }
  
  _generateSentimentSignals(sentiment) {
    const signals = [];
    
    if (sentiment.score > 0.3) {
      signals.push({
        source: 'Aggregated Sentiment',
        signal: 'buy',
        strength: sentiment.score > 0.6 ? 'strong' : 'medium',
        score: sentiment.score
      });
    } else if (sentiment.score < -0.3) {
      signals.push({
        source: 'Aggregated Sentiment',
        signal: 'sell',
        strength: sentiment.score < -0.6 ? 'strong' : 'medium',
        score: sentiment.score
      });
    }
    
    return signals;
  }
  
  _generateCorrelationInsights(correlations) {
    const insights = [];
    
    for (const asset in correlations) {
      const correlation = correlations[asset];
      
      if (correlation > 0.8) {
        insights.push({
          asset,
          correlation,
          insight: `Strong positive correlation with ${asset}. Consider as alternative or hedge together.`
        });
      } else if (correlation < -0.8) {
        insights.push({
          asset,
          correlation,
          insight: `Strong negative correlation with ${asset}. Consider as potential hedge.`
        });
      } else if (Math.abs(correlation) < 0.2) {
        insights.push({
          asset,
          correlation,
          insight: `Very low correlation with ${asset}. Good for portfolio diversification.`
        });
      }
    }
    
    return insights;
  }
  
  _generateOverallSignal(technical, fundamental, sentiment, correlation) {
    // وزن‌دهی به سیگنال‌های مختلف و تولید سیگنال کلی
    const weights = {
      technical: 0.4,
      fundamental: 0.3,
      sentiment: 0.2,
      correlation: 0.1
    };
    
    let technicalScore = 0;
    let fundamentalScore = 0;
    let sentimentScore = 0;
    let correlationScore = 0;
    
    // محاسبه امتیاز تکنیکال
    if (technical.signals && technical.signals.length > 0) {
      for (const signal of technical.signals) {
        if (signal.signal === 'buy') {
          technicalScore += signal.strength === 'strong' ? 1 : 0.5;
        } else if (signal.signal === 'sell') {
          technicalScore -= signal.strength === 'strong' ? 1 : 0.5;
        }
      }
      
      // نرمال‌سازی
      technicalScore = Math.max(-1, Math.min(1, technicalScore / technical.signals.length));
    }
    
    // محاسبه امتیاز بنیادی
    if (fundamental.signals && fundamental.signals.length > 0) {
      for (const signal of fundamental.signals) {
        if (signal.signal === 'buy') {
          fundamentalScore += signal.strength === 'strong' ? 1 : (signal.strength === 'medium' ? 0.5 : 0.25);
        } else if (signal.signal === 'sell') {
          fundamentalScore -= signal.strength === 'strong' ? 1 : (signal.strength === 'medium' ? 0.5 : 0.25);
        }
      }
      
      // نرمال‌سازی
      fundamentalScore = Math.max(-1, Math.min(1, fundamentalScore / fundamental.signals.length));
    }
    
    // محاسبه امتیاز احساسی
    if (sentiment.aggregated) {
      sentimentScore = sentiment.aggregated.score;
    }
    
    // محاسبه امتیاز همبستگی
    if (correlation.insights && correlation.insights.length > 0) {
      let positiveCount = 0;
      let negativeCount = 0;
      
      for (const insight of correlation.insights) {
        if (insight.insight.includes('hedge')) {
          positiveCount++;
        } else if (insight.insight.includes('diversification')) {
          positiveCount += 0.5;
        }
      }
      
      correlationScore = (positiveCount - negativeCount) / correlation.insights.length;
    }
    
    // محاسبه امتیاز کلی با وزن‌دهی
    const overallScore = (
      technicalScore * weights.technical +
      fundamentalScore * weights.fundamental +
      sentimentScore * weights.sentiment +
      correlationScore * weights.correlation
    );
    
    // تعیین سیگنال بر اساس امتیاز کلی
    let signal, strength;
    
    if (overallScore > 0.6) {
      signal = 'strong buy';
      strength = 'high';
    } else if (overallScore > 0.2) {
      signal = 'buy';
      strength = 'medium';
    } else if (overallScore > -0.2) {
      signal = 'neutral';
      strength = 'low';
    } else if (overallScore > -0.6) {
      signal = 'sell';
      strength = 'medium';
    } else {
      signal = 'strong sell';
      strength = 'high';
    }
    
    return {
      signal,
      strength,
      score: overallScore,
      components: {
        technical: technicalScore,
        fundamental: fundamentalScore,
        sentiment: sentimentScore,
        correlation: correlationScore
      }
    };
  }
  
  // متدهای دریافت داده
  async _fetchPriceData(symbol, timeframe, limit) {
    // در یک سیستم واقعی، اینجا باید داده‌های قیمت از API خارجی دریافت شود
    // این یک پیاده‌سازی نمونه است
    try {
      const response = await axios.get(`${this.config.dataProviders.price}`, {
        params: { symbol, timeframe, limit }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching price data for ${symbol}:`, error);
      
      // برای نمونه، داده‌های ساختگی برگردانده می‌شود
      return this._generateSamplePriceData(limit);
    }
  }
  
  async _fetchFundamentalData(symbol) {
    // در یک سیستم واقعی، اینجا باید داده‌های بنیادی از API خارجی دریافت شود
    // این یک پیاده‌سازی نمونه است
    try {
      const response = await axios.get(`${this.config.dataProviders.price}/fundamental`, {
        params: { symbol }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching fundamental data for ${symbol}:`, error);
      
      // برای نمونه، داده‌های ساختگی برگردانده می‌شود
      return {
        marketCap: 5000000000,
        volume: 1000000000,
        supply: 100000000,
        developerActivity: 120
      };
    }
  }
  
  async _fetchSentimentData(symbol, source, days) {
    // در یک سیستم واقعی، اینجا باید داده‌های احساسی از API خارجی دریافت شود
    // این یک پیاده‌سازی نمونه است
    try {
      const response = await axios.get(`${this.config.dataProviders.social}`, {
        params: { symbol, source, days }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching sentiment data for ${symbol} from ${source}:`, error);
      
      // برای نمونه، داده‌های ساختگی برگردانده می‌شود
      return this._generateSampleSentimentData(days);
    }
  }
  
  _generateSamplePriceData(limit) {
    // تولید داده‌های قیمت نمونه برای تست
    const data = [];
    let price = 1000 + Math.random() * 1000;
    
    for (let i = 0; i < limit; i++) {
      const change = (Math.random() - 0.5) * 20;
      price += change;
      
      const high = price + Math.random() * 10;
      const low = price - Math.random() * 10;
      const open = low + Math.random() * (high - low);
      const close = low + Math.random() * (high - low);
      
      data.push({
        timestamp: new Date(Date.now() - (limit - i) * 3600000).toISOString(),
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000000
      });
    }
    
    return data;
  }
  
  _generateSampleSentimentData(days) {
    // تولید داده‌های احساسی نمونه برای تست
    const data = [];
    const sentiments = [
      'This project looks very promising!',
      'I think this coin will moon soon.',
      'The team is making great progress.',
      'Not sure about this project anymore.',
      'The price keeps dropping, I am worried.',
      'Just bought more on this dip!',
      'The new update is amazing.',
      'This is a solid long-term investment.',
      'I am losing faith in this project.',
      'The competition is getting stronger.'
    ];
    
    for (let i = 0; i < days * 10; i++) {
      data.push({
        id: `post_${i}`,
        text: sentiments[Math.floor(Math.random() * sentiments.length)],
        timestamp: new Date(Date.now() - Math.random() * days * 24 * 3600000).toISOString(),
        likes: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 20)
      });
    }
    
    return data;
  }
}

// نمونه استفاده
const marketAnalysis = new MarketAnalysisSystem();

// تحلیل تکنیکال
marketAnalysis.analyzeTechnical('ETH/USDT', '1h', 100)
  .then(result => {
    console.log('Technical Analysis Result:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Technical Analysis Error:', error);
  });

// تحلیل جامع
marketAnalysis.generateComprehensiveAnalysis('ETH/USDT', '1h')
  .then(result => {
    console.log('Comprehensive Analysis Result:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Comprehensive Analysis Error:', error);
  });
```

## نحوه پیاده‌سازی در پروژه

1. **تحلیل تکنیکال**:
   - پیاده‌سازی شاخص‌های تکنیکال (RSI، MACD، Bollinger Bands و غیره)
   - تولید سیگنال‌های معاملاتی بر اساس شاخص‌ها
   - تشخیص الگوهای نموداری

2. **تحلیل بنیادی**:
   - جمع‌آوری داده‌های بنیادی (حجم معاملات، ارزش بازار، عرضه و غیره)
   - ارزیابی فعالیت توسعه‌دهندگان و پیشرفت پروژه
   - تحلیل رویدادهای آینده و اخبار

3. **تحلیل احساسی**:
   - جمع‌آوری داده‌ها از شبکه‌های اجتماعی و منابع خبری
   - تحلیل احساسی متن‌ها با استفاده از پردازش زبان طبیعی
   - تجمیع نتایج از منابع مختلف

4. **تحلیل همبستگی**:
   - محاسبه همبستگی بین دارایی‌های مختلف
   - شناسایی فرصت‌های آربیتراژ
   - بهینه‌سازی پورتفولیو

5. **تجمیع و تصمیم‌گیری**:
   - وزن‌دهی به نتایج تحلیل‌های مختلف
   - تولید سیگنال‌های معاملاتی نهایی
   - ارائه توصیه‌های معاملاتی

## مراحل پیاده‌سازی

1. **فاز 1**: پیاده‌سازی تحلیل تکنیکال
2. **فاز 2**: پیاده‌سازی تحلیل بنیادی
3. **فاز 3**: پیاده‌سازی تحلیل احساسی
4. **فاز 4**: پیاده‌سازی تحلیل همبستگی
5. **فاز 5**: یکپارچه‌سازی و تولید سیگنال‌های نهایی

## نکات مهم

- استفاده از منابع داده معتبر و به‌روز
- بهینه‌سازی عملکرد برای تحلیل‌های زمان واقعی
- اعتبارسنجی نتایج تحلیل با داده‌های تاریخی
- در نظر گرفتن شرایط غیرعادی بازار
- امکان تنظیم پارامترها و وزن‌ها توسط کاربر