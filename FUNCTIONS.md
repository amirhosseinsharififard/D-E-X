# DEX Trading Bot - Functions & Capabilities

## Overview

This document provides a comprehensive list of all implemented functions, features, and commands in the DEX Trading Bot.

## Core System Functions

### 1. Connection & Setup

- **`testConnection()`** - Tests blockchain network connection and displays wallet balance
- **`createTradingBot(provider, wallet, config)`** - Creates a new trading bot instance
- **`startBot(bot)`** - Starts the trading bot
- **`stopBot(bot)`** - Stops the trading bot

### 2. Wallet Management

- **`getBalance(bot)`** - Gets wallet ETH balance in formatted string
- **`getWalletStatus(bot)`** - Gets complete wallet status (address, balance, running state)
- **`displayWalletInfo(bot)`** - Displays formatted wallet information

### 3. Contract Management

- **`createContractManager(provider, wallet)`** - Creates contract manager instance
- **`getContract(address, abi)`** - Creates contract instance
- **`getTokenContract(tokenAddress)`** - Gets ERC-20 token contract
- **`getRouterContract()`** - Gets Uniswap V2 router contract

### 4. Trading Functions

- **`buyTokenWithETH(bot, tokenAddress, ethAmount)`** - Buys token with ETH
- **`sellTokenForETH(bot, tokenAddress, tokenAmount)`** - Sells token for ETH

## Command System

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

## Configuration

### Network Configuration

```javascript
const config = {
  rpcUrl: "http://localhost:8545", // Hardhat local network
  privateKey: "0x...", // Wallet private key
  routerAddress: "0x...", // Uniswap V2 Router
  wethAddress: "0x...", // Wrapped ETH
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

## Features

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

- **Futures Trading**: Leveraged position management
- **Portfolio Management**: Multi-asset portfolio tracking
- **Risk Management**: Advanced risk assessment tools
- **Web Interface**: User-friendly web dashboard
- **Automated Strategies**: Pre-programmed trading strategies

## Usage Examples

### Basic Usage

```javascript
// Create bot
const bot = createTradingBot(provider, wallet, config);

// Check balance
await commandManager.execute("balance", bot);

// Buy tokens
await commandManager.execute("buy", bot, "0x...", "0.1");

// Sell tokens
await commandManager.execute("sell", bot, "0x...", "100");
```

### Advanced Usage

```javascript
// Approve token spending
await commandManager.execute("approve", bot, "0x...", "1000");

// Check allowance
await commandManager.execute("allowance", bot, "0x...");

// Get wallet status
await commandManager.execute("status", bot);
```

## Error Handling

All functions include comprehensive error handling:

- Network connection errors
- Insufficient balance errors
- Transaction failure errors
- Contract interaction errors
- Parameter validation errors

## Security Features

- **Private Key Management**: Secure private key handling
- **Slippage Protection**: Prevents excessive slippage losses
- **Deadline Protection**: Prevents stale transactions
- **Balance Validation**: Ensures sufficient funds before trading
- **Approval Management**: Proper token approval handling

## Performance

- **Async/Await**: Non-blocking operations
- **Error Recovery**: Graceful error handling
- **Transaction Optimization**: Efficient gas usage
- **Real-time Updates**: Live balance and status updates

## Dependencies

- **ethers.js v6**: Blockchain interaction
- **Hardhat**: Local development environment
- **Node.js**: Runtime environment

## Testing

- **Comprehensive Testing**: All functions are tested
- **Command Validation**: All commands are validated
- **Error Scenarios**: Error handling is tested
- **Integration Testing**: Full system integration tests
