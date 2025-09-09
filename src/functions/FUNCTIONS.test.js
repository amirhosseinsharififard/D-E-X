/**
 * Test Suite for DEX Trading Bot Core Functions
 * 
 * This file contains comprehensive tests for all functions implemented in FUNCTIONS.js
 */

const { ethers } = require('ethers');
const {
    testConnection,
    createTradingBot,
    startBot,
    stopBot,
    getBalance,
    getWalletStatus,
    displayWalletInfo,
    createContractManager,
    getContract,
    getTokenContract,
    getRouterContract,
    buyTokenWithETH,
    sellTokenForETH,
    registerCommands,
    executeCommand,
    displayHelp,
    approveTokenSpending,
    checkTokenAllowance,
    openPosition,
    displayPositions,
    closePosition,
    updateStopLoss,
    updateTakeProfit,
    startPositionMonitoring,
    stopPositionMonitoring,
    checkAllPositions,
    formatError,
    isValidAddress,
    isValidAmount,
    DEXTradingBot,
    ADDRESSES
} = require('./FUNCTIONS');

// Mock ethers for testing
jest.mock('ethers');

describe('DEX Trading Bot Core Functions', () => {
    let mockProvider;
    let mockWallet;
    let mockConfig;
    let bot;

    beforeEach(() => {
        // Setup mocks
        mockProvider = {
            getNetwork: jest.fn(),
            getBalance: jest.fn()
        };

        mockWallet = {
            address: '0x1234567890123456789012345678901234567890'
        };

        mockConfig = {
            rpcUrl: 'http://localhost:8545',
            privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
            routerAddress: ADDRESSES.ROUTER,
            wethAddress: ADDRESSES.WETH
        };

        bot = createTradingBot(mockProvider, mockWallet, mockConfig);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Connection and Setup', () => {
        test('testConnection should return success with valid connection', async () => {
            const mockNetwork = { name: 'localhost', chainId: 31337 };
            const mockBalance = ethers.parseEther('1.0');

            mockProvider.getNetwork.mockResolvedValue(mockNetwork);
            mockProvider.getBalance.mockResolvedValue(mockBalance);

            const result = await testConnection(mockProvider, mockWallet);

            expect(result.success).toBe(true);
            expect(result.network).toBe('localhost');
            expect(result.chainId).toBe(31337);
            expect(result.walletAddress).toBe(mockWallet.address);
            expect(result.balance).toBe('1.0');
        });

        test('testConnection should handle connection errors', async () => {
            mockProvider.getNetwork.mockRejectedValue(new Error('Network error'));

            const result = await testConnection(mockProvider, mockWallet);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Network error');
        });

        test('createTradingBot should create bot with correct structure', () => {
            expect(bot).toBeDefined();
            expect(bot.provider).toBe(mockProvider);
            expect(bot.wallet).toBe(mockWallet);
            expect(bot.config).toBe(mockConfig);
            expect(bot.isRunning).toBe(false);
            expect(bot.contractManager).toBeDefined();
            expect(bot.commandManager).toBeInstanceOf(Map);
            expect(bot.activeTrades).toBeInstanceOf(Map);
            expect(bot.positions).toBeInstanceOf(Map);
            expect(bot.tokensRegistry).toBeInstanceOf(Map);
        });

        test('startBot should set isRunning to true', () => {
            startBot(bot);
            expect(bot.isRunning).toBe(true);
        });

        test('stopBot should set isRunning to false', () => {
            bot.isRunning = true;
            stopBot(bot);
            expect(bot.isRunning).toBe(false);
        });
    });

    describe('Wallet Management', () => {
        test('getBalance should return formatted balance', async () => {
            const mockBalance = ethers.parseEther('2.5');
            mockProvider.getBalance.mockResolvedValue(mockBalance);

            const result = await getBalance(bot);

            expect(result).toBe('2.5 ETH');
            expect(mockProvider.getBalance).toHaveBeenCalledWith(mockWallet.address);
        });

        test('getBalance should handle errors', async () => {
            mockProvider.getBalance.mockRejectedValue(new Error('Balance error'));

            const result = await getBalance(bot);

            expect(result).toBe('Error getting balance');
        });

        test('getWalletStatus should return complete status', async () => {
            const mockNetwork = { name: 'localhost', chainId: 31337 };
            const mockBalance = ethers.parseEther('1.0');

            mockProvider.getNetwork.mockResolvedValue(mockNetwork);
            mockProvider.getBalance.mockResolvedValue(mockBalance);

            const result = await getWalletStatus(bot);

            expect(result.address).toBe(mockWallet.address);
            expect(result.balance).toBe('1.0 ETH');
            expect(result.network).toBe('localhost');
            expect(result.chainId).toBe(31337);
            expect(result.isRunning).toBe(false);
            expect(result.activeTrades).toBe(0);
            expect(result.openPositions).toBe(0);
        });

        test('displayWalletInfo should log wallet information', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const mockNetwork = { name: 'localhost', chainId: 31337 };
            const mockBalance = ethers.parseEther('1.0');

            mockProvider.getNetwork.mockResolvedValue(mockNetwork);
            mockProvider.getBalance.mockResolvedValue(mockBalance);

            await displayWalletInfo(bot);

            expect(consoleSpy).toHaveBeenCalledWith('\n📊 Wallet Information:');
            expect(consoleSpy).toHaveBeenCalledWith(`📍 Address: ${mockWallet.address}`);
            expect(consoleSpy).toHaveBeenCalledWith('💰 Balance: 1.0 ETH');

            consoleSpy.mockRestore();
        });
    });

    describe('Contract Management', () => {
        test('createContractManager should create manager with correct structure', () => {
            const contractManager = createContractManager(mockProvider, mockWallet);

            expect(contractManager.provider).toBe(mockProvider);
            expect(contractManager.wallet).toBe(mockWallet);
            expect(contractManager.contracts).toBeInstanceOf(Map);
            expect(typeof contractManager.getContract).toBe('function');
            expect(typeof contractManager.getTokenContract).toBe('function');
            expect(typeof contractManager.getRouterContract).toBe('function');
        });

        test('getContract should create and cache contract', async () => {
            const contractManager = createContractManager(mockProvider, mockWallet);
            const mockContract = { address: '0x123' };
            
            // Mock ethers.Contract constructor
            const ContractSpy = jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract);

            const result = await contractManager.getContract('0x123', ['function test()']);

            expect(ContractSpy).toHaveBeenCalledWith('0x123', ['function test()'], mockWallet);
            expect(result).toBe(mockContract);
            expect(contractManager.contracts.get('0x123')).toBe(mockContract);

            ContractSpy.mockRestore();
        });

        test('getTokenContract should create ERC20 contract', async () => {
            const contractManager = createContractManager(mockProvider, mockWallet);
            const mockContract = { address: '0x123' };
            
            const ContractSpy = jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract);

            const result = await contractManager.getTokenContract('0x123');

            expect(ContractSpy).toHaveBeenCalledWith('0x123', expect.any(Array), mockWallet);
            expect(result).toBe(mockContract);

            ContractSpy.mockRestore();
        });

        test('getRouterContract should create router contract', async () => {
            const contractManager = createContractManager(mockProvider, mockWallet);
            const mockContract = { address: ADDRESSES.ROUTER };
            
            const ContractSpy = jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract);

            const result = await contractManager.getRouterContract();

            expect(ContractSpy).toHaveBeenCalledWith(ADDRESSES.ROUTER, expect.any(Array), mockWallet);
            expect(result).toBe(mockContract);

            ContractSpy.mockRestore();
        });
    });

    describe('Trading Functions', () => {
        let mockRouter;
        let mockTokenContract;

        beforeEach(() => {
            mockRouter = {
                getAmountsOut: jest.fn(),
                swapExactETHForTokens: jest.fn(),
                swapExactTokensForETH: jest.fn()
            };

            mockTokenContract = {
                balanceOf: jest.fn(),
                allowance: jest.fn(),
                approve: jest.fn()
            };

            // Mock contract creation
            jest.spyOn(ethers, 'Contract').mockImplementation((address, abi, wallet) => {
                if (address === ADDRESSES.ROUTER) return mockRouter;
                if (abi.includes('balanceOf')) return mockTokenContract;
                return {};
            });
        });

        test('buyTokenWithETH should execute successful buy transaction', async () => {
            const mockAmounts = [ethers.parseEther('0.1'), ethers.parseEther('100')];
            const mockTx = { hash: '0xabc123', wait: jest.fn() };
            const mockReceipt = { blockNumber: 12345 };

            mockRouter.getAmountsOut.mockResolvedValue(mockAmounts);
            mockRouter.swapExactETHForTokens.mockResolvedValue(mockTx);
            mockTx.wait.mockResolvedValue(mockReceipt);

            const result = await buyTokenWithETH(bot, '0x123', '0.1');

            expect(result.success).toBe(true);
            expect(result.txHash).toBe('0xabc123');
            expect(result.blockNumber).toBe(12345);
            expect(result.tradeId).toBeDefined();
            expect(bot.activeTrades.has(result.tradeId)).toBe(true);
        });

        test('buyTokenWithETH should handle transaction errors', async () => {
            mockRouter.getAmountsOut.mockRejectedValue(new Error('Transaction failed'));

            const result = await buyTokenWithETH(bot, '0x123', '0.1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Transaction failed');
        });

        test('sellTokenForETH should execute successful sell transaction', async () => {
            const mockAmounts = [ethers.parseEther('100'), ethers.parseEther('0.1')];
            const mockTx = { hash: '0xdef456', wait: jest.fn() };
            const mockReceipt = { blockNumber: 12346 };
            const mockApproveTx = { wait: jest.fn() };

            mockTokenContract.balanceOf.mockResolvedValue(ethers.parseEther('100'));
            mockTokenContract.allowance.mockResolvedValue(0);
            mockTokenContract.approve.mockResolvedValue(mockApproveTx);
            mockApproveTx.wait.mockResolvedValue({});
            mockRouter.getAmountsOut.mockResolvedValue(mockAmounts);
            mockRouter.swapExactTokensForETH.mockResolvedValue(mockTx);
            mockTx.wait.mockResolvedValue(mockReceipt);

            const result = await sellTokenForETH(bot, '0x123', '100');

            expect(result.success).toBe(true);
            expect(result.txHash).toBe('0xdef456');
            expect(result.blockNumber).toBe(12346);
            expect(result.tradeId).toBeDefined();
            expect(bot.activeTrades.has(result.tradeId)).toBe(true);
        });

        test('sellTokenForETH should handle insufficient balance', async () => {
            mockTokenContract.balanceOf.mockResolvedValue(ethers.parseEther('50'));

            const result = await sellTokenForETH(bot, '0x123', '100');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Insufficient token balance');
        });
    });

    describe('Command System', () => {
        test('registerCommands should register all commands', () => {
            expect(bot.commandManager.has('balance')).toBe(true);
            expect(bot.commandManager.has('status')).toBe(true);
            expect(bot.commandManager.has('help')).toBe(true);
            expect(bot.commandManager.has('buy')).toBe(true);
            expect(bot.commandManager.has('sell')).toBe(true);
            expect(bot.commandManager.has('approve')).toBe(true);
            expect(bot.commandManager.has('allowance')).toBe(true);
            expect(bot.commandManager.has('openposition')).toBe(true);
            expect(bot.commandManager.has('positions')).toBe(true);
            expect(bot.commandManager.has('closeposition')).toBe(true);
            expect(bot.commandManager.has('startmonitoring')).toBe(true);
            expect(bot.commandManager.has('stopmonitoring')).toBe(true);
            expect(bot.commandManager.has('updatestop')).toBe(true);
            expect(bot.commandManager.has('updatetarget')).toBe(true);
        });

        test('executeCommand should execute valid commands', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            mockProvider.getBalance.mockResolvedValue(ethers.parseEther('1.0'));

            const result = await executeCommand('balance', bot);

            expect(result).toBe('1.0 ETH');
            expect(consoleSpy).toHaveBeenCalledWith('💰 Balance: 1.0 ETH');

            consoleSpy.mockRestore();
        });

        test('executeCommand should handle unknown commands', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = await executeCommand('unknown', bot);

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('❌ Unknown command: unknown');

            consoleSpy.mockRestore();
        });

        test('executeCommand should handle command errors', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            mockProvider.getBalance.mockRejectedValue(new Error('Network error'));

            const result = await executeCommand('balance', bot);

            expect(result).toBe('Error getting balance');
            expect(consoleSpy).toHaveBeenCalledWith('❌ Error executing command balance: Network error');

            consoleSpy.mockRestore();
        });

        test('displayHelp should show help information', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            displayHelp();

            expect(consoleSpy).toHaveBeenCalledWith('\n📚 Available Commands:');
            expect(consoleSpy).toHaveBeenCalledWith('  balance          - Get wallet ETH balance');

            consoleSpy.mockRestore();
        });
    });

    describe('Token Management', () => {
        let mockTokenContract;

        beforeEach(() => {
            mockTokenContract = {
                approve: jest.fn(),
                allowance: jest.fn()
            };

            jest.spyOn(ethers, 'Contract').mockImplementation(() => mockTokenContract);
        });

        test('approveTokenSpending should execute approval', async () => {
            const mockTx = { hash: '0xapprove123', wait: jest.fn() };
            const mockReceipt = { blockNumber: 12347 };

            mockTokenContract.approve.mockResolvedValue(mockTx);
            mockTx.wait.mockResolvedValue(mockReceipt);

            const result = await approveTokenSpending(bot, '0x123', '1000');

            expect(result.success).toBe(true);
            expect(result.txHash).toBe('0xapprove123');
            expect(result.blockNumber).toBe(12347);
        });

        test('approveTokenSpending should handle errors', async () => {
            mockTokenContract.approve.mockRejectedValue(new Error('Approval failed'));

            const result = await approveTokenSpending(bot, '0x123', '1000');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Approval failed');
        });

        test('checkTokenAllowance should return allowance', async () => {
            const mockAllowance = ethers.parseEther('1000');
            mockTokenContract.allowance.mockResolvedValue(mockAllowance);

            const result = await checkTokenAllowance(bot, '0x123');

            expect(result.success).toBe(true);
            expect(result.allowance).toBe('1000.0');
            expect(result.allowanceRaw).toBe(mockAllowance.toString());
        });

        test('checkTokenAllowance should handle errors', async () => {
            mockTokenContract.allowance.mockRejectedValue(new Error('Allowance check failed'));

            const result = await checkTokenAllowance(bot, '0x123');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Allowance check failed');
        });
    });

    describe('Position Management', () => {
        beforeEach(() => {
            // Mock trading functions
            jest.spyOn(require('./FUNCTIONS'), 'buyTokenWithETH').mockResolvedValue({
                success: true,
                txHash: '0xbuy123',
                blockNumber: 12348
            });
            jest.spyOn(require('./FUNCTIONS'), 'sellTokenForETH').mockResolvedValue({
                success: true,
                txHash: '0xsell123',
                blockNumber: 12349
            });
        });

        test('openPosition should create long position', async () => {
            const result = await openPosition(bot, '0x123', '0.1', 'long', '0.05', '0.15', '24');

            expect(result.success).toBe(true);
            expect(result.positionId).toBeDefined();
            expect(result.position.type).toBe('long');
            expect(result.position.tokenAddress).toBe('0x123');
            expect(result.position.amount).toBe('0.1');
            expect(result.position.stopLoss).toBe(0.05);
            expect(result.position.takeProfit).toBe(0.15);
            expect(result.position.maxHoldTime).toBe(24);
            expect(bot.positions.has(result.positionId)).toBe(true);
        });

        test('openPosition should create short position', async () => {
            const result = await openPosition(bot, '0x123', '100', 'short', '0.05', '0.15', '12');

            expect(result.success).toBe(true);
            expect(result.position.type).toBe('short');
            expect(result.position.amount).toBe('100');
            expect(result.position.maxHoldTime).toBe(12);
        });

        test('openPosition should handle trade failures', async () => {
            jest.spyOn(require('./FUNCTIONS'), 'buyTokenWithETH').mockResolvedValue({
                success: false,
                error: 'Trade failed'
            });

            const result = await openPosition(bot, '0x123', '0.1', 'long', '0.05', '0.15', '24');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Trade failed');
        });

        test('displayPositions should show open positions', async () => {
            // Add a test position
            const positionId = 'pos_123';
            bot.positions.set(positionId, {
                id: positionId,
                type: 'long',
                tokenAddress: '0x123',
                amount: '0.1',
                stopLoss: 0.05,
                takeProfit: 0.15,
                maxHoldTime: 24,
                timestamp: new Date().toISOString(),
                status: 'open'
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = await displayPositions(bot);

            expect(result.positions).toHaveLength(1);
            expect(consoleSpy).toHaveBeenCalledWith('\n📊 Open Positions:');
            expect(consoleSpy).toHaveBeenCalledWith(`ID: ${positionId}`);

            consoleSpy.mockRestore();
        });

        test('displayPositions should handle no positions', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = await displayPositions(bot);

            expect(result.positions).toHaveLength(0);
            expect(consoleSpy).toHaveBeenCalledWith('📊 No open positions');

            consoleSpy.mockRestore();
        });

        test('closePosition should close existing position', async () => {
            const positionId = 'pos_123';
            bot.positions.set(positionId, {
                id: positionId,
                type: 'long',
                tokenAddress: '0x123',
                amount: '0.1',
                stopLoss: 0.05,
                takeProfit: 0.15,
                maxHoldTime: 24,
                timestamp: new Date().toISOString(),
                status: 'open'
            });

            const result = await closePosition(bot, positionId);

            expect(result.success).toBe(true);
            expect(result.positionId).toBe(positionId);
            expect(bot.positions.get(positionId).status).toBe('closed');
            expect(bot.positions.get(positionId).closeTxHash).toBe('0xsell123');
        });

        test('closePosition should handle non-existent position', async () => {
            const result = await closePosition(bot, 'nonexistent');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Position not found');
        });

        test('updateStopLoss should update stop loss', async () => {
            const positionId = 'pos_123';
            bot.positions.set(positionId, {
                id: positionId,
                type: 'long',
                tokenAddress: '0x123',
                amount: '0.1',
                stopLoss: 0.05,
                takeProfit: 0.15,
                maxHoldTime: 24,
                timestamp: new Date().toISOString(),
                status: 'open'
            });

            const result = await updateStopLoss(bot, positionId, '0.08');

            expect(result.success).toBe(true);
            expect(result.positionId).toBe(positionId);
            expect(result.newStopLoss).toBe('0.08');
            expect(bot.positions.get(positionId).stopLoss).toBe(0.08);
        });

        test('updateTakeProfit should update take profit', async () => {
            const positionId = 'pos_123';
            bot.positions.set(positionId, {
                id: positionId,
                type: 'long',
                tokenAddress: '0x123',
                amount: '0.1',
                stopLoss: 0.05,
                takeProfit: 0.15,
                maxHoldTime: 24,
                timestamp: new Date().toISOString(),
                status: 'open'
            });

            const result = await updateTakeProfit(bot, positionId, '0.20');

            expect(result.success).toBe(true);
            expect(result.positionId).toBe(positionId);
            expect(result.newTakeProfit).toBe('0.20');
            expect(bot.positions.get(positionId).takeProfit).toBe(0.20);
        });
    });

    describe('Position Monitoring', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('startPositionMonitoring should start monitoring', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            startPositionMonitoring(bot);

            expect(consoleSpy).toHaveBeenCalledWith('👁️ Starting position monitoring...');

            consoleSpy.mockRestore();
        });

        test('stopPositionMonitoring should stop monitoring', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            startPositionMonitoring(bot);
            stopPositionMonitoring(bot);

            expect(consoleSpy).toHaveBeenCalledWith('🛑 Position monitoring stopped');

            consoleSpy.mockRestore();
        });

        test('checkAllPositions should check time-based exits', async () => {
            const positionId = 'pos_123';
            const oldTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
            
            bot.positions.set(positionId, {
                id: positionId,
                type: 'long',
                tokenAddress: '0x123',
                amount: '0.1',
                stopLoss: 0.05,
                takeProfit: 0.15,
                maxHoldTime: 24,
                timestamp: oldTimestamp,
                status: 'open'
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await checkAllPositions(bot);

            expect(consoleSpy).toHaveBeenCalledWith(`⏰ Time exit triggered for position ${positionId}`);

            consoleSpy.mockRestore();
        });
    });

    describe('Utility Functions', () => {
        test('formatError should format common errors', () => {
            expect(formatError({ code: 'INSUFFICIENT_FUNDS' })).toBe('Insufficient funds for transaction');
            expect(formatError({ code: 'UNPREDICTABLE_GAS_LIMIT' })).toBe('Transaction would fail - check parameters');
            expect(formatError({ code: 'NETWORK_ERROR' })).toBe('Network connection error');
            expect(formatError({ message: 'Custom error' })).toBe('Custom error');
        });

        test('isValidAddress should validate Ethereum addresses', () => {
            expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
            expect(isValidAddress('0x123')).toBe(false);
            expect(isValidAddress('invalid')).toBe(false);
            expect(isValidAddress('')).toBe(false);
        });

        test('isValidAmount should validate amounts', () => {
            expect(isValidAmount('1.0')).toBe(true);
            expect(isValidAmount('0.001')).toBe(true);
            expect(isValidAmount('100')).toBe(true);
            expect(isValidAmount('0')).toBe(false);
            expect(isValidAmount('-1')).toBe(false);
            expect(isValidAmount('invalid')).toBe(false);
            expect(isValidAmount('')).toBe(false);
        });
    });

    describe('DEXTradingBot Class', () => {
        test('should create bot instance', () => {
            const tradingBot = new DEXTradingBot(mockProvider, mockWallet, mockConfig);

            expect(tradingBot.bot).toBeDefined();
            expect(tradingBot.bot.provider).toBe(mockProvider);
            expect(tradingBot.bot.wallet).toBe(mockWallet);
        });

        test('should start and stop bot', () => {
            const tradingBot = new DEXTradingBot(mockProvider, mockWallet, mockConfig);

            tradingBot.start();
            expect(tradingBot.bot.isRunning).toBe(true);

            tradingBot.stop();
            expect(tradingBot.bot.isRunning).toBe(false);
        });

        test('should execute commands', async () => {
            const tradingBot = new DEXTradingBot(mockProvider, mockWallet, mockConfig);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            mockProvider.getBalance.mockResolvedValue(ethers.parseEther('1.0'));

            const result = await tradingBot.executeCommand('balance');

            expect(result).toBe('1.0 ETH');

            consoleSpy.mockRestore();
        });

        test('should get status and balance', async () => {
            const tradingBot = new DEXTradingBot(mockProvider, mockWallet, mockConfig);
            const mockNetwork = { name: 'localhost', chainId: 31337 };
            const mockBalance = ethers.parseEther('1.0');

            mockProvider.getNetwork.mockResolvedValue(mockNetwork);
            mockProvider.getBalance.mockResolvedValue(mockBalance);

            const status = await tradingBot.getStatus();
            const balance = await tradingBot.getBalance();

            expect(status.address).toBe(mockWallet.address);
            expect(balance).toBe('1.0 ETH');
        });

        test('should buy and sell tokens', async () => {
            const tradingBot = new DEXTradingBot(mockProvider, mockWallet, mockConfig);
            
            // Mock trading functions
            jest.spyOn(require('./FUNCTIONS'), 'buyTokenWithETH').mockResolvedValue({
                success: true,
                txHash: '0xbuy123'
            });
            jest.spyOn(require('./FUNCTIONS'), 'sellTokenForETH').mockResolvedValue({
                success: true,
                txHash: '0xsell123'
            });

            const buyResult = await tradingBot.buyToken('0x123', '0.1');
            const sellResult = await tradingBot.sellToken('0x123', '100');

            expect(buyResult.success).toBe(true);
            expect(buyResult.txHash).toBe('0xbuy123');
            expect(sellResult.success).toBe(true);
            expect(sellResult.txHash).toBe('0xsell123');
        });
    });

    describe('Constants', () => {
        test('ADDRESSES should contain correct contract addresses', () => {
            expect(ADDRESSES.ROUTER).toBe('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D');
            expect(ADDRESSES.WETH).toBe('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
            expect(ADDRESSES.USDC).toBe('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
            expect(ADDRESSES.TEST_TOKEN).toBe('0x5FbDB2315678afecb367f032d93F642f64180aa3');
        });
    });

    describe('Integration Tests', () => {
        test('should handle complete trading workflow', async () => {
            // Mock all dependencies
            const mockNetwork = { name: 'localhost', chainId: 31337 };
            const mockBalance = ethers.parseEther('1.0');
            const mockAmounts = [ethers.parseEther('0.1'), ethers.parseEther('100')];
            const mockTx = { hash: '0xworkflow123', wait: jest.fn() };
            const mockReceipt = { blockNumber: 12350 };

            mockProvider.getNetwork.mockResolvedValue(mockNetwork);
            mockProvider.getBalance.mockResolvedValue(mockBalance);

            const mockRouter = {
                getAmountsOut: jest.fn().mockResolvedValue(mockAmounts),
                swapExactETHForTokens: jest.fn().mockResolvedValue(mockTx)
            };
            mockTx.wait.mockResolvedValue(mockReceipt);

            jest.spyOn(ethers, 'Contract').mockImplementation((address, abi, wallet) => {
                if (address === ADDRESSES.ROUTER) return mockRouter;
                return {};
            });

            // Test complete workflow
            const tradingBot = new DEXTradingBot(mockProvider, mockWallet, mockConfig);
            
            // Start bot
            await tradingBot.start();
            expect(tradingBot.bot.isRunning).toBe(true);

            // Check balance
            const balance = await tradingBot.getBalance();
            expect(balance).toBe('1.0 ETH');

            // Buy token
            const buyResult = await tradingBot.buyToken('0x123', '0.1');
            expect(buyResult.success).toBe(true);

            // Check status
            const status = await tradingBot.getStatus();
            expect(status.activeTrades).toBe(1);

            // Stop bot
            await tradingBot.stop();
            expect(tradingBot.bot.isRunning).toBe(false);
        });
    });
});

// Performance tests
describe('Performance Tests', () => {
    test('should handle multiple concurrent operations', async () => {
        const mockProvider = {
            getNetwork: jest.fn().mockResolvedValue({ name: 'localhost', chainId: 31337 }),
            getBalance: jest.fn().mockResolvedValue(ethers.parseEther('1.0'))
        };

        const mockWallet = {
            address: '0x1234567890123456789012345678901234567890'
        };

        const mockConfig = {
            rpcUrl: 'http://localhost:8545',
            privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
            routerAddress: ADDRESSES.ROUTER,
            wethAddress: ADDRESSES.WETH
        };

        const bot = createTradingBot(mockProvider, mockWallet, mockConfig);

        // Execute multiple operations concurrently
        const operations = [
            getBalance(bot),
            getWalletStatus(bot),
            getBalance(bot),
            getWalletStatus(bot),
            getBalance(bot)
        ];

        const startTime = Date.now();
        const results = await Promise.all(operations);
        const endTime = Date.now();

        expect(results).toHaveLength(5);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle large number of positions', () => {
        const mockProvider = { getNetwork: jest.fn(), getBalance: jest.fn() };
        const mockWallet = { address: '0x123' };
        const mockConfig = { rpcUrl: 'http://localhost:8545' };

        const bot = createTradingBot(mockProvider, mockWallet, mockConfig);

        // Add 1000 positions
        for (let i = 0; i < 1000; i++) {
            const positionId = `pos_${i}`;
            bot.positions.set(positionId, {
                id: positionId,
                type: 'long',
                tokenAddress: '0x123',
                amount: '0.1',
                stopLoss: 0.05,
                takeProfit: 0.15,
                maxHoldTime: 24,
                timestamp: new Date().toISOString(),
                status: 'open'
            });
        }

        expect(bot.positions.size).toBe(1000);

        // Test position retrieval
        const openPositions = Array.from(bot.positions.values()).filter(p => p.status === 'open');
        expect(openPositions).toHaveLength(1000);
    });
});

// Error handling tests
describe('Error Handling Tests', () => {
    test('should handle network disconnection gracefully', async () => {
        const mockProvider = {
            getNetwork: jest.fn().mockRejectedValue(new Error('Network disconnected')),
            getBalance: jest.fn().mockRejectedValue(new Error('Network disconnected'))
        };

        const mockWallet = { address: '0x123' };
        const mockConfig = { rpcUrl: 'http://localhost:8545' };

        const bot = createTradingBot(mockProvider, mockWallet, mockConfig);

        const result = await testConnection(mockProvider, mockWallet);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Network disconnected');

        const balance = await getBalance(bot);
        expect(balance).toBe('Error getting balance');
    });

    test('should handle invalid parameters gracefully', async () => {
        const mockProvider = { getNetwork: jest.fn(), getBalance: jest.fn() };
        const mockWallet = { address: '0x123' };
        const mockConfig = { rpcUrl: 'http://localhost:8545' };

        const bot = createTradingBot(mockProvider, mockWallet, mockConfig);

        // Test with invalid token address
        const result = await buyTokenWithETH(bot, 'invalid_address', '0.1');
        expect(result.success).toBe(false);

        // Test with invalid amount
        const result2 = await buyTokenWithETH(bot, '0x123', 'invalid_amount');
        expect(result2.success).toBe(false);
    });
});
