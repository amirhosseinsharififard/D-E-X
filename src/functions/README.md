# DEX Trading Bot - Core Functions

## 📋 Overview

This folder contains the core functions and capabilities of the DEX Trading Bot. It implements all the essential trading operations, wallet management, contract interactions, and command system as described in the FUNCTIONS.md specification.

## 📁 Files Structure

```
functions/
├── README.md           # This file - comprehensive documentation
├── FUNCTIONS.md        # Original specification document
├── FUNCTIONS.js        # Main implementation file
└── FUNCTIONS.test.js   # Comprehensive test suite
```

## 🚀 What This Module Does

### Core System Functions
- **Connection Management**: Test blockchain connections and display wallet information
- **Bot Lifecycle**: Create, start, and stop trading bot instances
- **Wallet Operations**: Get balances, status, and display wallet information
- **Contract Management**: Create and manage contract instances for tokens and DEX routers

### Trading Operations
- **Token Trading**: Buy tokens with ETH and sell tokens for ETH
- **Slippage Protection**: Built-in 5% slippage protection on all trades
- **Deadline Management**: 3-minute deadline for all transactions
- **Transaction Monitoring**: Track transaction hashes and block confirmations

### Command System
- **Dynamic Commands**: Register and execute commands dynamically
- **Basic Commands**: balance, status, help
- **Trading Commands**: buy, sell
- **Token Management**: approve, allowance
- **Position Management**: openposition, positions, closeposition, etc.

### Position Management (Planned Features)
- **Smart Position Tracking**: Open, monitor, and close positions
- **Exit Strategies**: Stop loss, take profit, trailing stops
- **Time-based Exits**: Automatic exits based on hold time
- **Risk Management**: Position sizing and risk percentage controls

## 🛠️ How It Works

### 1. Bot Initialization
```javascript
const { DEXTradingBot } = require('./FUNCTIONS');

// Create bot instance
const bot = new DEXTradingBot(provider, wallet, config);

// Start the bot
await bot.start();
```

### 2. Basic Operations
```javascript
// Check balance
const balance = await bot.getBalance();

// Get wallet status
const status = await bot.getStatus();

// Execute commands
await bot.executeCommand('balance');
await bot.executeCommand('buy', '0x123...', '0.1');
```

### 3. Trading Operations
```javascript
// Buy tokens with ETH
const buyResult = await bot.buyToken('0x123...', '0.1');

// Sell tokens for ETH
const sellResult = await bot.sellToken('0x123...', '100');
```

### 4. Position Management
```javascript
// Open a position with exit strategy
await bot.executeCommand('openposition', '0x123...', '0.1', 'long', '0.05', '0.15', '24');

// View open positions
await bot.executeCommand('positions');

// Close a position
await bot.executeCommand('closeposition', 'pos_1');
```

## 🔧 Key Features

### ✅ Implemented Features
- **Slippage Protection**: 5% slippage protection on all trades
- **Deadline Management**: 3-minute deadline for all transactions
- **Error Handling**: Comprehensive error handling for all operations
- **Command System**: Dynamic command registration and execution
- **Contract Integration**: Full ERC-20 and Uniswap V2 integration
- **Balance Checking**: Real-time balance and allowance checking
- **Transaction Monitoring**: Transaction hash and block confirmation tracking

### 🔄 In Development
- **Multi-token Support**: Support for multiple tokens simultaneously
- **Advanced Slippage**: Configurable slippage protection
- **Gas Optimization**: Dynamic gas price management
- **Price Impact Analysis**: Real-time price impact calculation

### 📋 Planned Features
- **Smart Position Management**: Advanced position tracking with exit strategies
- **Price Monitoring System**: Real-time price monitoring for position management
- **Exit Strategy Engine**: Automated stop-loss, take-profit, and trailing stops
- **Enhanced Data Persistence**: State saving and recovery system
- **Futures Trading**: Leveraged position management
- **Portfolio Management**: Multi-asset portfolio tracking
- **Risk Management**: Advanced risk assessment tools
- **Web Interface**: User-friendly web dashboard
- **Automated Strategies**: Pre-programmed trading strategies

## 📊 Configuration

### Network Configuration
```javascript
const config = {
    rpcUrl: 'http://localhost:8545', // Hardhat local network
    privateKey: '0x...', // Wallet private key
    routerAddress: '0x...', // Uniswap V2 Router
    wethAddress: '0x...', // Wrapped ETH
};
```

### Contract Addresses
```javascript
ADDRESSES: {
    ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Wrapped ETH
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USD Coin
    TEST_TOKEN: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Test token
}
```

## 🎯 Available Commands

### Basic Commands
| Command   | Description                 | Usage     | Parameters |
| --------- | --------------------------- | --------- | ---------- |
| `balance` | Get wallet ETH balance      | `balance` | None       |
| `status`  | Get complete wallet status  | `status`  | None       |
| `help`    | Show all available commands | `help`    | None       |

### Trading Commands
| Command | Description        | Usage                               | Parameters                |
| ------- | ------------------ | ----------------------------------- | ------------------------- |
| `buy`   | Buy token with ETH | `buy <tokenAddress> <ethAmount>`    | tokenAddress, ethAmount   |
| `sell`  | Sell token for ETH | `sell <tokenAddress> <tokenAmount>` | tokenAddress, tokenAmount |

### Token Management Commands
| Command     | Description            | Usage                             | Parameters           |
| ----------- | ---------------------- | --------------------------------- | -------------------- |
| `approve`   | Approve token spending | `approve <tokenAddress> <amount>` | tokenAddress, amount |
| `allowance` | Check token allowance  | `allowance <tokenAddress>`        | tokenAddress         |

### Position Management Commands (Planned)
| Command           | Description                      | Usage                                                                        | Parameters                                                    |
| ----------------- | -------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `openposition`    | Open position with exit strategy | `openposition <token> <amount> <type> <stopLoss> <takeProfit> [maxHoldTime]` | tokenAddress, amount, type, stopLoss, takeProfit, maxHoldTime |
| `positions`       | Show all open positions          | `positions`                                                                  | None                                                          |
| `closeposition`   | Close specific position          | `closeposition <positionId>`                                                 | positionId                                                    |
| `startmonitoring` | Start price monitoring           | `startmonitoring`                                                            | None                                                          |
| `stopmonitoring`  | Stop price monitoring            | `stopmonitoring`                                                             | None                                                          |
| `updatestop`      | Update stop loss                 | `updatestop <positionId> <newStopLoss>`                                      | positionId, newStopLoss                                       |
| `updatetarget`    | Update take profit               | `updatetarget <positionId> <newTakeProfit>`                                  | positionId, newTakeProfit                                     |

## 🔒 Security Features

- **Private Key Management**: Secure private key handling
- **Slippage Protection**: Prevents excessive slippage losses
- **Deadline Protection**: Prevents stale transactions
- **Balance Validation**: Ensures sufficient funds before trading
- **Approval Management**: Proper token approval handling

## ⚡ Performance Features

- **Async/Await**: Non-blocking operations
- **Error Recovery**: Graceful error handling
- **Transaction Optimization**: Efficient gas usage
- **Real-time Updates**: Live balance and status updates

## 🧪 Testing

The module includes comprehensive tests covering:

### Test Categories
- **Connection and Setup Tests**: Network connection, bot creation, lifecycle
- **Wallet Management Tests**: Balance checking, status reporting
- **Contract Management Tests**: Contract creation and caching
- **Trading Function Tests**: Buy/sell operations, error handling
- **Command System Tests**: Command registration and execution
- **Token Management Tests**: Approval and allowance operations
- **Position Management Tests**: Position lifecycle and monitoring
- **Utility Function Tests**: Address validation, error formatting
- **Integration Tests**: Complete workflow testing
- **Performance Tests**: Concurrent operations, large datasets
- **Error Handling Tests**: Network failures, invalid parameters

### Running Tests
```bash
# Run all tests
npm test src/functions/FUNCTIONS.test.js

# Run specific test suite
npm test -- --grep "Connection and Setup"

# Run with coverage
npm test -- --coverage src/functions/FUNCTIONS.test.js
```

## 📈 Usage Examples

### Basic Usage
```javascript
const { ethers } = require('ethers');
const { DEXTradingBot } = require('./FUNCTIONS');

// Setup
const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const wallet = new ethers.Wallet('0x...', provider);
const config = {
    rpcUrl: 'http://localhost:8545',
    privateKey: '0x...',
    routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    wethAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
};

// Create and start bot
const bot = new DEXTradingBot(provider, wallet, config);
await bot.start();

// Check balance
await bot.executeCommand('balance');

// Buy tokens
await bot.executeCommand('buy', '0x123...', '0.1');

// Sell tokens
await bot.executeCommand('sell', '0x123...', '100');
```

### Advanced Usage
```javascript
// Approve token spending
await bot.executeCommand('approve', '0x123...', '1000');

// Check allowance
await bot.executeCommand('allowance', '0x123...');

// Get wallet status
await bot.executeCommand('status');

// Open position with exit strategy
await bot.executeCommand('openposition', '0x123...', '0.1', 'long', '0.05', '0.15', '24');

// View open positions
await bot.executeCommand('positions');

// Close specific position
await bot.executeCommand('closeposition', 'pos_1');

// Start price monitoring
await bot.executeCommand('startmonitoring');

// Update stop loss
await bot.executeCommand('updatestop', 'pos_1', '0.08');

// Update take profit
await bot.executeCommand('updatetarget', 'pos_1', '0.20');
```

## 🔧 Dependencies

- **ethers.js v6**: Blockchain interaction
- **Node.js**: Runtime environment
- **Jest**: Testing framework (for tests)

## 🚨 Error Handling

All functions include comprehensive error handling for:
- Network connection errors
- Insufficient balance errors
- Transaction failure errors
- Contract interaction errors
- Parameter validation errors

## 📚 API Reference

### Main Class: DEXTradingBot

#### Constructor
```javascript
new DEXTradingBot(provider, wallet, config)
```

#### Methods
- `start()`: Start the trading bot
- `stop()`: Stop the trading bot
- `executeCommand(command, ...args)`: Execute a command
- `getStatus()`: Get wallet status
- `getBalance()`: Get wallet balance
- `buyToken(tokenAddress, ethAmount)`: Buy tokens with ETH
- `sellToken(tokenAddress, tokenAmount)`: Sell tokens for ETH

### Core Functions

#### Connection Management
- `testConnection(provider, wallet)`: Test blockchain connection
- `createTradingBot(provider, wallet, config)`: Create bot instance
- `startBot(bot)`: Start bot
- `stopBot(bot)`: Stop bot

#### Wallet Management
- `getBalance(bot)`: Get formatted balance
- `getWalletStatus(bot)`: Get complete status
- `displayWalletInfo(bot)`: Display wallet information

#### Trading Functions
- `buyTokenWithETH(bot, tokenAddress, ethAmount)`: Buy tokens
- `sellTokenForETH(bot, tokenAddress, tokenAmount)`: Sell tokens

#### Command System
- `registerCommands(bot)`: Register all commands
- `executeCommand(command, bot, ...args)`: Execute command
- `displayHelp()`: Show help information

## 🎯 Future Enhancements

This module serves as the foundation for more advanced features:

1. **Smart Position Management**: Advanced position tracking with automated exits
2. **Price Monitoring**: Real-time price feeds and monitoring
3. **Risk Management**: Advanced risk assessment and position sizing
4. **Multi-Exchange Support**: Support for multiple DEX protocols
5. **Strategy Engine**: Pre-programmed trading strategies
6. **Web Interface**: User-friendly dashboard
7. **Mobile App**: Mobile trading interface
8. **AI Integration**: Machine learning for trading decisions

## 🤝 Contributing

When contributing to this module:

1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Ensure error handling is robust
5. Test with both mainnet and testnet environments

## 📄 License

This module is part of the DEX Trading Bot project. See the main project license for details.

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Author**: DEX Bot Development Team
