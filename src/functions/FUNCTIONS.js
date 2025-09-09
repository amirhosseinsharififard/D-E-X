/**
 * DEX Trading Bot - Core Functions Implementation
 * 
 * This file implements all the core functions and capabilities described in FUNCTIONS.md
 * Includes connection management, wallet operations, contract interactions, and trading functions
 */

const { ethers } = require('ethers');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const ADDRESSES = {
    ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Wrapped ETH
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USD Coin
    TEST_TOKEN: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Test token
};

// ERC-20 ABI (simplified)
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
];

// Uniswap V2 Router ABI (simplified)
const ROUTER_ABI = [
    "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)"
];

/**
 * Core System Functions
 */

/**
 * Tests blockchain network connection and displays wallet balance
 * @param {ethers.Provider} provider - Ethereum provider
 * @param {ethers.Wallet} wallet - Ethereum wallet
 * @returns {Promise<Object>} Connection test result
 */
async function testConnection(provider, wallet) {
    try {
        console.log('🔗 Testing blockchain connection...');
        
        // Test network connection
        const network = await provider.getNetwork();
        console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
        
        // Get wallet balance
        const balance = await provider.getBalance(wallet.address);
        const balanceInEth = ethers.formatEther(balance);
        
        console.log(`💰 Wallet Address: ${wallet.address}`);
        console.log(`💰 ETH Balance: ${balanceInEth} ETH`);
        
        return {
            success: true,
            network: network.name,
            chainId: network.chainId,
            walletAddress: wallet.address,
            balance: balanceInEth
        };
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Creates a new trading bot instance
 * @param {ethers.Provider} provider - Ethereum provider
 * @param {ethers.Wallet} wallet - Ethereum wallet
 * @param {Object} config - Bot configuration
 * @returns {Object} Trading bot instance
 */
function createTradingBot(provider, wallet, config) {
    const bot = {
        provider,
        wallet,
        config,
        isRunning: false,
        contractManager: null,
        commandManager: new Map(),
        activeTrades: new Map(),
        positions: new Map(),
        tokensRegistry: new Map()
    };

    // Initialize contract manager
    bot.contractManager = createContractManager(provider, wallet);
    
    // Register commands
    registerCommands(bot);
    
    console.log('🤖 Trading bot created successfully');
    return bot;
}

/**
 * Starts the trading bot
 * @param {Object} bot - Trading bot instance
 */
function startBot(bot) {
    if (bot.isRunning) {
        console.log('⚠️ Bot is already running');
        return;
    }
    
    bot.isRunning = true;
    console.log('🚀 Trading bot started');
    
    // Start monitoring if there are active positions
    if (bot.positions.size > 0) {
        startPositionMonitoring(bot);
    }
}

/**
 * Stops the trading bot
 * @param {Object} bot - Trading bot instance
 */
function stopBot(bot) {
    if (!bot.isRunning) {
        console.log('⚠️ Bot is not running');
        return;
    }
    
    bot.isRunning = false;
    stopPositionMonitoring(bot);
    console.log('🛑 Trading bot stopped');
}

/**
 * Wallet Management Functions
 */

/**
 * Gets wallet ETH balance in formatted string
 * @param {Object} bot - Trading bot instance
 * @returns {Promise<string>} Formatted balance string
 */
async function getBalance(bot) {
    try {
        const balance = await bot.provider.getBalance(bot.wallet.address);
        const balanceInEth = ethers.formatEther(balance);
        return `${balanceInEth} ETH`;
    } catch (error) {
        console.error('❌ Error getting balance:', error.message);
        return 'Error getting balance';
    }
}

/**
 * Gets complete wallet status
 * @param {Object} bot - Trading bot instance
 * @returns {Promise<Object>} Wallet status object
 */
async function getWalletStatus(bot) {
    try {
        const balance = await getBalance(bot);
        const network = await bot.provider.getNetwork();
        
        return {
            address: bot.wallet.address,
            balance: balance,
            network: network.name,
            chainId: network.chainId,
            isRunning: bot.isRunning,
            activeTrades: bot.activeTrades.size,
            openPositions: bot.positions.size
        };
    } catch (error) {
        console.error('❌ Error getting wallet status:', error.message);
        return {
            address: bot.wallet.address,
            balance: 'Error',
            network: 'Unknown',
            chainId: 0,
            isRunning: bot.isRunning,
            activeTrades: 0,
            openPositions: 0
        };
    }
}

/**
 * Displays formatted wallet information
 * @param {Object} bot - Trading bot instance
 */
async function displayWalletInfo(bot) {
    const status = await getWalletStatus(bot);
    
    console.log('\n📊 Wallet Information:');
    console.log('═'.repeat(50));
    console.log(`📍 Address: ${status.address}`);
    console.log(`💰 Balance: ${status.balance}`);
    console.log(`🌐 Network: ${status.network} (${status.chainId})`);
    console.log(`🔄 Status: ${status.isRunning ? 'Running' : 'Stopped'}`);
    console.log(`📈 Active Trades: ${status.activeTrades}`);
    console.log(`🎯 Open Positions: ${status.openPositions}`);
    console.log('═'.repeat(50));
}

/**
 * Contract Management Functions
 */

/**
 * Creates contract manager instance
 * @param {ethers.Provider} provider - Ethereum provider
 * @param {ethers.Wallet} wallet - Ethereum wallet
 * @returns {Object} Contract manager
 */
function createContractManager(provider, wallet) {
    return {
        provider,
        wallet,
        contracts: new Map(),
        
        async getContract(address, abi) {
            const contract = new ethers.Contract(address, abi, wallet);
            this.contracts.set(address, contract);
            return contract;
        },
        
        async getTokenContract(tokenAddress) {
            return await this.getContract(tokenAddress, ERC20_ABI);
        },
        
        async getRouterContract() {
            return await this.getContract(ADDRESSES.ROUTER, ROUTER_ABI);
        }
    };
}

/**
 * Gets contract instance
 * @param {string} address - Contract address
 * @param {Array} abi - Contract ABI
 * @param {Object} contractManager - Contract manager instance
 * @returns {Promise<ethers.Contract>} Contract instance
 */
async function getContract(address, abi, contractManager) {
    return await contractManager.getContract(address, abi);
}

/**
 * Gets ERC-20 token contract
 * @param {string} tokenAddress - Token address
 * @param {Object} contractManager - Contract manager instance
 * @returns {Promise<ethers.Contract>} Token contract
 */
async function getTokenContract(tokenAddress, contractManager) {
    return await contractManager.getTokenContract(tokenAddress);
}

/**
 * Gets Uniswap V2 router contract
 * @param {Object} contractManager - Contract manager instance
 * @returns {Promise<ethers.Contract>} Router contract
 */
async function getRouterContract(contractManager) {
    return await contractManager.getRouterContract();
}

/**
 * Trading Functions
 */

/**
 * Buys token with ETH
 * @param {Object} bot - Trading bot instance
 * @param {string} tokenAddress - Token address
 * @param {string} ethAmount - ETH amount to spend
 * @returns {Promise<Object>} Transaction result
 */
async function buyTokenWithETH(bot, tokenAddress, ethAmount) {
    try {
        console.log(`🛒 Buying token ${tokenAddress} with ${ethAmount} ETH...`);
        
        const router = await getRouterContract(bot.contractManager);
        const wethAddress = ADDRESSES.WETH;
        
        // Calculate minimum amount out (with 5% slippage protection)
        const path = [wethAddress, tokenAddress];
        const amountIn = ethers.parseEther(ethAmount);
        const amounts = await router.getAmountsOut(amountIn, path);
        const amountOutMin = amounts[1] * 95n / 100n; // 5% slippage protection
        
        // Set deadline (3 minutes from now)
        const deadline = Math.floor(Date.now() / 1000) + 180;
        
        // Execute swap
        const tx = await router.swapExactETHForTokens(
            amountOutMin,
            path,
            bot.wallet.address,
            deadline,
            { value: amountIn }
        );
        
        console.log(`📝 Transaction sent: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        
        // Record trade
        const tradeId = `trade_${Date.now()}`;
        bot.activeTrades.set(tradeId, {
            id: tradeId,
            type: 'buy',
            tokenAddress,
            ethAmount,
            txHash: tx.hash,
            timestamp: new Date().toISOString(),
            status: 'completed'
        });
        
        return {
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            tradeId
        };
    } catch (error) {
        console.error('❌ Buy transaction failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Sells token for ETH
 * @param {Object} bot - Trading bot instance
 * @param {string} tokenAddress - Token address
 * @param {string} tokenAmount - Token amount to sell
 * @returns {Promise<Object>} Transaction result
 */
async function sellTokenForETH(bot, tokenAddress, tokenAmount) {
    try {
        console.log(`💸 Selling ${tokenAmount} tokens for ETH...`);
        
        const router = await getRouterContract(bot.contractManager);
        const tokenContract = await getTokenContract(tokenAddress, bot.contractManager);
        const wethAddress = ADDRESSES.WETH;
        
        // Check token balance
        const balance = await tokenContract.balanceOf(bot.wallet.address);
        const amountToSell = ethers.parseUnits(tokenAmount, 18); // Assuming 18 decimals
        
        if (balance < amountToSell) {
            throw new Error('Insufficient token balance');
        }
        
        // Check allowance
        const allowance = await tokenContract.allowance(bot.wallet.address, ADDRESSES.ROUTER);
        if (allowance < amountToSell) {
            console.log('🔓 Approving token spending...');
            const approveTx = await tokenContract.approve(ADDRESSES.ROUTER, amountToSell);
            await approveTx.wait();
        }
        
        // Calculate minimum amount out (with 5% slippage protection)
        const path = [tokenAddress, wethAddress];
        const amounts = await router.getAmountsOut(amountToSell, path);
        const amountOutMin = amounts[1] * 95n / 100n; // 5% slippage protection
        
        // Set deadline (3 minutes from now)
        const deadline = Math.floor(Date.now() / 1000) + 180;
        
        // Execute swap
        const tx = await router.swapExactTokensForETH(
            amountToSell,
            amountOutMin,
            path,
            bot.wallet.address,
            deadline
        );
        
        console.log(`📝 Transaction sent: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        
        // Record trade
        const tradeId = `trade_${Date.now()}`;
        bot.activeTrades.set(tradeId, {
            id: tradeId,
            type: 'sell',
            tokenAddress,
            tokenAmount,
            txHash: tx.hash,
            timestamp: new Date().toISOString(),
            status: 'completed'
        });
        
        return {
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            tradeId
        };
    } catch (error) {
        console.error('❌ Sell transaction failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Command System
 */

/**
 * Registers all available commands
 * @param {Object} bot - Trading bot instance
 */
function registerCommands(bot) {
    // Basic commands
    bot.commandManager.set('balance', async () => {
        const balance = await getBalance(bot);
        console.log(`💰 Balance: ${balance}`);
        return balance;
    });
    
    bot.commandManager.set('status', async () => {
        await displayWalletInfo(bot);
        return await getWalletStatus(bot);
    });
    
    bot.commandManager.set('help', () => {
        displayHelp();
        return 'Help displayed';
    });
    
    // Trading commands
    bot.commandManager.set('buy', async (tokenAddress, ethAmount) => {
        return await buyTokenWithETH(bot, tokenAddress, ethAmount);
    });
    
    bot.commandManager.set('sell', async (tokenAddress, tokenAmount) => {
        return await sellTokenForETH(bot, tokenAddress, tokenAmount);
    });
    
    // Token management commands
    bot.commandManager.set('approve', async (tokenAddress, amount) => {
        return await approveTokenSpending(bot, tokenAddress, amount);
    });
    
    bot.commandManager.set('allowance', async (tokenAddress) => {
        return await checkTokenAllowance(bot, tokenAddress);
    });
    
    // Position management commands (planned)
    bot.commandManager.set('openposition', async (tokenAddress, amount, type, stopLoss, takeProfit, maxHoldTime) => {
        return await openPosition(bot, tokenAddress, amount, type, stopLoss, takeProfit, maxHoldTime);
    });
    
    bot.commandManager.set('positions', async () => {
        return await displayPositions(bot);
    });
    
    bot.commandManager.set('closeposition', async (positionId) => {
        return await closePosition(bot, positionId);
    });
    
    bot.commandManager.set('startmonitoring', () => {
        startPositionMonitoring(bot);
        return 'Position monitoring started';
    });
    
    bot.commandManager.set('stopmonitoring', () => {
        stopPositionMonitoring(bot);
        return 'Position monitoring stopped';
    });
    
    bot.commandManager.set('updatestop', async (positionId, newStopLoss) => {
        return await updateStopLoss(bot, positionId, newStopLoss);
    });
    
    bot.commandManager.set('updatetarget', async (positionId, newTakeProfit) => {
        return await updateTakeProfit(bot, positionId, newTakeProfit);
    });
}

/**
 * Executes a command
 * @param {string} command - Command name
 * @param {Object} bot - Trading bot instance
 * @param {...any} args - Command arguments
 * @returns {Promise<any>} Command result
 */
async function executeCommand(command, bot, ...args) {
    const commandHandler = bot.commandManager.get(command);
    if (!commandHandler) {
        console.log(`❌ Unknown command: ${command}`);
        console.log('Type "help" to see available commands');
        return null;
    }
    
    try {
        return await commandHandler(...args);
    } catch (error) {
        console.error(`❌ Error executing command ${command}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Displays help information
 */
function displayHelp() {
    console.log('\n📚 Available Commands:');
    console.log('═'.repeat(50));
    console.log('Basic Commands:');
    console.log('  balance          - Get wallet ETH balance');
    console.log('  status           - Get complete wallet status');
    console.log('  help             - Show this help message');
    console.log('');
    console.log('Trading Commands:');
    console.log('  buy <token> <eth> - Buy token with ETH');
    console.log('  sell <token> <amount> - Sell token for ETH');
    console.log('');
    console.log('Token Management:');
    console.log('  approve <token> <amount> - Approve token spending');
    console.log('  allowance <token> - Check token allowance');
    console.log('');
    console.log('Position Management (Planned):');
    console.log('  openposition <token> <amount> <type> <stopLoss> <takeProfit> [maxHoldTime]');
    console.log('  positions - Show all open positions');
    console.log('  closeposition <positionId> - Close specific position');
    console.log('  startmonitoring - Start price monitoring');
    console.log('  stopmonitoring - Stop price monitoring');
    console.log('  updatestop <positionId> <newStopLoss> - Update stop loss');
    console.log('  updatetarget <positionId> <newTakeProfit> - Update take profit');
    console.log('═'.repeat(50));
}

/**
 * Token Management Functions
 */

/**
 * Approves token spending
 * @param {Object} bot - Trading bot instance
 * @param {string} tokenAddress - Token address
 * @param {string} amount - Amount to approve
 * @returns {Promise<Object>} Approval result
 */
async function approveTokenSpending(bot, tokenAddress, amount) {
    try {
        console.log(`🔓 Approving ${amount} tokens for spending...`);
        
        const tokenContract = await getTokenContract(tokenAddress, bot.contractManager);
        const amountToApprove = ethers.parseUnits(amount, 18); // Assuming 18 decimals
        
        const tx = await tokenContract.approve(ADDRESSES.ROUTER, amountToApprove);
        console.log(`📝 Approval transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Approval confirmed in block ${receipt.blockNumber}`);
        
        return {
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber
        };
    } catch (error) {
        console.error('❌ Token approval failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Checks token allowance
 * @param {Object} bot - Trading bot instance
 * @param {string} tokenAddress - Token address
 * @returns {Promise<Object>} Allowance information
 */
async function checkTokenAllowance(bot, tokenAddress) {
    try {
        const tokenContract = await getTokenContract(tokenAddress, bot.contractManager);
        const allowance = await tokenContract.allowance(bot.wallet.address, ADDRESSES.ROUTER);
        const allowanceFormatted = ethers.formatUnits(allowance, 18);
        
        console.log(`🔍 Token allowance: ${allowanceFormatted}`);
        
        return {
            success: true,
            allowance: allowanceFormatted,
            allowanceRaw: allowance.toString()
        };
    } catch (error) {
        console.error('❌ Error checking allowance:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Position Management Functions (Planned)
 */

/**
 * Opens a new position
 * @param {Object} bot - Trading bot instance
 * @param {string} tokenAddress - Token address
 * @param {string} amount - Amount to trade
 * @param {string} type - Position type (long/short)
 * @param {string} stopLoss - Stop loss price
 * @param {string} takeProfit - Take profit price
 * @param {string} maxHoldTime - Maximum hold time in hours
 * @returns {Promise<Object>} Position opening result
 */
async function openPosition(bot, tokenAddress, amount, type, stopLoss, takeProfit, maxHoldTime = '24') {
    try {
        console.log(`🎯 Opening ${type} position for ${tokenAddress}...`);
        
        const positionId = `pos_${Date.now()}`;
        const position = {
            id: positionId,
            type,
            tokenAddress,
            amount,
            stopLoss: parseFloat(stopLoss),
            takeProfit: parseFloat(takeProfit),
            maxHoldTime: parseInt(maxHoldTime),
            timestamp: new Date().toISOString(),
            status: 'open'
        };
        
        // Execute the trade
        let tradeResult;
        if (type === 'long') {
            tradeResult = await buyTokenWithETH(bot, tokenAddress, amount);
        } else {
            tradeResult = await sellTokenForETH(bot, tokenAddress, amount);
        }
        
        if (tradeResult.success) {
            position.txHash = tradeResult.txHash;
            bot.positions.set(positionId, position);
            
            console.log(`✅ Position opened: ${positionId}`);
            return {
                success: true,
                positionId,
                position,
                tradeResult
            };
        } else {
            return {
                success: false,
                error: tradeResult.error
            };
        }
    } catch (error) {
        console.error('❌ Error opening position:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Displays all open positions
 * @param {Object} bot - Trading bot instance
 * @returns {Promise<Object>} Positions information
 */
async function displayPositions(bot) {
    const positions = Array.from(bot.positions.values());
    
    if (positions.length === 0) {
        console.log('📊 No open positions');
        return { positions: [] };
    }
    
    console.log('\n📊 Open Positions:');
    console.log('═'.repeat(80));
    positions.forEach(position => {
        console.log(`ID: ${position.id}`);
        console.log(`Type: ${position.type.toUpperCase()}`);
        console.log(`Token: ${position.tokenAddress}`);
        console.log(`Amount: ${position.amount}`);
        console.log(`Stop Loss: ${position.stopLoss}`);
        console.log(`Take Profit: ${position.takeProfit}`);
        console.log(`Max Hold Time: ${position.maxHoldTime}h`);
        console.log(`Opened: ${position.timestamp}`);
        console.log('─'.repeat(40));
    });
    
    return { positions };
}

/**
 * Closes a specific position
 * @param {Object} bot - Trading bot instance
 * @param {string} positionId - Position ID
 * @returns {Promise<Object>} Position closing result
 */
async function closePosition(bot, positionId) {
    try {
        const position = bot.positions.get(positionId);
        if (!position) {
            throw new Error('Position not found');
        }
        
        console.log(`🔒 Closing position: ${positionId}`);
        
        // Execute opposite trade
        let tradeResult;
        if (position.type === 'long') {
            tradeResult = await sellTokenForETH(bot, position.tokenAddress, position.amount);
        } else {
            tradeResult = await buyTokenWithETH(bot, position.tokenAddress, position.amount);
        }
        
        if (tradeResult.success) {
            position.status = 'closed';
            position.closeTxHash = tradeResult.txHash;
            position.closeTimestamp = new Date().toISOString();
            
            console.log(`✅ Position closed: ${positionId}`);
            return {
                success: true,
                positionId,
                tradeResult
            };
        } else {
            return {
                success: false,
                error: tradeResult.error
            };
        }
    } catch (error) {
        console.error('❌ Error closing position:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Updates stop loss for a position
 * @param {Object} bot - Trading bot instance
 * @param {string} positionId - Position ID
 * @param {string} newStopLoss - New stop loss price
 * @returns {Promise<Object>} Update result
 */
async function updateStopLoss(bot, positionId, newStopLoss) {
    try {
        const position = bot.positions.get(positionId);
        if (!position) {
            throw new Error('Position not found');
        }
        
        position.stopLoss = parseFloat(newStopLoss);
        console.log(`📝 Updated stop loss for ${positionId}: ${newStopLoss}`);
        
        return {
            success: true,
            positionId,
            newStopLoss
        };
    } catch (error) {
        console.error('❌ Error updating stop loss:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Updates take profit for a position
 * @param {Object} bot - Trading bot instance
 * @param {string} positionId - Position ID
 * @param {string} newTakeProfit - New take profit price
 * @returns {Promise<Object>} Update result
 */
async function updateTakeProfit(bot, positionId, newTakeProfit) {
    try {
        const position = bot.positions.get(positionId);
        if (!position) {
            throw new Error('Position not found');
        }
        
        position.takeProfit = parseFloat(newTakeProfit);
        console.log(`📝 Updated take profit for ${positionId}: ${newTakeProfit}`);
        
        return {
            success: true,
            positionId,
            newTakeProfit
        };
    } catch (error) {
        console.error('❌ Error updating take profit:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Position Monitoring Functions
 */

let monitoringInterval = null;

/**
 * Starts position monitoring
 * @param {Object} bot - Trading bot instance
 */
function startPositionMonitoring(bot) {
    if (monitoringInterval) {
        console.log('⚠️ Position monitoring is already running');
        return;
    }
    
    console.log('👁️ Starting position monitoring...');
    
    monitoringInterval = setInterval(async () => {
        await checkAllPositions(bot);
    }, 30000); // Check every 30 seconds
}

/**
 * Stops position monitoring
 * @param {Object} bot - Trading bot instance
 */
function stopPositionMonitoring(bot) {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        console.log('🛑 Position monitoring stopped');
    }
}

/**
 * Checks all open positions for exit conditions
 * @param {Object} bot - Trading bot instance
 */
async function checkAllPositions(bot) {
    const openPositions = Array.from(bot.positions.values()).filter(p => p.status === 'open');
    
    for (const position of openPositions) {
        try {
            // Check time-based exit
            const hoursHeld = (Date.now() - new Date(position.timestamp).getTime()) / (1000 * 60 * 60);
            if (hoursHeld >= position.maxHoldTime) {
                console.log(`⏰ Time exit triggered for position ${position.id}`);
                await closePosition(bot, position.id);
                continue;
            }
            
            // TODO: Add price monitoring and automatic stop loss/take profit execution
            // This would require price feed integration
            
        } catch (error) {
            console.error(`❌ Error checking position ${position.id}:`, error.message);
        }
    }
}

/**
 * Utility Functions
 */

/**
 * Formats error messages
 * @param {Error} error - Error object
 * @returns {string} Formatted error message
 */
function formatError(error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
        return 'Insufficient funds for transaction';
    } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        return 'Transaction would fail - check parameters';
    } else if (error.code === 'NETWORK_ERROR') {
        return 'Network connection error';
    } else {
        return error.message;
    }
}

/**
 * Validates Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
function isValidAddress(address) {
    try {
        return ethers.isAddress(address);
    } catch {
        return false;
    }
}

/**
 * Validates amount
 * @param {string} amount - Amount to validate
 * @returns {boolean} True if valid
 */
function isValidAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
}

/**
 * Main Bot Class
 */
class DEXTradingBot {
    constructor(provider, wallet, config) {
        this.bot = createTradingBot(provider, wallet, config);
    }
    
    async start() {
        startBot(this.bot);
    }
    
    async stop() {
        stopBot(this.bot);
    }
    
    async executeCommand(command, ...args) {
        return await executeCommand(command, this.bot, ...args);
    }
    
    async getStatus() {
        return await getWalletStatus(this.bot);
    }
    
    async getBalance() {
        return await getBalance(this.bot);
    }
    
    async buyToken(tokenAddress, ethAmount) {
        return await buyTokenWithETH(this.bot, tokenAddress, ethAmount);
    }
    
    async sellToken(tokenAddress, tokenAmount) {
        return await sellTokenForETH(this.bot, tokenAddress, tokenAmount);
    }
}

// Export all functions and classes
module.exports = {
    // Core functions
    testConnection,
    createTradingBot,
    startBot,
    stopBot,
    
    // Wallet management
    getBalance,
    getWalletStatus,
    displayWalletInfo,
    
    // Contract management
    createContractManager,
    getContract,
    getTokenContract,
    getRouterContract,
    
    // Trading functions
    buyTokenWithETH,
    sellTokenForETH,
    
    // Command system
    registerCommands,
    executeCommand,
    displayHelp,
    
    // Token management
    approveTokenSpending,
    checkTokenAllowance,
    
    // Position management
    openPosition,
    displayPositions,
    closePosition,
    updateStopLoss,
    updateTakeProfit,
    startPositionMonitoring,
    stopPositionMonitoring,
    checkAllPositions,
    
    // Utility functions
    formatError,
    isValidAddress,
    isValidAmount,
    
    // Main class
    DEXTradingBot,
    
    // Constants
    ADDRESSES
};
