/**
 * Test Suite for DEX Trading Bot Advanced Ideas
 * 
 * This file contains comprehensive tests for all advanced trading strategies
 * and innovative features implemented in DEX_BOT_IDEAS.js
 */

const {
    DCABot,
    GridTradingBot,
    ArbitrageBot,
    RiskManager,
    TechnicalAnalysis,
    AITradingAdvisor,
    SentimentAnalyzer,
    SocialTradingSystem,
    GamificationSystem,
    GasOptimizer,
    MonitoringSystem
} = require('./DEX_BOT_IDEAS');

// Mock bot for testing
const mockBot = {
    buyToken: jest.fn(),
    sellToken: jest.fn(),
    getBalance: jest.fn()
};

describe('DEX Trading Bot Advanced Ideas', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('DCA Bot', () => {
        let dcaBot;

        beforeEach(() => {
            dcaBot = new DCABot('0x123', '0.1', 1000, mockBot);
        });

        test('should create DCA bot with correct parameters', () => {
            expect(dcaBot.tokenAddress).toBe('0x123');
            expect(dcaBot.amount).toBe('0.1');
            expect(dcaBot.interval).toBe(1000);
            expect(dcaBot.bot).toBe(mockBot);
            expect(dcaBot.isRunning).toBe(false);
            expect(dcaBot.purchases).toEqual([]);
            expect(dcaBot.totalInvested).toBe(0);
            expect(dcaBot.totalTokens).toBe(0);
        });

        test('should start DCA bot', async() => {
            mockBot.buyToken.mockResolvedValue({
                success: true,
                txHash: '0xabc123'
            });

            const startPromise = dcaBot.startDCA();

            // Fast forward time to trigger one purchase
            jest.advanceTimersByTime(1000);
            await Promise.resolve(); // Allow async operations to complete

            expect(dcaBot.isRunning).toBe(true);
            expect(mockBot.buyToken).toHaveBeenCalledWith('0x123', '0.1');

            // Stop the bot
            await dcaBot.stopDCA();
            expect(dcaBot.isRunning).toBe(false);
        });

        test('should handle buy token errors gracefully', async() => {
            mockBot.buyToken.mockResolvedValue({
                success: false,
                error: 'Insufficient funds'
            });

            const startPromise = dcaBot.startDCA();

            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            expect(dcaBot.purchases).toHaveLength(0);
            expect(dcaBot.totalInvested).toBe(0);

            await dcaBot.stopDCA();
        });

        test('should calculate stats correctly', async() => {
            // Add some mock purchases
            dcaBot.purchases = [
                { amount: '0.1', price: 0.001 },
                { amount: '0.1', price: 0.0011 }
            ];
            dcaBot.totalInvested = 0.2;
            dcaBot.totalTokens = 200;

            const stats = dcaBot.getStats();

            expect(stats.totalPurchases).toBe(2);
            expect(stats.totalInvested).toBe(0.2);
            expect(stats.totalTokens).toBe(200);
            expect(stats.averagePrice).toBe(0.001);
        });

        test('should stop DCA bot', async() => {
            dcaBot.isRunning = true;
            await dcaBot.stopDCA();
            expect(dcaBot.isRunning).toBe(false);
        });
    });

    describe('Grid Trading Bot', () => {
        let gridBot;

        beforeEach(() => {
            gridBot = new GridTradingBot('0x123', 5, 2, mockBot);
        });

        test('should create grid bot with correct parameters', () => {
            expect(gridBot.tokenAddress).toBe('0x123');
            expect(gridBot.gridSize).toBe(5);
            expect(gridBot.gridSpacing).toBe(2);
            expect(gridBot.bot).toBe(mockBot);
            expect(gridBot.isRunning).toBe(false);
            expect(gridBot.gridOrders.size).toBe(0);
        });

        test('should place grid orders', async() => {
            gridBot.basePrice = 0.001;
            await gridBot.placeGridOrders();

            expect(gridBot.gridOrders.size).toBe(10); // 5 buy + 5 sell orders

            // Check buy orders
            const buyOrders = Array.from(gridBot.gridOrders.values()).filter(o => o.type === 'buy');
            expect(buyOrders).toHaveLength(5);

            // Check sell orders
            const sellOrders = Array.from(gridBot.gridOrders.values()).filter(o => o.type === 'sell');
            expect(sellOrders).toHaveLength(5);
        });

        test('should execute grid orders when price conditions are met', async() => {
            gridBot.basePrice = 0.001;
            await gridBot.placeGridOrders();

            mockBot.buyToken.mockResolvedValue({
                success: true,
                txHash: '0xbuy123'
            });

            // Mock current price below buy order price
            const buyOrder = Array.from(gridBot.gridOrders.values()).find(o => o.type === 'buy');
            const currentPrice = buyOrder.price - 0.0001;

            await gridBot.checkGridExecution(currentPrice);

            expect(mockBot.buyToken).toHaveBeenCalled();
        });

        test('should get grid stats', () => {
            // Add some mock orders
            gridBot.gridOrders.set('buy_1', { type: 'buy', status: 'executed' });
            gridBot.gridOrders.set('sell_1', { type: 'sell', status: 'executed' });
            gridBot.gridOrders.set('buy_2', { type: 'buy', status: 'active' });

            const stats = gridBot.getStats();

            expect(stats.totalOrders).toBe(3);
            expect(stats.executedOrders).toBe(2);
            expect(stats.buyOrders).toBe(1);
            expect(stats.sellOrders).toBe(1);
        });
    });

    describe('Arbitrage Bot', () => {
        let arbitrageBot;

        beforeEach(() => {
            arbitrageBot = new ArbitrageBot(mockBot);
        });

        test('should create arbitrage bot', () => {
            expect(arbitrageBot.bot).toBe(mockBot);
            expect(arbitrageBot.isRunning).toBe(false);
            expect(arbitrageBot.opportunities).toEqual([]);
            expect(arbitrageBot.minProfitThreshold).toBe(0.01);
        });

        test('should find arbitrage opportunities', () => {
            const prices = {
                uniswap: 0.001,
                sushiswap: 0.0012,
                pancakeswap: 0.0009
            };

            const opportunity = arbitrageBot.findArbitrageOpportunity(prices);

            expect(opportunity).toBeDefined();
            expect(opportunity.buyExchange).toBe('pancakeswap');
            expect(opportunity.sellExchange).toBe('sushiswap');
            expect(opportunity.profitPercent).toBeGreaterThan(0);
        });

        test('should not find opportunities when no profit exists', () => {
            const prices = {
                uniswap: 0.001,
                sushiswap: 0.001,
                pancakeswap: 0.001
            };

            const opportunity = arbitrageBot.findArbitrageOpportunity(prices);

            expect(opportunity).toBeNull();
        });

        test('should get arbitrage stats', () => {
            arbitrageBot.opportunities = [
                { actualProfit: 0.01, executed: true },
                { actualProfit: 0.02, executed: true },
                { actualProfit: 0, executed: false }
            ];

            const stats = arbitrageBot.getStats();

            expect(stats.totalOpportunities).toBe(3);
            expect(stats.successfulArbitrages).toBe(2);
            expect(stats.totalProfit).toBe(0.03);
            expect(stats.averageProfit).toBe(0.015);
        });
    });

    describe('Risk Manager', () => {
        let riskManager;

        beforeEach(() => {
            riskManager = new RiskManager(mockBot, 2, 10);
        });

        test('should create risk manager with correct parameters', () => {
            expect(riskManager.bot).toBe(mockBot);
            expect(riskManager.maxRiskPerTrade).toBe(2);
            expect(riskManager.maxPortfolioRisk).toBe(10);
            expect(riskManager.positions.size).toBe(0);
            expect(riskManager.stopLossPercent).toBe(10);
        });

        test('should calculate position size correctly', () => {
            const accountBalance = 1000;
            const riskAmount = 20;
            const stopLossDistance = 0.05;

            const positionSize = riskManager.calculatePositionSize(accountBalance, riskAmount, stopLossDistance);

            expect(positionSize).toBe(400); // 20 / 0.05
        });

        test('should respect maximum position size', () => {
            const accountBalance = 1000;
            const riskAmount = 100;
            const stopLossDistance = 0.01;

            const positionSize = riskManager.calculatePositionSize(accountBalance, riskAmount, stopLossDistance);

            expect(positionSize).toBe(20); // Max 2% of 1000 = 20
        });

        test('should add positions', () => {
            riskManager.addPosition('0x123', 100, 0.001);

            const position = riskManager.positions.get('0x123');
            expect(position.token).toBe('0x123');
            expect(position.amount).toBe(100);
            expect(position.entryPrice).toBe(0.001);
            expect(position.status).toBe('open');
        });

        test('should generate risk report', () => {
            riskManager.addPosition('0x123', 100, 0.001);
            riskManager.addPosition('0x456', 200, 0.002);

            const report = riskManager.getRiskReport();

            expect(report.totalPositions).toBe(2);
            expect(report.openPositions).toBe(2);
            expect(report.maxRiskPerTrade).toBe(2);
            expect(report.maxPortfolioRisk).toBe(10);
        });
    });

    describe('Technical Analysis', () => {
        let technicalAnalysis;

        beforeEach(() => {
            technicalAnalysis = new TechnicalAnalysis();
        });

        test('should calculate RSI correctly', () => {
            const prices = [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7];
            const rsi = technicalAnalysis.calculateRSI(prices, 14);

            expect(rsi).toBeGreaterThan(0);
            expect(rsi).toBeLessThan(100);
        });

        test('should throw error for insufficient data in RSI', () => {
            const prices = [1, 2, 3];

            expect(() => {
                technicalAnalysis.calculateRSI(prices, 14);
            }).toThrow('Insufficient data for RSI calculation');
        });

        test('should calculate SMA correctly', () => {
            const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const sma = technicalAnalysis.calculateSMA(prices, 5);

            expect(sma).toBe(8); // (6+7+8+9+10)/5
        });

        test('should calculate EMA correctly', () => {
            const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const ema = technicalAnalysis.calculateEMA(prices, 5);

            expect(ema).toBeGreaterThan(0);
            expect(typeof ema).toBe('number');
        });

        test('should calculate Bollinger Bands', () => {
            const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
            const bands = technicalAnalysis.calculateBollingerBands(prices, 20);

            expect(bands.upperBand).toBeGreaterThan(bands.middleBand);
            expect(bands.middleBand).toBeGreaterThan(bands.lowerBand);
            expect(bands.middleBand).toBe(10.5); // Average of last 20 prices
        });

        test('should generate trading signal', () => {
            const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
            const signal = technicalAnalysis.generateTradingSignal(prices);

            expect(signal.signal).toMatch(/^(BUY|SELL|HOLD)$/);
            expect(signal.confidence).toBeGreaterThanOrEqual(0);
            expect(signal.confidence).toBeLessThanOrEqual(1);
            expect(signal.rsi).toBeDefined();
            expect(signal.sma20).toBeDefined();
            expect(signal.sma50).toBeDefined();
        });

        test('should update price history', () => {
            technicalAnalysis.updatePriceHistory('0x123', 0.001);
            technicalAnalysis.updatePriceHistory('0x123', 0.002);

            const history = technicalAnalysis.getPriceHistory('0x123');
            expect(history).toEqual([0.001, 0.002]);
        });
    });

    describe('AI Trading Advisor', () => {
        let aiAdvisor;

        beforeEach(() => {
            aiAdvisor = new AITradingAdvisor();
        });

        test('should create AI advisor', () => {
            expect(aiAdvisor.model).toBeNull();
            expect(aiAdvisor.sentimentAnalyzer).toBeInstanceOf(Object);
            expect(aiAdvisor.technicalAnalysis).toBeInstanceOf(Object);
            expect(aiAdvisor.predictions.size).toBe(0);
        });

        test('should analyze market', async() => {
            const recommendation = await aiAdvisor.analyzeMarket('0x123');

            expect(recommendation.action).toMatch(/^(BUY|SELL|HOLD)$/);
            expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
            expect(recommendation.confidence).toBeLessThanOrEqual(1);
            expect(recommendation.reasoning).toBeInstanceOf(Array);
            expect(recommendation.sentiment).toBeDefined();
            expect(recommendation.technical).toBeDefined();
        });

        test('should generate recommendation based on sentiment and technical', () => {
            const sentiment = { overall: 0.8, confidence: 0.9 };
            const technical = { signal: 'BUY', confidence: 0.8 };

            const recommendation = aiAdvisor.generateRecommendation(sentiment, technical);

            expect(recommendation.action).toBe('BUY');
            expect(recommendation.confidence).toBeGreaterThan(0.5);
            expect(recommendation.reasoning).toContain('Positive sentiment + bullish technical signals');
        });

        test('should get predictions', async() => {
            await aiAdvisor.analyzeMarket('0x123');
            await aiAdvisor.analyzeMarket('0x456');

            const predictions = aiAdvisor.getPredictions();
            expect(predictions).toHaveLength(2);
        });
    });

    describe('Sentiment Analyzer', () => {
        let sentimentAnalyzer;

        beforeEach(() => {
            sentimentAnalyzer = new SentimentAnalyzer();
        });

        test('should create sentiment analyzer', () => {
            expect(sentimentAnalyzer.positiveWords).toContain('good');
            expect(sentimentAnalyzer.negativeWords).toContain('bad');
        });

        test('should analyze sentiment from news and social data', async() => {
            const newsData = {
                articles: [
                    { title: 'Great project with excellent potential' },
                    { title: 'Market shows bullish trends' }
                ]
            };

            const socialData = {
                tweets: [
                    { text: 'This is amazing! Moon soon!' },
                    { text: 'Not sure about this project' }
                ]
            };

            const sentiment = await sentimentAnalyzer.analyze(newsData, socialData);

            expect(sentiment.overall).toBeGreaterThan(0.5);
            expect(sentiment.confidence).toBeGreaterThan(0);
            expect(sentiment.news).toBeDefined();
            expect(sentiment.social).toBeDefined();
        });

        test('should analyze text sentiment', () => {
            const positiveText = 'This is a great and amazing project';
            const negativeText = 'This is bad and terrible';
            const neutralText = 'This is okay';

            const positiveSentiment = sentimentAnalyzer.analyzeText(positiveText);
            const negativeSentiment = sentimentAnalyzer.analyzeText(negativeText);
            const neutralSentiment = sentimentAnalyzer.analyzeText(neutralText);

            expect(positiveSentiment).toBeGreaterThan(0.5);
            expect(negativeSentiment).toBeLessThan(0.5);
            expect(neutralSentiment).toBeCloseTo(0.5, 1);
        });
    });

    describe('Social Trading System', () => {
        let socialTrading;

        beforeEach(() => {
            socialTrading = new SocialTradingSystem();
        });

        test('should create social trading system', () => {
            expect(socialTrading.traders.size).toBe(0);
            expect(socialTrading.followers.size).toBe(0);
            expect(socialTrading.trades.size).toBe(0);
            expect(socialTrading.leaderboard).toEqual([]);
        });

        test('should update trader performance', () => {
            socialTrading.updateTraderPerformance('0x123', { profit: 10 });
            socialTrading.updateTraderPerformance('0x123', { profit: -5 });
            socialTrading.updateTraderPerformance('0x123', { profit: 15 });

            const trader = socialTrading.traders.get('0x123');
            expect(trader.totalTrades).toBe(3);
            expect(trader.successfulTrades).toBe(2);
            expect(trader.totalProfit).toBe(20);
            expect(trader.performance).toBeCloseTo(0.67, 2);
        });

        test('should update leaderboard', () => {
            socialTrading.updateTraderPerformance('0x123', { profit: 10 });
            socialTrading.updateTraderPerformance('0x456', { profit: 20 });
            socialTrading.updateTraderPerformance('0x789', { profit: 5 });

            const leaderboard = socialTrading.getLeaderboard();
            expect(leaderboard).toHaveLength(3);
            expect(leaderboard[0].address).toBe('0x456'); // Highest performance
        });

        test('should get trader stats', () => {
            socialTrading.updateTraderPerformance('0x123', { profit: 10 });

            const stats = socialTrading.getTraderStats('0x123');
            expect(stats.address).toBe('0x123');
            expect(stats.totalTrades).toBe(1);
            expect(stats.successfulTrades).toBe(1);
        });

        test('should return null for non-existent trader', () => {
            const stats = socialTrading.getTraderStats('0x999');
            expect(stats).toBeNull();
        });
    });

    describe('Gamification System', () => {
        let gamification;

        beforeEach(() => {
            gamification = new GamificationSystem();
        });

        test('should create gamification system', () => {
            expect(gamification.achievements.size).toBe(0);
            expect(gamification.points).toBe(0);
            expect(gamification.level).toBe(1);
            expect(gamification.badges.size).toBe(0);
            expect(gamification.challenges.size).toBe(0);
        });

        test('should check achievements for profitable trades', async() => {
            const tradeResult = { profit: 150 };

            const newAchievements = await gamification.checkAchievements(tradeResult);

            expect(gamification.points).toBe(60); // 10 for profit + 50 for achievement
            expect(newAchievements).toContain('Big Winner');
        });

        test('should unlock achievement', async() => {
            await gamification.unlockAchievement('Test Achievement', 'Test description');

            expect(gamification.achievements.has('Test Achievement')).toBe(true);
            expect(gamification.points).toBe(50);
        });

        test('should not unlock duplicate achievement', async() => {
            await gamification.unlockAchievement('Test Achievement', 'Test description');
            await gamification.unlockAchievement('Test Achievement', 'Test description');

            expect(gamification.achievements.size).toBe(1);
            expect(gamification.points).toBe(50); // Should not add points twice
        });

        test('should level up when points threshold is reached', async() => {
            gamification.points = 950;
            await gamification.checkLevelUp();

            expect(gamification.level).toBe(1); // Not enough points yet

            gamification.points = 1000;
            await gamification.checkLevelUp();

            expect(gamification.level).toBe(2);
        });

        test('should create daily challenge', () => {
            const challenge = gamification.createDailyChallenge();

            expect(challenge.id).toBeDefined();
            expect(challenge.name).toBeDefined();
            expect(challenge.description).toBeDefined();
            expect(challenge.target).toBeGreaterThan(0);
            expect(challenge.reward).toBeGreaterThan(0);
            expect(gamification.challenges.has(challenge.id)).toBe(true);
        });

        test('should update challenge progress', () => {
            gamification.createDailyChallenge();
            const challengeId = 'daily_profit';

            gamification.updateChallengeProgress(challengeId, 0.05);
            expect(gamification.challenges.get(challengeId).progress).toBe(0.05);

            gamification.updateChallengeProgress(challengeId, 0.1);
            expect(gamification.challenges.get(challengeId).completed).toBe(true);
            expect(gamification.points).toBe(100); // Challenge reward
        });

        test('should get gamification stats', () => {
            gamification.points = 500;
            gamification.level = 2;
            gamification.achievements.set('Test', { name: 'Test', description: 'Test' });

            const stats = gamification.getStats();

            expect(stats.level).toBe(2);
            expect(stats.points).toBe(500);
            expect(stats.achievements).toHaveLength(1);
            expect(stats.badges).toEqual([]);
        });
    });

    describe('Gas Optimizer', () => {
        let gasOptimizer;

        beforeEach(() => {
            gasOptimizer = new GasOptimizer();
        });

        test('should create gas optimizer', () => {
            expect(gasOptimizer.gasHistory).toEqual([]);
            expect(gasOptimizer.optimalGasPrice).toBe(0);
            expect(gasOptimizer.networkCongestion).toBe(0);
        });

        test('should optimize gas price', async() => {
            const optimalPrice = await gasOptimizer.optimizeGasPrice();

            expect(optimalPrice).toBeGreaterThan(0);
            expect(gasOptimizer.optimalGasPrice).toBe(optimalPrice);
            expect(gasOptimizer.gasHistory).toHaveLength(1);
        });

        test('should maintain gas history limit', async() => {
            // Add 101 records
            for (let i = 0; i < 101; i++) {
                await gasOptimizer.optimizeGasPrice();
            }

            expect(gasOptimizer.gasHistory).toHaveLength(100);
        });

        test('should get gas stats', async() => {
            await gasOptimizer.optimizeGasPrice();
            await gasOptimizer.optimizeGasPrice();

            const stats = gasOptimizer.getGasStats();

            expect(stats.currentOptimalGasPrice).toBeGreaterThan(0);
            expect(stats.averageGasPrice).toBeGreaterThan(0);
            expect(stats.averageOptimalGasPrice).toBeGreaterThan(0);
            expect(stats.totalRecords).toBe(2);
        });

        test('should handle gas optimization errors', async() => {
            // Mock getCurrentGasPrice to throw error
            gasOptimizer.getCurrentGasPrice = jest.fn().mockRejectedValue(new Error('Network error'));

            const result = await gasOptimizer.optimizeGasPrice();

            expect(result).toBe(0);
        });
    });

    describe('Monitoring System', () => {
        let monitoringSystem;

        beforeEach(() => {
            monitoringSystem = new MonitoringSystem();
        });

        test('should create monitoring system', () => {
            expect(monitoringSystem.metrics.size).toBe(0);
            expect(monitoringSystem.alerts).toEqual([]);
            expect(monitoringSystem.performanceHistory).toEqual([]);
        });

        test('should track performance', async() => {
            const trade = {
                id: 'trade_1',
                profit: 0.1,
                gasUsed: 100000,
                slippage: 0.01,
                executionTime: 1000,
                success: true
            };

            await monitoringSystem.trackPerformance(trade);

            expect(monitoringSystem.metrics.has('trade_1')).toBe(true);
            expect(monitoringSystem.performanceHistory).toHaveLength(1);
        });

        test('should send alerts for large losses', async() => {
            const trade = {
                id: 'trade_1',
                profit: -0.2,
                gasUsed: 100000,
                slippage: 0.01,
                executionTime: 1000,
                success: true
            };

            await monitoringSystem.trackPerformance(trade);

            expect(monitoringSystem.alerts).toHaveLength(1);
            expect(monitoringSystem.alerts[0].type).toBe('LOSS_ALERT');
        });

        test('should send alerts for high gas usage', async() => {
            const trade = {
                id: 'trade_1',
                profit: 0.1,
                gasUsed: 600000,
                slippage: 0.01,
                executionTime: 1000,
                success: true
            };

            await monitoringSystem.trackPerformance(trade);

            expect(monitoringSystem.alerts).toHaveLength(1);
            expect(monitoringSystem.alerts[0].type).toBe('HIGH_GAS');
        });

        test('should send alerts for high slippage', async() => {
            const trade = {
                id: 'trade_1',
                profit: 0.1,
                gasUsed: 100000,
                slippage: 0.06,
                executionTime: 1000,
                success: true
            };

            await monitoringSystem.trackPerformance(trade);

            expect(monitoringSystem.alerts).toHaveLength(1);
            expect(monitoringSystem.alerts[0].type).toBe('HIGH_SLIPPAGE');
        });

        test('should send alerts for trade failures', async() => {
            const trade = {
                id: 'trade_1',
                profit: 0.1,
                gasUsed: 100000,
                slippage: 0.01,
                executionTime: 1000,
                success: false
            };

            await monitoringSystem.trackPerformance(trade);

            expect(monitoringSystem.alerts).toHaveLength(1);
            expect(monitoringSystem.alerts[0].type).toBe('TRADE_FAILURE');
        });

        test('should get alert severity', () => {
            expect(monitoringSystem.getAlertSeverity('LOSS_ALERT')).toBe('HIGH');
            expect(monitoringSystem.getAlertSeverity('HIGH_GAS')).toBe('MEDIUM');
            expect(monitoringSystem.getAlertSeverity('UNKNOWN')).toBe('LOW');
        });

        test('should maintain performance history limit', async() => {
            // Add 1001 records
            for (let i = 0; i < 1001; i++) {
                await monitoringSystem.trackPerformance({
                    id: `trade_${i}`,
                    profit: 0.1,
                    gasUsed: 100000,
                    slippage: 0.01,
                    executionTime: 1000,
                    success: true
                });
            }

            expect(monitoringSystem.performanceHistory).toHaveLength(1000);
        });

        test('should generate performance report', async() => {
            // Add some performance data
            await monitoringSystem.trackPerformance({
                id: 'trade_1',
                profit: 0.1,
                gasUsed: 100000,
                slippage: 0.01,
                executionTime: 1000,
                success: true
            });

            await monitoringSystem.trackPerformance({
                id: 'trade_2',
                profit: -0.05,
                gasUsed: 150000,
                slippage: 0.02,
                executionTime: 1500,
                success: false
            });

            const report = monitoringSystem.getPerformanceReport();

            expect(report.totalTrades).toBe(2);
            expect(report.successfulTrades).toBe(1);
            expect(report.successRate).toBe(50);
            expect(report.totalProfit).toBe(0.05);
            expect(report.averageProfit).toBe(0.025);
            expect(report.averageGasUsed).toBe(125000);
            expect(report.averageSlippage).toBe(0.015);
        });

        test('should return empty report when no data', () => {
            const report = monitoringSystem.getPerformanceReport();

            expect(report.message).toBe('No performance data available');
        });
    });

    describe('Integration Tests', () => {
        test('should integrate DCA bot with risk manager', async() => {
            const dcaBot = new DCABot('0x123', '0.1', 1000, mockBot);
            const riskManager = new RiskManager(mockBot);

            mockBot.buyToken.mockResolvedValue({
                success: true,
                txHash: '0xabc123'
            });

            // Start DCA bot
            const startPromise = dcaBot.startDCA();
            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            // Add position to risk manager
            riskManager.addPosition('0x123', 100, 0.001);

            // Check risk
            const riskReport = riskManager.getRiskReport();
            expect(riskReport.totalPositions).toBe(1);

            await dcaBot.stopDCA();
        });

        test('should integrate technical analysis with AI advisor', async() => {
            const technicalAnalysis = new TechnicalAnalysis();
            const aiAdvisor = new AITradingAdvisor();

            // Add price history
            for (let i = 1; i <= 25; i++) {
                technicalAnalysis.updatePriceHistory('0x123', i * 0.001);
            }

            // Analyze market
            const recommendation = await aiAdvisor.analyzeMarket('0x123');

            expect(recommendation.action).toMatch(/^(BUY|SELL|HOLD)$/);
            expect(recommendation.technical).toBeDefined();
        });

        test('should integrate social trading with gamification', () => {
            const socialTrading = new SocialTradingSystem();
            const gamification = new GamificationSystem();

            // Update trader performance
            socialTrading.updateTraderPerformance('0x123', { profit: 100 });

            // Check achievements
            gamification.checkAchievements({ profit: 100 });

            expect(socialTrading.getLeaderboard()).toHaveLength(1);
            expect(gamification.points).toBe(60); // 10 for profit + 50 for achievement
        });
    });

    describe('Error Handling Tests', () => {
        test('should handle network errors gracefully', async() => {
            const dcaBot = new DCABot('0x123', '0.1', 1000, mockBot);

            mockBot.buyToken.mockRejectedValue(new Error('Network error'));

            const startPromise = dcaBot.startDCA();
            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            // Should continue running despite errors
            expect(dcaBot.isRunning).toBe(true);

            await dcaBot.stopDCA();
        });

        test('should handle invalid parameters', () => {
            expect(() => {
                new DCABot('', '0.1', 1000, mockBot);
            }).not.toThrow();

            expect(() => {
                new GridTradingBot('0x123', 0, 2, mockBot);
            }).not.toThrow();
        });

        test('should handle empty data in technical analysis', () => {
            const technicalAnalysis = new TechnicalAnalysis();

            expect(() => {
                technicalAnalysis.calculateSMA([], 5);
            }).toThrow('Insufficient data for SMA calculation');

            expect(() => {
                technicalAnalysis.calculateRSI([1, 2], 14);
            }).toThrow('Insufficient data for RSI calculation');
        });
    });

    describe('Performance Tests', () => {
        test('should handle multiple concurrent operations', async() => {
            const dcaBot = new DCABot('0x123', '0.1', 1000, mockBot);
            const gridBot = new GridTradingBot('0x456', 5, 2, mockBot);
            const arbitrageBot = new ArbitrageBot(mockBot);

            mockBot.buyToken.mockResolvedValue({
                success: true,
                txHash: '0xabc123'
            });

            const startTime = Date.now();

            // Start all bots concurrently
            const promises = [
                dcaBot.startDCA(),
                gridBot.startGridTrading(),
                arbitrageBot.startArbitrage()
            ];

            // Let them run for a bit
            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            // Stop all bots
            await dcaBot.stopDCA();
            await gridBot.stopGridTrading();
            await arbitrageBot.stopArbitrage();

            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(1000);
        });

        test('should handle large datasets efficiently', () => {
            const technicalAnalysis = new TechnicalAnalysis();

            // Add 1000 price points
            for (let i = 0; i < 1000; i++) {
                technicalAnalysis.updatePriceHistory('0x123', Math.random() * 0.01);
            }

            const startTime = Date.now();
            const signal = technicalAnalysis.generateTradingSignal(
                technicalAnalysis.getPriceHistory('0x123')
            );
            const endTime = Date.now();

            expect(signal).toBeDefined();
            expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
        });
    });
});