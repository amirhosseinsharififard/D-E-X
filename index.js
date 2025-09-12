/**
 * DEX Trading Bot - Advanced Trading System
 *
 * This is a comprehensive trading bot for decentralized exchanges (DEX)
 * Built with ethers.js v6 and Hardhat for local development
 *
 * Features:
 * - ETH to Token swaps
 * - Token to ETH swaps
 * - Command-based trading system
 * - Slippage protection
 * - Gas optimization
 * - Error handling
 *
 * @author Amir Hossein Sharifi Fard
 * @version 1.0.0
 * @since 2024
 */

// Import ethers.js library (version 6)
import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration for the trading bot
// TODO: Move to .env file for production
const config = {
    // Network configuration
    rpcUrl: 'http://localhost:8545', // Hardhat local network
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // First Hardhat test account

    // Contract addresses (will be filled later when contracts are deployed)
    routerAddress: '0x...', // Uniswap V2 Router address
    wethAddress: '0x...', // Wrapped ETH address
};

// Initialize blockchain connection
const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(config.privateKey, provider);

/**
 * Test connection to the blockchain network
 * Displays wallet balance and connection status
 *
 * @returns {Promise<void>}
 */
async function testConnection() {
    try {
        const balance = await provider.getBalance(wallet.address);
        console.log('Balance:', ethers.formatEther(balance), 'ETH');
        console.log('Connection successful!');
    } catch (error) {
        console.error('Connection error:', error.message);
    }
}

/**
 * Create a new trading bot instance
 *
 * @param {ethers.Provider} provider - Blockchain provider
 * @param {ethers.Wallet} wallet - Wallet instance
 * @param {Object} config - Configuration object
 * @returns {Object} Trading bot instance
 */
function createTradingBot(provider, wallet, config) {
    return {
        provider: provider, // Blockchain connection
        wallet: wallet, // Wallet for transactions
        config: config, // Bot configuration
        isRunning: false, // Bot status (stopped/running)
        tokens: new Map(), // Tokens registry
    };
}

/**
 * Get market volatility for a token (simplified calculation)
 *
 * @param {Object} bot - Trading bot instance
 * @param {string} tokenAddress - Token address
 * @returns {Promise<number>} Volatility percentage (0-1)
 */
async function getMarketVolatility(bot, tokenAddress) {
    try {
        //simplified volatility calculation based on recent price changes
        // in a real implementation you would  fetch historical price data and calculate more accurate volatility
        const contractManager = createContractManager(bot.provider, bot.wallet);
        const router = contractManager.getRouterContract();

        //get current price
        const path = [CONTRACTS.ADDRESSES.WETH, tokenAddress];
        const amountsOut = await router.getAmountsOut(ethers.parseEther('1'), path);
        const currentPrice = Number(ethers.formatUnits(amountsOut[1], 18));

        //simulate volatility based on price (simplified)
        // in reality you'd calculate this from historicl data
        const volatility = Math.min(0.3, Math.max(0.01, currentPrice * 0.1));
        return volatility;
    } catch (error) {
        console.error('Error calculating volatility:', error.message);
        return 0.05; // Default 5% volatility
    }
}

/**
 * Get token balance with proper decimals
 *
 * @param {Object} bot - Trading bot instance
 * @param {string} tokenAddress - Token address
 * @returns {Promise<string>} Formatted token balance
 */
async function getTokenBalance(bot, tokenAddress) {
    try {
        const contractManager = createContractManager(bot.provider, bot.wallet);
        const token = contractManager.getTokenContract(tokenAddress);
        const tokenInfo = getTokenInfo(bot, tokenAddress);

        const balance = await token.balanceOf(bot.wallet.address);
        const decimals = tokenInfo ? tokenInfo.decimals : 18;

        return ethers.formatUnits(balance, decimals);
    } catch (error) {
        console.error('Error getting token balance:', error.message);
        return 0;
    }
}

/**
 * Get all token balances for registered tokens
 *
 * @param {Object} bot - Trading bot instance
 * @returns {Promise<Array>} Array of token balance objects
 */
async function getAllTokenBalances(bot) {
    try {
        const tokens = getAllTokens(bot);
        const balances = [];

        for (const token of tokens) {
            const balance = await getTokenBalance(bot, token.address);
            balances.push({...token, balance: balance });
        }

        return balances;
    } catch (error) {
        console.error('Error getting all token balances:', error.message);
        return [];
    }
}

/**
 * Enhanced trading function with multi-token support
 *
 * @param {Object} bot - Trading bot instance
 * @param {string} tokenAddress - Token address
 * @param {number} ethAmount - Amount of ETH to spend
 * @param {number} customSlippage - Custom slippage percentage (optional)
 * @returns {Promise<Object|null>} Transaction receipt or null if failed
 */
async function buyTokenWithETHAdvanced(bot, tokenAddress, ethAmount, customSlippage = null) {
    try {
        console.log(`buying token with ${ethAmount} ETH (Advanced)`);
        const contractManager = createContractManager(bot.provider, bot.wallet);
        const router = contractManager.getRouterContract();

        //convert ETH amount to wei
        const amountIn = ethers.parseEther(ethAmount.toString());

        // calculate optimal slippage if not provided
        const slippage = customSlippage || (await calculateOptimalSlippage(bot, tokenAddress, amountIn));

        // Trading path:ETH-> WETH -> token
        const path = [CONTRACTS.ADDRESSES.WETH, tokenAddress];

        // get expected output amount
        const amountsOut = await router.getAmountsOut(amountIn, path);
        const slippagePercent = ethers.parseUnits((100 - slippage).toString(), 2);
        const amountOutMin = (amountsOut[1] * slippagePercent) / ethers.parseUnits(`100`, 2);

        const tokenInfo = getTokenInfo(bot, tokenAddress);
        const tokenSymbol = tokenInfo ? tokenInfo.symbol : 'Token';

        console.log(`expected to receive ${ethers.formatUnits(amountsOut[1], 18)} ${tokenSymbol}`);
        console.log(`using ${slippage}% slippage protection`);

        //set deadline (3minutes for now)
        const deadline = Math.floor(Date.now() / 1000) + 180;

        //expecte swap transaction
        const tx = await router.swapExactETHForTokens(amountOutMin, path, bot.wallet.address, deadline, {
            value: amountIn,
        });

        console.log(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`Transaction confirmed: ${receipt.blockNumber}`);

        // Update token registry if not already registered
        if (!hasToken(bot, tokenAddress)) {
            addTokenToRegistry(bot, tokenAddress, tokenSymbol);
        }

        return receipt;
    } catch (error) {
        console.error('Error buying token:', error.message);
        return null;
    }
}

/**
 * Start the trading bot
 *
 * @param {Object} bot - Trading bot instance
 */
function startBot(bot) {
    bot.isRunning = true;
    console.log('Trading bot started');
}

/**
 * Stop the trading bot
 *
 * @param {Object} bot - Trading bot instance
 */
function stopBot(bot) {
    bot.isRunning = false;
    console.log('Trading bot stopped');
}

/**
 * Multi-Token Management Functions
 */

/**
 * Add token to registry
 *
 * @param {Object} bot - Trading bot instance
 * @param {string} address - Token contract address
 * @param {string} symbol - Token symbol (e.g., 'USDC', 'DAI')
 * @param {number} decimals - Token decimals (default: 18)
 */

function addTokenToRegistry(bot, address, symbol, decimals = 18) {
    bot.tokens.set(address, {
        symbol: symbol.toUpperCase(),
        decimals: decimals,
        address: address,
    });
    console.log(`Added token: ${symbol} (${address})`);
}

/**
 * Get token info by address
 *
 * @param {Object} bot - Trading bot instance
 * @param {string} address - Token address
 * @returns {Object|null} Token info or null if not found
 */
function getTokenInfo(bot, address) {
    return bot.tokens.get(address) || null;
}

/**
 * Get all registered tokens
 *
 * @param {Object} bot - Trading bot instance
 * @returns {Array} Array of token objects
 */
function getAllTokens(bot) {
    return Array.from(bot.tokens.values());
}

/**
 * Check if token is registered
 *
 * @param {Object} bot - Trading bot instance
 * @param {string} address - Token address
 * @returns {boolean} True if token is registered
 */
function hasToken(bot, address) {
    return bot.tokens.has(address);
}

/**
 * Advanced Slippage Management Functions
 */

/**
 * Calculate optimal slippage based on market conditions
 *
 * @param {Object} bot - Trading bot instance
 * @param {string} tokenAddress - Token address
 * @param {bigint} amount - Trade amount
 * @returns {Promise<number>} Optimal slippage percentage
 */

async function calculateOptimalSlippage(bot, tokenAddress, amount) {
    try {
        // Base slippage settings
        const baseSlippage = 5; // 5% base slippage
        const maxSlippage = 10; // 10% maximum slippage
        const minSlippage = 1; // 1% minimum slippage

        // Get market volatility (simplified calculation)
        const volatility = await getMarketVolatility(bot, tokenAddress);

        // Adjust slippage based on volatility
        let slippage = baseSlippage;
        if (volatility > 0.1) slippage += 2;
        if (volatility > 0.2) slippage += 3;
        if (volatility < 0.05) slippage -= 1;

        // Adjust based on trade size
        const amountEth = Number(ethers.formatEther(amount));
        if (amountEth > 1) slippage += 1; //large trades
        if (amountEth > 5) slippage += 2; //very large trades
        slippage = Math.max(minSlippage, Math.min(maxSlippage, slippage));
        console.log(
            `📊 Slippage calculation: Volatility=${(volatility * 100).toFixed(2)}%, Trade size=${amountEth}ETH, Slippage=${slippage}%`
        );
        return slippage;
    } catch (error) {
        console.error('Error calculating slippage:', error.message);
        return 5; // Default 5% slippage
    }
}

/**
 * Get wallet ETH balance
 *
 * @param {Object} bot - Trading bot instance
 * @returns {Promise<string>} Formatted balance in ETH
 */
async function getBalance(bot) {
    try {
        const balance = await bot.provider.getBalance(bot.wallet.address);
        return ethers.formatEther(balance);
    } catch (error) {
        console.error('Error getting balance:', error.message);
        return 0;
    }
}

/**
 * Get complete wallet status
 *
 * @param {Object} bot - Trading bot instance
 * @returns {Promise<Object|null>} Wallet status object or null if error
 */
async function getWalletStatus(bot) {
    try {
        const balance = await getBalance(bot);
        return {
            address: bot.wallet.address,
            balance: balance + 'ETH',
            isRunning: bot.isRunning,
        };
    } catch (error) {
        console.error('Error getting wallet status:', error.message);
        return null;
    }
}

/**
 * Display wallet information in a formatted way
 *
 * @param {Object} bot - Trading bot instance
 * @returns {Promise<void>}
 */
async function displayWalletInfo(bot) {
    console.log('\n === Wallet Information ===');
    const status = await getWalletStatus(bot);
    if (status) {
        console.log('address:', status.address);
        console.log('balance:', status.balance);
        console.log('Status:', status.isRunning ? 'Running' : 'Stopped');
    } else {
        console.log('Error getting wallet status');
    }
    console.log('========================');
}

/**
 * Command Manager System
 *
 * Manages all trading bot commands in a centralized way
 * Allows dynamic registration and execution of commands
 */
const commandManager = {
    commands: new Map(), // Storage for all registered commands

    /**
     * Register a new command
     *
     * @param {string} name - Command name
     * @param {string} description - Command description
     * @param {Function} handler - Command handler function
     */
    register(name, description, handler) {
        this.commands.set(name, {
            description,
            handler,
            name,
        });
        console.log(`Command ${name} registered successfully`);
    },

    /**
     * Execute a command
     *
     * @param {string} name - Command name to execute
     * @param {Object} bot - Trading bot instance
     * @param {...any} args - Command arguments
     * @returns {Promise<boolean>} Success status
     */
    async execute(name, bot, ...args) {
        const cmd = this.commands.get(name);
        if (!cmd) {
            console.error(`Command ${name} not found`);
            return false;
        }
        try {
            await cmd.handler(bot, ...args);
            return true;
        } catch (error) {
            console.error(`Error executing command ${cmd.name}:`, error.message);
        }
    },

    /**
     * List all available commands
     */
    list() {
        console.log('\n=== Available Commands ===');
        for (const [name, command] of this.commands) {
            console.log(`${name}: ${command.description}`);
        }
        console.log('========================');
    },
};

/**
 * Contract ABIs and Addresses
 *
 * Contains all necessary contract interfaces and addresses
 * for interacting with DeFi protocols
 */
const CONTRACTS = {
    /**
     * ERC-20 Token ABI
     * Standard interface for ERC-20 tokens
     */
    ERC20_ABI: [
        'function balanceOf(address owner) view returns (uint256)', // Get token balance
        'function decimals() view returns (uint8)', // Get token decimals
        'function approve(address spender, uint256 amount) returns (bool)', // Approve spending
        'function allowance(address owner, address spender) view returns (uint256)', // Check allowance
        'function transfer(address to, uint256 amount) returns (bool)', // Transfer tokens
        'function name() view returns (string)', // Get token name
        'function symbol() view returns (string)', // Get token symbol
    ],

    /**
     * Uniswap V2 Router ABI
     * Interface for Uniswap V2 router contract
     */
    ROUTER_ABI: [
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)', // Get swap amounts
        'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)', // Swap ETH for tokens
        'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)', // Swap tokens for ETH
        'function WETH() external pure returns (address)', // Get WETH address
    ],

    /**
     * Contract addresses
     * Mainnet addresses (will be different on testnets)
     */
    ADDRESSES: {
        ROUTER: '0x...', // MockUniswapRouter address (will be filled after deployment)
        WETH: '0x0000000000000000000000000000000000000001', // Mock WETH address
        USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USD Coin (not used in local)
        TEST_TOKEN: '0x...', // Test token address (will be filled after deployment)
    },
    ADDRESSES_LOCAL: {
        ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
        WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Wrapped ETH
        USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USD Coin
        TEST_TOKEN: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Test token for local testing
    },
};

/**
 * Load deployment addresses from deployments/local.json if present
 * Returns the resolved addresses object used by the app.
 */
async function loadDeploymentAddressesIfAvailable() {
    try {
        const __filename = fileURLToPath(
            import.meta.url);
        const __dirname = path.dirname(__filename);
        const deploymentsDir = path.join(__dirname, 'deployments');
        const filePath = path.join(deploymentsDir, 'local.json');

        const content = await fs.readFile(filePath, 'utf8');
        const addresses = JSON.parse(content);

        if (addresses && typeof addresses === 'object') {
            if (addresses.ROUTER) CONTRACTS.ADDRESSES.ROUTER = addresses.ROUTER;
            if (addresses.WETH) CONTRACTS.ADDRESSES.WETH = addresses.WETH;
            if (addresses.TEST_TOKEN) CONTRACTS.ADDRESSES.TEST_TOKEN = addresses.TEST_TOKEN;
            console.log('\nLoaded deployment addresses from deployments/local.json');
            console.log('ROUTER:', CONTRACTS.ADDRESSES.ROUTER);
            console.log('WETH:', CONTRACTS.ADDRESSES.WETH);
            console.log('TEST_TOKEN:', CONTRACTS.ADDRESSES.TEST_TOKEN);
        }
    } catch (err) {
        // Optional file; skip if not present
        if (err && err.code !== 'ENOENT') {
            console.warn('Warning reading deployments/local.json:', err.message);
        }
    }

    return CONTRACTS.ADDRESSES;
}

/**
 * Contract Manager
 *
 * Manages contract instances and provides easy access to contract functions
 *
 * @param {ethers.Provider} provider - Blockchain provider
 * @param {ethers.Wallet} wallet - Wallet instance
 * @returns {Object} Contract manager instance
 */
function createContractManager(provider, wallet) {
    return {
        provider, // Blockchain provider
        wallet, // Wallet for signing transactions

        /**
         * Create a contract instance
         *
         * @param {string} address - Contract address
         * @param {Array} abi - Contract ABI
         * @returns {ethers.Contract} Contract instance
         */
        getContract(address, abi) {
            return new ethers.Contract(address, abi, wallet);
        },

        /**
         * Get ERC-20 token contract instance
         *
         * @param {string} tokenAddress - Token contract address
         * @returns {ethers.Contract} Token contract instance
         */
        getTokenContract(tokenAddress) {
            return this.getContract(tokenAddress, CONTRACTS.ERC20_ABI);
        },

        /**
         * Get Uniswap router contract instance
         *
         * @returns {ethers.Contract} Router contract instance
         */
        getRouterContract() {
            return this.getContract(CONTRACTS.ADDRESSES.ROUTER, CONTRACTS.ROUTER_ABI);
        },
    };
}

/**
 * Buy token with ETH - خرید توکن با اتریوم
 *
 * Executes a swap from ETH to token using Uniswap V2
 * Includes slippage protection and deadline management
 * اجرای سوآپ از اتریوم به توکن با استفاده از یونی سواپ نسخه ۲
 * شامل محافظت از لغزش و مدیریت مهلت زمانی
 *
 * @param {Object} bot - Trading bot instance
 * @param {string} tokenAddress - Address of token to buy
 * @param {number} ethAmount - Amount of ETH to spend
 * @returns {Promise<Object|null>} Transaction receipt or null if failed
 */
async function buyTokenWithETH(bot, tokenAddress, ethAmount) {
    try {
        console.log(`Buying token with ${ethAmount} ETH`);

        const contractManager = createContractManager(bot.provider, bot.wallet);
        const router = contractManager.getRouterContract();

        // Convert ETH to wei (18 decimals) - تبدیل اتریوم به وی (۱۸ رقم اعشار)
        const amountIn = ethers.parseEther(ethAmount.toString());

        // Trading path: ETH -> WETH -> Token
        const path = [CONTRACTS.ADDRESSES.WETH, tokenAddress];

        // Get expected output amount
        const amountsOut = await router.getAmountsOut(amountIn, path);
        const slippagePercent = ethers.parseUnits('95', 2); // 95%
        const amountOutMin = (amountsOut[1] * slippagePercent) / ethers.parseUnits('100', 2);

        console.log(`Expected to receive: ${ethers.formatUnits(amountsOut[1], 18)} tokens`);

        // Set deadline (3 minutes from now) - تنظیم مهلت زمانی (۳ دقیقه از حالا)
        const deadline = Math.floor(Date.now() / 1000) + 180;

        // Execute swap transaction
        const tx = await router.swapExactETHForTokens(amountOutMin, path, bot.wallet.address, deadline, {
            value: amountIn,
        });

        console.log(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
        return receipt;
    } catch (error) {
        console.error('Error buying token:', error.message);
        return null;
    }
}

/**
 * Sell token for ETH
 *
 * Executes a swap from token to ETH using Uniswap V2
 * Includes balance check, approval, and slippage protection
 *
 * @param {Object} bot - Trading bot instance
 * @param {string} tokenAddress - Address of token to sell
 * @param {number} tokenAmount - Amount of tokens to sell
 * @returns {Promise<Object|null>} Transaction receipt or null if failed
 */
async function sellTokenForETH(bot, tokenAddress, tokenAmount) {
    try {
        console.log(`Selling ${tokenAmount} tokens for ETH...`);

        const contractManager = createContractManager(bot.provider, bot.wallet);
        const router = contractManager.getRouterContract();
        const token = contractManager.getTokenContract(tokenAddress);

        // Convert token amount to wei
        const amountIn = ethers.parseUnits(tokenAmount.toString(), 18);

        // Check token balance
        const balance = await token.balanceOf(bot.wallet.address);
        if (balance < amountIn) {
            console.error('Insufficient token balance');
            return null;
        }

        // Approve token spending
        console.log('Approving token spending...');
        const approveTx = await token.approve(router.address, amountIn);
        await approveTx.wait();

        // Trading path: Token -> WETH -> ETH
        const path = [tokenAddress, CONTRACTS.ADDRESSES.WETH];

        // Get expected output amount
        const amountsOut = await router.getAmountsOut(amountIn, path);
        const slippagePercent = ethers.parseUnits('95', 2); // 95%
        const amountOutMin = (amountsOut[1] * slippagePercent) / ethers.parseUnits('100', 2);

        console.log(`Expected to receive: ${ethers.formatEther(amountsOut[1])} ETH`);

        // Set deadline (3 minutes from now)
        const deadline = Math.floor(Date.now() / 1000) + 180;

        // Execute swap transaction
        const tx = await router.swapExactTokensForETH(amountIn, amountOutMin, path, bot.wallet.address, deadline);

        console.log(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
        return receipt;
    } catch (error) {
        console.error('Error selling token:', error.message);
        return null;
    }
}

/**
 * Phase 2.4: Advanced Analytics & Optimization Systems
 *
 * This section includes advanced analytics, gas optimization,
 * price impact analysis, trading history tracking, and risk management
 */

/**
 * Trading History Management Functions
 */

/**
 * Initialize trading history storage
 * @returns {Object} Trading history storage
 */

function createTradingHistory() {
    return {
        trade: new Map(),
        performance: new Map(),
        tradeIdCounter: 1,
    };
}

/**
 * Record a new trade in history
 * @param {Object} history - Trading history storage
 * @param {Object} tradeData - Trade information
 * @returns {string} Trade ID
 */
function recordTrade(history, tradeData) {
    const tradeId = `trade_${history.tradeIdCounter++}`;
    const trade = {
        id: tradeId,
        timestamp: Date.now(),
        type: tradeData.type,
        tokenAddress: trade.tokenAddress,
        amount: tradeData.amount,
        price: tradeData.price,
        slippage: tradeData.slippage,
        gasUsed: tradeData.gasUsed,
        txHash: tradeData.txHash,
        status: 'completed',
    };

    history.trade.set(tradeId, trade);
    updatePerformanceMetrics(history, trade);
    return tradeId;
}

/**
 * Update performance metrics for a token
 * @param {Object} history - Trading history storage
 * @param {Object} trade - Trade data
 */
function updatePerformanceMetrics(history, trade) {
    const tokenAddress = trade.tokenAddress;
    if (!history.performance.has(tokenAddress)) {
        history.performance.set(tokenAddress, {
            totalTrades: 0,
            totalVolume: 0,
            totalGasUsed: 0,
            avgSlippage: 0,
            profitLoss: 0,
        });
    }

    const perf = history.performance.get(tokenAddress);
    perf.totalTrades++;
    perf.totalVolume += parseFloat(trade.amount);
    perf.totalGasUsed += trade.gasUsed || 0;
    perf.avgSlippage += (perf.avgSlippage + trade.slippage) / 2;
}

/**
 * Get trading history
 * @param {Object} history - Trading history storage
 * @param {string} tokenAddress - Optional token filter
 * @param {number} limit - Number of trades to return
 * @returns {Array} Array of trades
 */
function getTradeHistory(history, tokenAddress = null, limit = 10) {
    let trades = Array.from(history.trade.values());

    if (tokenAddress) {
        trades = trades.filter((trade) => trade.tokenAddress === tokenAddress);
    }
    return trades.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

/**
 * Get trading statistics
 * @param {Object} history - Trading history storage
 * @returns {Object} Trading statistics
 */
function getTradingStats(history) {
    const allTrades = Array.from(history.trade.values());
    const totalTrades = allTrades.length;
    const totalVolume = allTrades.reduce((sum, trade) => sum + parseFloat(trade.amount), 0);
    const totalGasUsed = allTrades.reduce((sum, trade) => sum + (trade.gasUsed || 0), 0);
    const avgSlippage = allTrades.reduce((sum, trade) => sum + trade.slippage, 0) / totalTrades || 0;

    return {
        totalTrades,
        totalVolume,
        totalGasUsed,
        avgSlippage,
        tradesToday: allTrades.filter((trade) => {
            const tradeDate = new Date(trade.timestamp).toDateString();
            const today = new Date().toDateString();
            return tradeDate === today;
        }).length,
    };
}

/**
 * Gas Optimization Functions
 */

/**
 * Initialize gas optimization settings
 * @returns {Object} Gas optimization settings
 */
function createGasOptimization() {
    return {
        strategies: new Map([
            [
                'standard',
                {
                    gasLimit: 300000,
                    maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
                },
            ],
            [
                'fast',
                {
                    gasLimit: 350000,
                    maxFeePerGas: ethers.parseUnits('30', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('3', 'gwei'),
                },
            ],
            [
                'slow',
                {
                    gasLimit: 250000,
                    maxFeePerGas: ethers.parseUnits('15', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei'),
                },
            ],
        ]),
    };
}

/**
 * Get optimal gas settings
 * @param {Object} gasOpt - Gas optimization settings
 * @param {string} strategy - Gas strategy ('standard', 'fast', 'slow')
 * @returns {Object} Gas settings
 */
function getOptimalGas(gasOpt, strategy) {
    return gasOpt.strategies.get(strategy) || gasOpt.strategies.get('standard');
}

// ... existing code ...

/**
 * Get current gas price from network with enhanced calculations
 * @param {ethers.Provider} provider - Blockchain provider
 * @returns {Promise<Object>} Current gas price info with recommendations
 */
async function getCurrentGasPrice(provider) {
    // Default fallback values
    const defaultGasPrice = ethers.parseUnits('20', 'gwei');
    const defaultMaxFeePerGas = ethers.parseUnits('20', 'gwei');
    const defaultMaxPriorityFeePerGas = ethers.parseUnits('2', 'gwei');

    try {
        const feeData = await provider.getFeeData();

        // Extract current gas prices with fallbacks
        const currentGasPrice = feeData.gasPrice || defaultGasPrice;
        const currentMaxFeePerGas = feeData.maxFeePerGas || currentGasPrice;
        const currentMaxPriorityFeePerGas = feeData.maxPriorityFeePerGas || defaultMaxPriorityFeePerGas;

        // Helper function to calculate percentage adjustments using division
        const calculatePercentage = (baseValue, percentage) => {
            const multiplier = BigInt(100 + percentage);
            const divisor = BigInt(100);
            return (baseValue * multiplier) / divisor;
        };

        const calculateDecrease = (baseValue, percentage) => {
            const multiplier = BigInt(100 - percentage);
            const divisor = BigInt(100);
            return (baseValue * multiplier) / divisor;
        };

        // Generate gas price recommendations
        const generateRecommendations = () => ({
            low: {
                maxFeePerGas: calculatePercentage(currentGasPrice, 10), // 10% above
                maxPriorityFeePerGas: calculateDecrease(currentMaxPriorityFeePerGas, 10), // 10% below
            },
            medium: {
                maxFeePerGas: calculatePercentage(currentGasPrice, 20), // 20% above
                maxPriorityFeePerGas: currentMaxPriorityFeePerGas, // Same as current
            },
            high: {
                maxFeePerGas: calculatePercentage(currentGasPrice, 50), // 50% above
                maxPriorityFeePerGas: calculatePercentage(currentMaxPriorityFeePerGas, 20), // 20% above
            },
        });

        const recommendations = generateRecommendations();

        // Format values for display
        const formatGasValue = (value) => ethers.formatUnits(value, 'gwei');

        return {
            // Raw BigInt values
            gasPrice: currentGasPrice,
            maxFeePerGas: currentMaxFeePerGas,
            maxPriorityFeePerGas: currentMaxPriorityFeePerGas,

            // Formatted string values
            formatted: {
                gasPrice: formatGasValue(currentGasPrice),
                maxFeePerGas: formatGasValue(currentMaxFeePerGas),
                maxPriorityFeePerGas: formatGasValue(currentMaxPriorityFeePerGas),
            },

            // Formatted recommendations
            recommendations: {
                low: {
                    maxFeePerGas: formatGasValue(recommendations.low.maxFeePerGas),
                    maxPriorityFeePerGas: formatGasValue(recommendations.low.maxPriorityFeePerGas),
                },
                medium: {
                    maxFeePerGas: formatGasValue(recommendations.medium.maxFeePerGas),
                    maxPriorityFeePerGas: formatGasValue(recommendations.medium.maxPriorityFeePerGas),
                },
                high: {
                    maxFeePerGas: formatGasValue(recommendations.high.maxFeePerGas),
                    maxPriorityFeePerGas: formatGasValue(recommendations.high.maxPriorityFeePerGas),
                },
            },
        };
    } catch (error) {
        console.error('Error getting current gas price:', error.message);

        // Return fallback values with pre-calculated recommendations
        return {
            gasPrice: defaultGasPrice,
            maxFeePerGas: defaultMaxFeePerGas,
            maxPriorityFeePerGas: defaultMaxPriorityFeePerGas,
            formatted: {
                gasPrice: '20.0',
                maxFeePerGas: '20.0',
                maxPriorityFeePerGas: '2.0',
            },
            recommendations: {
                low: { maxFeePerGas: '22.0', maxPriorityFeePerGas: '1.8' },
                medium: { maxFeePerGas: '24.0', maxPriorityFeePerGas: '2.0' },
                high: { maxFeePerGas: '30.0', maxPriorityFeePerGas: '2.4' },
            },
        };
    }
}

/**
 * Price Impact Analysis Functions
 */

/**
 * Calculate price impact for a trade
 * @param {Object} contractManager - Contract manager instance
 * @param {string} tokenAddress - Token address
 * @param {bigint} amountIn - Input amount
 * @param {string} direction - 'buy' or 'sell'
 * @returns {Promise<Object>} Price impact data
 */
async function calculatePriceImpact(contractManager, tokenAddress, amountIn, direction = 'buy') {
    try {
        const router = contractManager.getRouterContract();

        if (direction === 'buy') {
            const path = [CONTRACTS.ADDRESSES.WETH, tokenAddress];
            const amountSout = await router.getAmountsOut(amountIn, path);

            //Calculate price impact (simplified)
            const expectedOutput = amountSout[1];
            const priceImpact = 0.1; // Simplified calculation - in reality would compare with pool reserves

            return {
                expectedOutput: ethers.formatUnits(expectedOutput, 18),
                priceImpact: priceImpact * 100, //convert to percentage
                impactLevel: priceImpact > 0.05 ? 'high' : priceImpact > 0.02 ? 'MEDIUM' : 'LOW',
                recommendation: priceImpact > 0.05 ? 'consider splitting trade' : 'safe to excute',
            };
        } else {
            const path = [tokenAddress, CONTRACTS.ADDRESSES.WETH];
            const amountOut = await router.getAmountsOut(amountIn, path);

            const expectedOutPut = amountOut[1];
            const priceImpact = 0.08; // Simplified calculation - in reality would compare with pool reserves
            return {
                expectedOutput: ethers.formatEther(expectedOutPut),
                priceImpact: priceImpact * 100,
                impactLevel: priceImpact > 0.05 ? 'high' : priceImpact > 0.02 ? 'MEDIUM' : 'LOW',
                recommendation: priceImpact > 0.05 ? 'consider splitting trade' : 'safe to excute',
            };
        }
    } catch (error) {
        console.error('Error calculating price impact:', error.message);
        return {
            expectedOutPut: '0',
            priceImpact: 0,
            impactLevel: 'UNKNOWN',
            recommendation: 'Unable to calculate - proceed with caution',
        };
    }
}

/**
 * Risk Management Functions - COMPLETE
 */

/**
 * Initialize risk management system
 * @returns {Object} Risk management settings
 */
function createRiskManagement() {
    return {
        limits: {
            maxSlippage: 10, // 10% maximum slippage
            maxPriceImpact: 5, // 5% maximum price impact
            maxTradeSize: 10, // 10 ETH maximum trade size
            maxDailyLoss: 5, // 5% maximum daily loss
            maxGasPrice: 50, // 50 gwei maximum gas price
        },

        alerts: new Map(),
        riskScore: 0,
        dailyLoss: 0,
        lastReset: Date.now(),
    };
}

/**
 * Calculate risk score for a trade
 * @param {Object} riskMgmt - Risk management instance
 * @param {Object} tradeData - Trade data
 * @returns {Object} Risk assessment
 */
function calculateRiskScore(riskMgmt, tradeData) {
    let riskScore = 0;
    const warnings = [];
    const recommendations = [];

    //check slippage risk
    if (tradeData.slippage > riskMgmt.limits.maxSlippage) {
        riskScore += 30;
        warnings.push(`High slippage ${tradeData.slippage}% - (limit: ${riskMgmt.limits.maxSlippage}%)`);
    }

    // check price impact risk
    if (tradeData.priceImpact > riskMgmt.limits.maxPriceImpact) {
        riskScore += 25;
        warnings.push(`High price impact ${tradeData.priceImpact}% - (limit: ${riskMgmt.limits.maxPriceImpact}%)`);
    }

    // check trade size risk
    if (tradeData.amount > riskMgmt.limits.maxTradeSize) {
        riskScore += 20;
        warnings.push(`Large trade size ${tradeData.amount} ETH - (limit: ${riskMgmt.limits.maxTradeSize} ETH)`);
    }

    // check gas price risk
    if (tradeData.gasPrice > riskMgmt.limits.maxGasPrice) {
        riskScore += 15;
        warnings.push(`High gas price ${tradeData.gasPrice} gwei - (limit: ${riskMgmt.limits.maxGasPrice} gwei)`);
    }

    // check daily loss risk
    if (riskMgmt.dailyLoss > riskMgmt.limits.maxDailyLoss) {
        riskScore += 40;
        warnings.push(
            `Daily loss limmit exceeded: ${riskMgmt.dailyLoss} ETH - (limit: ${riskMgmt.limits.maxDailyLoss} ETH)`
        );
    }

    if (riskScore >= 70) {
        recommendations.push('HIGH RISK - Consider canceling trade');
    } else if (riskScore >= 40) {
        recommendations.push('MEDIUM RISK - Consider reducing trade size');
    } else if (riskScore >= 20) {
        recommendations.push('LOW RISK - Monitor trade closely');
    } else {
        recommendations.push('SAFE - Trade within acceptable risk parameters');
    }

    return {
        riskScore: Math.min(100, riskScore),
        riskLevel: riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : riskScore >= 20 ? 'LOW' : 'SAFE',
        warnings,
        recommendations,
        canProceed: riskScore < 70,
    };
}

/**
 * Performance Analytics Functions - COMPLETE
 */

/**
 * Generate comprehensive performance report
 * @param {Object} history - Trading history storage
 * @param {Object} riskMgmt - Risk management instance
 * @returns {Object} Complete performance report
 */
function generatePerformanceReport(history, riskMgmt) {
    const stats = getTradingStats(history);
    const allTrades = Array.from(history.trade.values());

    // Additional metrics
    const profitableTrades = allTrades.filter((trade) => (trade.profitLoss || 0) > 0);
    const losingTrades = allTrades.filter((trade) => (trade.profitLoss || 0) < 0);

    const totalProfitLoss = allTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const winRate = stats.totalTrades > 0 ? (profitableTrades.length / stats.totalTrades) * 100 : 0;
    const uniqueTokens = new Set(allTrades.map((t) => t.tokenAddress)).size;
    const avgPriceImpact =
        stats.totalTrades > 0 ?
        allTrades.reduce((sum, t) => sum + (typeof t.priceImpact === 'number' ? t.priceImpact : 0), 0) /
        stats.totalTrades :
        0;

    const avgProfit =
        profitableTrades.length > 0 ?
        profitableTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / profitableTrades.length :
        0;

    const avgLoss =
        losingTrades.length > 0 ?
        losingTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / losingTrades.length :
        0;

    const bestTrade = allTrades.reduce(
        (best, trade) => ((trade.profitLoss || 0) > (best.profitLoss || 0) ? trade : best), { profitLoss: 0 }
    );

    const worstTrade = allTrades.reduce(
        (worst, trade) => ((trade.profitLoss || 0) < (worst.profitLoss || 0) ? trade : worst), { profitLoss: 0 }
    );

    return {
        overview: {
            totalTrades: stats.totalTrades,
            totalVolume: stats.totalVolume.toFixed(4),
            totalProfitLoss: totalProfitLoss.toFixed(4),
            winRate: winRate.toFixed(2),
            uniqueTokens: uniqueTokens,
            tradesToday: stats.tradesToday,
        },
        performance: {
            avgSlippage: stats.avgSlippage.toFixed(2),
            avgPriceImpact: avgPriceImpact.toFixed(2),
            totalGasUsed: stats.totalGasUsed,
            avgGasPerTrade: stats.totalTrades > 0 ? (stats.totalGasUsed / stats.totalTrades).toFixed(0) : 0,
        },
        risk: {
            currentRiskScore: riskMgmt.riskScore,
            dailyLoss: riskMgmt.dailyLoss.toFixed(4),
            riskLevel: riskMgmt.riskScore > 70 ?
                'HIGH' :
                riskMgmt.riskScore > 40 ?
                'MEDIUM' :
                riskMgmt.riskScore > 20 ?
                'LOW' :
                'SAFE',
        },
        trades: {
            profitable: profitableTrades.length,
            losing: losingTrades.length,
            avgProfit: avgProfit.toFixed(4),
            avgLoss: avgLoss.toFixed(4),
            bestTrade:
                (bestTrade.profitLoss || 0) > 0 ?
                {
                    token: bestTrade.tokenSymbol || 'UNKNOWN',
                    profit: bestTrade.profitLoss.toFixed(4),
                    date: new Date(bestTrade.timestamp).toLocaleString(),
                } :
                null,
            worstTrade:
                (worstTrade.profitLoss || 0) < 0 ?
                {
                    token: worstTrade.tokenSymbol || 'UNKNOWN',
                    loss: worstTrade.profitLoss.toFixed(4),
                    date: new Date(worstTrade.timestamp).toLocaleString(),
                } :
                null,
        },
    };
}

/**
 * Register Phase 2.4 Commands - COMPLETE
 */

// Trading history commands
commandManager.register('history', 'Show trading history ', async(bot, limit = '10') => {
    if (!bot.createTradingHistory) {
        bot.tradingHistory = createTradingHistory();
        console.log('Trading history initialized');

        return;
    }

    const trades = getTradeHistory(bot.tradingHistory, null, parseInt(limit));

    if (trades.length === 0) {
        console.log('No trading history found');
        return;
    }

    console.log(`\n === Trading History (Last ${trades.length} trades) ===`);
    trades.forEach((trade, index) => {
        console.log(`${index + 1}. ${trade.type.toUpperCase()} ${trade.tokenSymbol} `);
        console.log(`   Amount: ${trade.amount} | Price Impact: ${trade.priceImpact}%`);
        console.log(`   Slippage: ${trade.slippage}% | Gas Price: ${trade.gasUsed} `);
        console.log(`   P&L: ${trade.profitLoss} ETH | Date: ${trade.date}`);
        console.log('');
    });
    console.log('==========================================');
});

// Trading statistics command
commandManager.register('stats', 'Show comprehensive trading statistics', async(bot) => {
    if (!bot.tradingHistory) {
        bot.tradingHistory = createTradingHistory();
        console.log('�� Trading history initialized');
        return;
    }

    if (!bot.riskManagement) {
        bot.riskManagement = createRiskManagement();
    }

    const report = generatePerformanceReport(bot.tradingHistory, bot.riskManagement);

    console.log('\n=== �� COMPREHENSIVE TRADING REPORT ===');

    console.log('\n�� OVERVIEW:');
    console.log(`   Total Trades: ${report.overview.totalTrades}`);
    console.log(`   Total Volume: ${report.overview.totalVolume} ETH`);
    console.log(`   Total P&L: ${report.overview.totalProfitLoss} ETH`);
    console.log(`   Win Rate: ${report.overview.winRate}%`);
    console.log(`   Tokens Traded: ${report.overview.uniqueTokens}`);
    console.log(`   Trades Today: ${report.overview.tradesToday}`);

    console.log('\n⚡ PERFORMANCE:');
    console.log(`   Avg Slippage: ${report.performance.avgSlippage}%`);
    console.log(`   Avg Price Impact: ${report.performance.avgPriceImpact}%`);
    console.log(`   Total Gas Used: ${report.performance.totalGasUsed}`);
    console.log(`   Avg Gas/Trade: ${report.performance.avgGasPerTrade}`);

    console.log('\n⚠️ RISK METRICS:');
    console.log(`   Risk Score: ${report.risk.currentRiskScore}/100`);
    console.log(`   Risk Level: ${report.risk.riskLevel}`);
    console.log(`   Daily Loss: ${report.risk.dailyLoss} ETH`);

    console.log('\n💰 TRADE BREAKDOWN:');
    console.log(`   Profitable Trades: ${report.trades.profitable}`);
    console.log(`   Losing Trades: ${report.trades.losing}`);
    console.log(`   Avg Profit: ${report.trades.avgProfit} ETH`);
    console.log(`   Avg Loss: ${report.trades.avgLoss} ETH`);

    if (report.trades.bestTrade) {
        console.log(`   Best Trade: ${report.trades.bestTrade.profit} ETH (${report.trades.bestTrade.token})`);
    }
    if (report.trades.worstTrade) {
        console.log(`   Worst Trade: ${report.trades.worstTrade.loss} ETH (${report.trades.worstTrade.token})`);
    }

    console.log('\n==========================================');
});

// Gas optimization commands
commandManager.register('gas', 'Show current gas prices and recommendations', async(bot) => {
    const gasData = await getCurrentGasPrice(bot.provider);

    console.log('\n=== ⛽ GAS PRICE ANALYSIS ===');
    console.log(`Current Gas Price: ${gasData.formatted.gasPrice} gwei`);
    console.log(`Max Fee Per Gas: ${gasData.formatted.maxFeePerGas} gwei`);
    console.log(`Max Priority Fee: ${gasData.formatted.maxPriorityFeePerGas} gwei`);

    console.log('\n💡 RECOMMENDATIONS:');
    console.log(
        `   Low Priority: ${gasData.recommendations.low.maxFeePerGas} gwei (${gasData.recommendations.low.maxPriorityFeePerGas} priority)`
    );
    console.log(
        `   Medium Priority: ${gasData.recommendations.medium.maxFeePerGas} gwei (${gasData.recommendations.medium.maxPriorityFeePerGas} priority)`
    );
    console.log(
        `   High Priority: ${gasData.recommendations.high.maxFeePerGas} gwei (${gasData.recommendations.high.maxPriorityFeePerGas} priority)`
    );

    console.log('\n==========================================');
});

// Price impact analysis command
commandManager.register(
    'priceimpact',
    'Analyze price impact for a trade',
    async(bot, tokenAddress, amount, direction = 'buy') => {
        if (!tokenAddress || !amount) {
            console.error('Usage: priceimpact <tokenAddress> <amount> [direction]');
            console.error('Direction: buy or sell (default: buy)');
            return;
        }

        try {
            const contractManager = createContractManager(bot.provider, bot.wallet);
            const amountWei = direction === 'buy' ? ethers.parseEther(amount) : ethers.parseUnits(amount, 18);

            const impact = await calculatePriceImpact(contractManager, tokenAddress, amountWei, direction);

            console.log(`\n=== �� PRICE IMPACT ANALYSIS ===`);
            console.log(`Direction: ${direction.toUpperCase()}`);
            console.log(`Amount: ${amount} ${direction === 'buy' ? 'ETH' : 'tokens'}`);
            console.log(`Expected Output: ${impact.expectedOutput} ${direction === 'buy' ? 'tokens' : 'ETH'}`);
            console.log(`Price Impact: ${impact.priceImpact.toFixed(2)}%`);
            console.log(`Impact Level: ${impact.impactLevel}`);
            console.log(`Recommendation: ${impact.recommendation}`);
            console.log('==========================================');
        } catch (error) {
            console.error('Error analyzing price impact:', error.message);
        }
    }
);

// Risk assessment command
commandManager.register(
    'risk',
    'Assess risk for a potential trade',
    async(bot, tokenAddress, amount, slippage = '5') => {
        if (!tokenAddress || !amount) {
            console.error('Usage: risk <tokenAddress> <amount> [slippage]');
            return;
        }

        if (!bot.riskManagement) {
            bot.riskManagement = createRiskManagement();
        }

        try {
            const contractManager = createContractManager(bot.provider, bot.wallet);
            const amountWei = ethers.parseEther(amount);

            // Get price impact
            const impact = await calculatePriceImpact(contractManager, tokenAddress, amountWei, 'buy');

            // Get current gas price
            const gasData = await getCurrentGasPrice(bot.provider);

            const tradeData = {
                amount: parseFloat(amount),
                slippage: parseFloat(slippage),
                priceImpact: impact.priceImpact,
                gasPrice: parseFloat(gasData.formatted.gasPrice),
            };

            const riskAssessment = calculateRiskScore(bot.riskManagement, tradeData);

            console.log(`\n=== ⚠️ RISK ASSESSMENT ===`);
            console.log(`Trade Amount: ${amount} ETH`);
            console.log(`Slippage: ${slippage}%`);
            console.log(`Price Impact: ${impact.priceImpact.toFixed(2)}%`);
            console.log(`Gas Price: ${gasData.formatted.gasPrice} gwei`);

            console.log(`\nRisk Score: ${riskAssessment.riskScore}/100`);
            console.log(`Risk Level: ${riskAssessment.riskLevel}`);
            console.log(`Can Proceed: ${riskAssessment.canProceed ? '✅ YES' : '❌ NO'}`);

            if (riskAssessment.warnings.length > 0) {
                console.log('\n⚠️ WARNINGS:');
                riskAssessment.warnings.forEach((warning) => console.log(`   - ${warning}`));
            }

            console.log('\n💡 RECOMMENDATIONS:');
            riskAssessment.recommendations.forEach((rec) => console.log(`   - ${rec}`));

            console.log('==========================================');
        } catch (error) {
            console.error('Error assessing risk:', error.message);
        }
    }
);

// Enhanced buy command with analytics
commandManager.register(
    'buyanalytics',
    'Buy token with full analytics tracking',
    async(bot, tokenAddress, ethAmount, slippage = null) => {
        if (!tokenAddress || !ethAmount) {
            console.error('Usage: buyanalytics <tokenAddress> <ethAmount> [slippage]');
            return;
        }

        // Initialize systems if needed
        if (!bot.tradingHistory) bot.tradingHistory = createTradingHistory();
        if (!bot.riskManagement) bot.riskManagement = createRiskManagement();
        if (!bot.gasOptimization) bot.gasOptimization = createGasOptimization();

        try {
            console.log(`\n=== 🚀 ANALYTICS-ENHANCED BUY ORDER ===`);

            // Pre-trade analysis
            const contractManager = createContractManager(bot.provider, bot.wallet);
            const amountWei = ethers.parseEther(ethAmount);

            // Get price impact
            const impact = await calculatePriceImpact(contractManager, tokenAddress, amountWei, 'buy');

            // Get gas data
            const gasData = await getCurrentGasPrice(bot.provider);

            // Risk assessment
            const tradeData = {
                amount: parseFloat(ethAmount),
                slippage: parseFloat(slippage) || 5,
                priceImpact: impact.priceImpact,
                gasPrice: parseFloat(gasData.formatted.gasPrice),
            };

            const riskAssessment = calculateRiskScore(bot.riskManagement, tradeData);

            console.log(`\n�� PRE-TRADE ANALYSIS:`);
            console.log(`   Price Impact: ${impact.priceImpact.toFixed(2)}% (${impact.impactLevel})`);
            console.log(`   Risk Score: ${riskAssessment.riskScore}/100 (${riskAssessment.riskLevel})`);
            console.log(`   Gas Price: ${gasData.formatted.gasPrice} gwei`);

            if (!riskAssessment.canProceed) {
                console.log('❌ Trade blocked due to high risk!');
                return;
            }

            // Execute trade
            console.log(`\n🔄 Executing trade...`);
            const result = await buyTokenWithETHAdvanced(
                bot,
                tokenAddress,
                parseFloat(ethAmount),
                parseFloat(slippage)
            );

            if (result) {
                // Record trade in history
                const tokenInfo = getTokenInfo(bot, tokenAddress);
                const tradeRecord = {
                    type: 'buy',
                    tokenAddress: tokenAddress,
                    tokenSymbol: tokenInfo ? tokenInfo.symbol : 'UNKNOWN',
                    amount: ethAmount,
                    price: 0,
                    slippage: tradeData.slippage,
                    gasUsed: result.gasUsed || 0,
                    gasPrice: tradeData.gasPrice,
                    txHash: result.transactionHash || 'unknown',
                    priceImpact: impact.priceImpact,
                    profitLoss: 0,
                };

                const tradeId = recordTrade(bot.tradingHistory, tradeRecord);

                console.log(`✅ Trade successful!`);
                console.log(`   Trade ID: ${tradeId}`);
                console.log(`   TX Hash: ${result.transactionHash || 'unknown'}`);
                console.log(`   Gas Used: ${result.gasUsed || 'unknown'}`);
            } else {
                console.log('❌ Trade failed');
            }

            console.log('==========================================');
        } catch (error) {
            console.error('Error in analytics-enhanced buy:', error.message);
        }
    }
);

/**
 * Register Basic Commands
 *
 * These commands provide basic wallet and system information
 */

// Get wallet ETH balance
commandManager.register('balance', 'Get wallet balance (دریافت موجودی کیف پول)', async(bot) => {
    const balance = await getBalance(bot);
    console.log(`Current balance: ${balance} ETH`);
});

// Display complete wallet status
commandManager.register('status', 'Get wallet status', async(bot) => {
    await displayWalletInfo(bot);
});

// Show all available commands
commandManager.register('help', 'Show available commands', async() => {
    commandManager.list();
});

/**
 * Register Trading Commands
 *
 * These commands handle all trading operations
 */

// Buy token with ETH
commandManager.register('buy', 'Buy token with ETH', async(bot, tokenAddress, ethAmount) => {
    if (!tokenAddress || !ethAmount) {
        console.error('Usage: buy <tokenAddress> <ethAmount>');
        return;
    }

    const result = await buyTokenWithETH(bot, tokenAddress, parseFloat(ethAmount));
    if (result) {
        console.log('Buy order successful!');
    } else {
        console.log('Buy order failed');
    }
});

// Sell token for ETH
commandManager.register('sell', 'Sell token for ETH', async(bot, tokenAddress, tokenAmount) => {
    if (!tokenAddress || !tokenAmount) {
        console.error('Usage: sell <tokenAddress> <tokenAmount>');
        return;
    }
    const result = await sellTokenForETH(bot, tokenAddress, parseFloat(tokenAmount));
    if (result) {
        console.log('Sell order successful!');
    } else {
        console.log('Sell order failed');
    }
});

// Approve token spending for router
commandManager.register('approve', 'Approve token spending', async(bot, tokenAddress, amount) => {
    if (!tokenAddress || !amount) {
        console.error('Usage: approve <tokenAddress> <amount>');
        return;
    }

    try {
        const contractManager = createContractManager(bot.provider, bot.wallet);
        const token = contractManager.getTokenContract(tokenAddress);
        const amountWei = ethers.parseUnits(amount.toString(), 18);

        console.log(`Approving ${amount} tokens...`);

        const tx = await token.approve(CONTRACTS.ADDRESSES.ROUTER, amountWei);
        await tx.wait();
        console.log('Approval successful');
    } catch (error) {
        console.error('Error approving token:', error.message);
        return null;
    }
});

// Check token allowance for router
commandManager.register('allowance', 'Check token allowance', async(bot, tokenAddress) => {
    if (!tokenAddress) {
        console.error('Usage: allowance <tokenAddress>');
        return;
    }
    try {
        const contractManager = createContractManager(bot.provider, bot.wallet);
        const token = contractManager.getTokenContract(tokenAddress);

        const allowance = await token.allowance(bot.wallet.address, CONTRACTS.ADDRESSES.ROUTER);
        console.log(`Allowance: ${ethers.formatUnits(allowance, 18)} tokens`);
    } catch (error) {
        console.error('Error checking allowance:', error.message);
    }
});

// Add token to registry
commandManager.register('addToken', 'add token to registry', async(bot, tokenAddress, symbol) => {
    if (!tokenAddress || !symbol) {
        console.error('Usage: addtoken <tokenAddress> <symbol>');
        return;
    }
    addTokenToRegistry(bot, tokenAddress, symbol);
});

/**
 * Multi-Token Commands
 */
commandManager.register('tokens', 'List all registered tokens', async(bot) => {
    const tokens = getAllTokens(bot);

    if (tokens.length === 0) {
        console.log("no token registered. use 'addtoken' to add a token");
        return;
    }

    console.log('\n === Registered Tokens ===');

    tokens.forEach((token, index) => {
        console.log(`${index + 1}. ${token.symbol}`);
        console.log(`     Address: ${token.address}`);
        console.log(`     Decimals: ${token.decimals}`);
        console.log('');
    });
    console.log('========================');
});

// Get token balance
commandManager.register('tokenbalance', 'Get token balance', async(bot, tokenAddress) => {
    if (!tokenAddress) {
        console.error('Usage: tokenbalance <tokenAddress>');
        return;
    }

    try {
        const contractManager = createContractManager(bot.provider, bot.wallet);
        const token = contractManager.getTokenContract(tokenAddress);

        const balance = await token.balanceOf(bot.wallet.address);
        const tokenInfo = getTokenInfo(bot, tokenAddress);

        if (tokenInfo) {
            const formattedBalance = ethers.formatUnits(balance, tokenInfo.decimals);
            console.log(`${tokenInfo.symbol} balance: ${formattedBalance}`);
        } else {
            const formattedBalance = ethers.formatUnits(balance, 18);
            console.log(`Token Balance: ${formattedBalance}`);
        }
    } catch (error) {
        console.error('Error getting token balance:', error.message);
    }
});

// get all token balances
commandManager.register('allbalances', 'Get all registered token balances', async(bot) => {
    const balances = await getAllTokenBalances(bot);

    if (balances.length === 0) {
        console.log('No tokens registered. use "addtoken" to add a token');
        return;
    }
    console.log('\n === AllToken Balances ===');
    balances.forEach((token, index) => {
        console.log(`${index + 1}. ${token.symbol}: ${token.balance}`);
        console.log(`     Address: ${token.address}`);
    });
    console.log('========================');
});

//Adanced buy with custome slippage
commandManager.register(
    'buyadvanced',
    'Buy token with custome slippage',
    async(bot, tokenAddress, ethAmount, slippage) => {
        if (!tokenAddress || !ethAmount) {
            console.error('Usage: buyadvanced <tokenAddress> <ethAmount> [slippage]');
            return;
        }

        const customSlippage = slippage ? parseFloat(slippage) : null;
        const result = await buyTokenWithETHAdvanced(bot, tokenAddress, parseFloat(ethAmount), customSlippage);
        if (result) {
            console.log('Advanced buy order successful!');
        } else {
            console.log('Advanced buy order failed');
        }
    }
);

// Get market volatility
commandManager.register('volatility', 'Get market volatility for token', async(bot, tokenAddress) => {
    if (!tokenAddress) {
        console.error('Usage: volatility <tokenAddress>');
        return;
    }

    try {
        const volatility = await getMarketVolatility(bot, tokenAddress);
        console.log(`Market volatility: ${(volatility * 100).toFixed(2)}%`);
    } catch (error) {
        console.error('Error getting market volatility:', error.message);
    }
});

// Calculate optimal slippage
commandManager.register('slippage', 'Calculate optimal slippage for trade', async(bot, tokenAddress, amount) => {
    if (!tokenAddress || !amount) {
        console.error('Usage: slippage <tokenAddress> <amount>');
        return;
    }
    try {
        const amountWei = ethers.parseEther(amount);
        const optimalSlippage = await calculateOptimalSlippage(bot, tokenAddress, amountWei);
        console.log(`Optimal slippage: ${optimalSlippage}%`);
    } catch (error) {
        console.error('Error calculating slippage:', error.message);
    }
});

/**
 * Test Trading Bot
 *
 * Comprehensive test function that validates all bot functionality
 * Tests commands, trading operations, and bot lifecycle
 *
 * @returns {Promise<void>}
 */
async function testBot() {
    console.log('\n=== Testing Trading Bot ===');

    // Create bot instance
    const bot = createTradingBot(provider, wallet, config);

    // Test basic commands
    console.log('\n--- Testing Basic Commands ---');
    await commandManager.execute('help', bot);
    await commandManager.execute('balance', bot);
    await commandManager.execute('status', bot);

    // Test trading commands with test token
    console.log('\n--- Testing Trading Commands ---');
    await commandManager.execute('allowance', bot, CONTRACTS.ADDRESSES.TEST_TOKEN);
    await commandManager.execute('approve', bot, CONTRACTS.ADDRESSES.TEST_TOKEN, '1000');
    await commandManager.execute('allowance', bot, CONTRACTS.ADDRESSES.TEST_TOKEN);

    // Test bot lifecycle
    startBot(bot);
    console.log('Bot is running:', bot.isRunning);

    stopBot(bot);
    console.log('Bot is running:', bot.isRunning);

    console.log('=== Testing Trading Bot completed ===');
}

async function testAdvancedFeatures() {
    console.log('\n=== Testing Advanced multi-token Features ===');

    const bot = createTradingBot(provider, wallet, config);

    // Test multi-token registration
    console.log('\n--- Testing Multi-Token Registration ---');
    await commandManager.execute('addToken', bot, CONTRACTS.ADDRESSES.TEST_TOKEN, 'TEST');
    await commandManager.execute('addToken', bot, CONTRACTS.ADDRESSES.USDC, 'USDC');
    await commandManager.execute('tokens', bot);

    // Test advanced commands
    console.log('\n--- Testing Advanced Commands ---');
    await commandManager.execute('allbalances', bot);
    await commandManager.execute('volatility', bot, CONTRACTS.ADDRESSES.TEST_TOKEN);
    await commandManager.execute('slippage', bot, CONTRACTS.ADDRESSES.TEST_TOKEN, '0.1');

    // Test advanced trading
    console.log('\n--- Testing Advanced Trading ---');

    await commandManager.execute('buyadvanced', bot, CONTRACTS.ADDRESSES.TEST_TOKEN, '0.01', '3');

    console.log('=== Advanced Features Testing Completed ===');
}

/**
 * Test Phase 2.4 Features
 */
async function testPhase24Features() {
    console.log('\n=== 🧪 TESTING PHASE 2.4 FEATURES ===');

    const bot = createTradingBot(provider, wallet, config);

    // Initialize systems
    bot.tradingHistory = createTradingHistory();
    bot.riskManagement = createRiskManagement();
    bot.gasOptimization = createGasOptimization();

    // Test gas optimization
    console.log('\n--- Testing Gas Optimization ---');
    await commandManager.execute('gas', bot);

    // Test price impact analysis
    console.log('\n--- Testing Price Impact Analysis ---');
    await commandManager.execute('priceimpact', bot, CONTRACTS.ADDRESSES.TEST_TOKEN, '0.1', 'buy');

    // Test risk assessment
    console.log('\n--- Testing Risk Assessment ---');
    await commandManager.execute('risk', bot, CONTRACTS.ADDRESSES.TEST_TOKEN, '0.1', '5');

    // Test trading history (empty initially)
    console.log('\n--- Testing Trading History ---');
    await commandManager.execute('history', bot, '5');

    // Test statistics (empty initially)
    console.log('\n--- Testing Trading Statistics ---');
    await commandManager.execute('stats', bot);

    console.log('\n=== PHASE 2.4 TESTING COMPLETED ===');
}

/**
 * Main Application Entry Point
 *
 * Initializes the application and runs all tests
 *
 * @returns {Promise<void>}
 */
async function main() {
    await loadDeploymentAddressesIfAvailable();
    await testConnection();
    await testBot();
    await testAdvancedFeatures();
    await testPhase24Features();
}

// Start the application
main();