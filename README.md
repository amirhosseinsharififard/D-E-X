# DEX Trading Bot

A comprehensive trading bot for decentralized exchanges (DEX) built with ethers.js v6 and Hardhat for local development.

## 🚀 Features

- **ETH to Token Swaps**: Buy any ERC-20 token with ETH
- **Token to ETH Swaps**: Sell any ERC-20 token for ETH
- **Command-Based System**: Dynamic command registration and execution
- **Slippage Protection**: 5% slippage protection on all trades
- **Deadline Management**: 3-minute deadline for all transactions
- **Error Handling**: Comprehensive error handling for all operations
- **Contract Integration**: Full ERC-20 and Uniswap V2 integration
- **Real-time Monitoring**: Live balance and transaction tracking

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Hardhat local network running

## 🛠️ Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ethers.js
```

2. Install dependencies:

```bash
npm install
```

3. Start Hardhat local network:

```bash
npx hardhat node
```

4. Run the bot:

```bash
node index.js
```

## 🎯 Usage

### Basic Commands

| Command   | Description                 | Usage     |
| --------- | --------------------------- | --------- |
| `balance` | Get wallet ETH balance      | `balance` |
| `status`  | Get complete wallet status  | `status`  |
| `help`    | Show all available commands | `help`    |

### Trading Commands

| Command | Description        | Usage                               |
| ------- | ------------------ | ----------------------------------- |
| `buy`   | Buy token with ETH | `buy <tokenAddress> <ethAmount>`    |
| `sell`  | Sell token for ETH | `sell <tokenAddress> <tokenAmount>` |

### Token Management Commands

| Command     | Description            | Usage                             |
| ----------- | ---------------------- | --------------------------------- |
| `approve`   | Approve token spending | `approve <tokenAddress> <amount>` |
| `allowance` | Check token allowance  | `allowance <tokenAddress>`        |

## 📁 Project Structure

```
ethers.js/
├── index.js              # Main application file
├── package.json          # Dependencies and scripts
├── hardhat.config.ts     # Hardhat configuration
├── contracts/            # Solidity contracts
│   └── TestToken.sol     # Test ERC-20 token
├── scripts/              # Deployment scripts
│   └── deploy.js         # Contract deployment script
├── ROADMAP.md            # Development roadmap
├── FUNCTIONS.md          # Functions and capabilities
└── README.md             # This file
```

## 🔧 Configuration

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

## 🧪 Testing

The bot includes comprehensive testing functionality:

```javascript
// Test connection
await testConnection();

// Test all commands
await testBot();
```

## 📊 Development Status

### ✅ Completed Features

- [x] Basic system setup
- [x] Contract integration
- [x] Trading commands
- [x] Command system
- [x] Error handling
- [x] Slippage protection
- [x] Deadline management

### 🔄 In Development

- [ ] Advanced trading features
- [ ] Multi-token support
- [ ] Gas optimization
- [ ] Price impact analysis

### 📋 Planned Features

- [ ] **Smart Position Management System** - Advanced position tracking with exit strategies
- [ ] **Price Monitoring System** - Real-time price monitoring for position management
- [ ] **Exit Strategy Engine** - Automated stop-loss, take-profit, and trailing stops
- [ ] **Enhanced Data Persistence** - State saving and recovery system
- [ ] Futures trading system
- [ ] Web interface
- [ ] Automated strategies
- [ ] Performance analytics

## 🛡️ Security Features

- **Private Key Management**: Secure private key handling
- **Slippage Protection**: Prevents excessive slippage losses
- **Deadline Protection**: Prevents stale transactions
- **Balance Validation**: Ensures sufficient funds before trading
- **Approval Management**: Proper token approval handling

## 📈 Performance

- **Async/Await**: Non-blocking operations
- **Error Recovery**: Graceful error handling
- **Transaction Optimization**: Efficient gas usage
- **Real-time Updates**: Live balance and status updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please open an issue in the repository.

## 🔗 Links

- [ROADMAP.md](ROADMAP.md) - Development roadmap
- [FUNCTIONS.md](FUNCTIONS.md) - Functions and capabilities
- [SMART_POSITION_MANAGEMENT.md](SMART_POSITION_MANAGEMENT.md) - Smart Position Management System
- [FUTURE_ENHANCEMENTS.md](FUTURE_ENHANCEMENTS.md) - Future enhancements and ideas
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)

---

**Note**: This bot is for educational and development purposes. Use at your own risk in production environments.
