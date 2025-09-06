// Import ethers.js library (version 6)
import { ethers } from "ethers";

// dotenv.config();
const config = {
    // Local Hardhat network
    rpcUrl: "http://localhost:8545",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // First Hardhat key

    // Contract addresses (will be filled later)
    routerAddress: "0x...", // Will be filled later
    wethAddress: "0x...", // Will be filled later
};

// Create provider and wallet
const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(config.privateKey, provider);

// Test connection
async function testConnection() {
    try {
        const balance = await provider.getBalance(wallet.address);
        console.log("Balance:", ethers.formatEther(balance), "ETH");
        console.log("Connection successful!");
    } catch (error) {
        console.error("Connection error:", error.message);
    }
}

// Trading Bot Functions
function createTradingBot(provider, wallet, config) {
    return {
        provider: provider, // اتصال به شبکه
        wallet: wallet, // کیف پول ما
        config: config, // تنظیمات
        isRunning: false, // وضعیت ربات (خاموش/روشن)
    };
}

// Start bot
function startBot(bot) {
    bot.isRunning = true;
    console.log("Trading bot started");
}

// Stop bot
function stopBot(bot) {
    bot.isRunning = false;
    console.log("Trading bot stopped");
}

// Test bot

// Get balance
async function getBalance(bot) {
    try {
        const balance = await bot.provider.getBalance(bot.wallet.address);
        return ethers.formatEther(balance);
    } catch (error) {
        console.error("Error getting balance:", error.message);
        return 0;
    }
}

// Get wallet status
async function getWalletStatus(bot) {
    try {
        const balance = await getBalance(bot);
        return {
            address: bot.wallet.address,
            balance: balance + "ETH",
            isRunning: bot.isRunning,
        };
    } catch (error) {
        console.error("Error getting wallet status:", error.message);
        return null;
    }
}

//Display wallet status
async function displayWalletInfo(bot) {
    console.log("\n === Wallet Information ===");
    const status = await getWalletStatus(bot);
    if (status) {
        console.log("address:", status.address);
        console.log("balance:", status.balance);
        console.log("Status:", status.isRunning ? "Running" : "Stopped");
    } else {
        console.log("Error getting wallet status");
    }
    console.log("========================");
}

// command maneger system
const commandManager = {
    commands: new Map(),

    // register  a new command
    register(name, description, handler) {
        this.commands.set(name, {
            description,
            handler,
            name,
        });
        console.log(`Command ${name} registered successfully`);
    },

    // execute a command
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

    // list all available commands
    list() {
        console.log("\n=== Available Commands ===");
        for (const [name, command] of this.commands) {
            console.log(`${name}: ${command.description}`);
        }
        console.log("========================");
    },
};

// Contract ABIs and Addresses
const CONTRACTS = {
    // ERC-20 Token ABI
    ERC20_ABI: [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function name() view returns (string)",
        "function symbol() view returns (string)",
    ],

    // Uniswap V2 Router ABI
    ROUTER_ABI: [
        "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
        "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
        "function WETH() external pure returns (address)",
    ],

    // Contract addresses (Hardhat local)
    ADDRESSES: {
        ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
        WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
        USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    },
};

//contract manager
function createContractManager(provider, wallet) {
    return {
        provider,
        wallet,

        //create contract instance
        getContract(address, abi) {
            return new ethers.Contract(address, abi, wallet);
        },

        //get token contract
        getTokenContract(tokenAddress) {
            return this.getContract(tokenAddress, CONTRACTS.ERC20_ABI);
        },

        // Get router contract
        getRouterContract() {
            return this.getContract(CONTRACTS.ADDRESSES.ROUTER, CONTRACTS.ROUTER_ABI);
        },
    };
}

// trading functions
async function buyTokenWithETH(bot, tokenAddress, ethAmount) {
    try {
        console.log(`Buying token with ${ethAmount} ETH`);

        const contractManager = createContractManager(bot.provider, bot.wallet);
        const router = contractManager.getRouterContract();

        //convert eth to wei
        const amountIn = ethers.parseEther(ethAmount.toString());

        //get expected output
        const amoutOut = await router.getAmountsOut(amountIn, path);
        const amoutnOutMin = (amoutOut[1] * `95n`) / `100n`; // 5% slippage;

        console.log(
            `expected to receive: ${ethers.formatUnits(amoutOut[1], 18)} tokens`
        );

        const tx = await router.swapExactETHForTokens(
            amoutnOutMin,
            path,
            bot.wallet.address,

            deadline, {
                value: amountIn,
            }
        );

        console.log("Transaction sent: ", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block: ", receipt.blockNumber);
        console.log("transaction successfull", receipt.status);
        return receipt;
    } catch (error) {
        console.error("Error buying token:", error.message);
        return null;
    }
}

// sell token
async function sellTokenForETH(bot, tokenAddress, tokenAmount) {
    try {
        console.log(`Selling  ${tokenAmount} token for ETH...`);

        const contractManager = createContractManager(bot.provider, bot.wallet);
        const router = contractManager.getRouterContract();
        const token = contractManager.getTokenContract(tokenAddress);

        //convert token amount to wei
        const amountIn = ethers.parseUnits(tokenAmount.toString(), 18);
        //check balance
        const balance = await token.balanceOf(bot.wallet.address);
        if (balance < amountIn) {
            console.error("Insufficient tokenbalance");
            return null;
        }

        //approve token spending
        console.log("approving token spending...");
        const approveTx = await token.approve(router.address, amountIn);
        await approveTx.wait();

        //trading path: toen->weth->eth
        const path = [tokenAddress, CONTRACTS.ADDRESSES.WETH];

        //get expected output
        const amountsOut = await router.getAmountsOut(amountIn, path);
        const amoutnOutMin = (amountsOut[1] * `95n`) / `100n`; // 5% slippage

        console.log(
            `expected to receive: ${ethers.formatUnits(amountsOut[1])} ETH`
        );

        //set deadline
        const deadline = Math.floor(Date.now() / 1000) + 180; // 3 دقیقه

        // Execute swap
        const tx = await router.swaExpactTokensForETH(
            amountIn,
            amountsOut,
            path,
            bot.wallet.address,
            deadline
        );

        console.log(`transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log("transaction confirmed in block: ", receipt.blockNumber);
        console.log("transaction successfull", receipt.status);
        return receipt;
    } catch (error) {
        console.error("Error selling token:", error.message);
        return null;
    }
}

// Register basic commands
commandManager.register("balance", "Get wallet balance", async(bot) => {
    const balance = await getBalance(bot);
    console.log(`Current balance: ${balance} ETH`);
});

commandManager.register("status", "Get wallet status", async(bot) => {
    await displayWalletInfo(bot);
});

commandManager.register("help", "Show available commands", async() => {
    commandManager.list();
});

async function testBot() {
    console.log("\n=== Testing Trading Bot ===");

    // create bot
    const bot = createTradingBot(provider, wallet, config);

    console.log("\n--- Testing Commands ---");
    await commandManager.execute("help", bot);
    await commandManager.execute("balance", bot);
    await commandManager.execute("status", bot);

    // start bot
    startBot(bot);
    console.log("bot is running", bot.isRunning);

    // stop bot
    stopBot(bot);
    console.log("bot is running", bot.isRunning);

    console.log("=== Testing Trading Bot completed ===");
}

async function main() {
    await testConnection();
    await testBot();
}

main();