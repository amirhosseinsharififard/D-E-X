// وارد کردن وابستگی‌های مورد نیاز
import { WebSocketProvider } from "@ethersproject/providers";
import { ethers, providers, Wallet } from "ethers";
require("dotenv").config(); // برای خواندن متغیرهای محیطی

// کتابخانه‌های اضافی برای بهبود عملکرد
import retry from "async-retry";
import winston from "winston";

// تنظیمات لاگینگ ساختاریافته
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        new winston.transports.File({ filename: "bot-error.log", level: "error" }),
        new winston.transports.File({ filename: "bot-combined.log" }),
    ],
});

// کلاس مدیریت خطاهای سفارشی
class TradingBotError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = "TradingBotError";
        this.code = code;
        this.details = details;
    }
}

// کلاس اعتبارسنجی تنظیمات
class ConfigValidator {
    static validate(config) {
        const errors = [];

        // بررسی متغیرهای ضروری
        if (!config.privateKey ||
            !ethers.utils.isHexString(config.privateKey, 32)
        ) {
            errors.push("کلید خصوصی نامعتبر یا گم شده");
        }

        if (!config.rpcUrl || !config.rpcUrl.startsWith("http")) {
            errors.push("آدرس RPC نامعتبر");
        }

        if (!config.wsUrl || !config.wsUrl.startsWith("ws")) {
            errors.push("آدرس WebSocket نامعتبر");
        }

        if (!ethers.utils.isAddress(config.routerAddress)) {
            errors.push("آدرس روتر نامعتبر");
        }

        if (!ethers.utils.isAddress(config.wethAddress)) {
            errors.push("آدرس WETH نامعتبر");
        }

        if (!ethers.utils.isAddress(config.usdcAddress)) {
            errors.push("آدرس USDC نامعتبر");
        }

        if (config.slippageTolerance < 0 || config.slippageTolerance > 50) {
            errors.push("تحمل لغزش باید بین 0 تا 50 درصد باشد");
        }

        if (errors.length > 0) {
            throw new TradingBotError("خطا در تنظیمات", "CONFIG_ERROR", { errors });
        }

        return true;
    }
}

// تنظیمات ربات معاملاتی DEX با متغیرهای محیطی
const config = {
    // تنظیمات شبکه
    rpcUrl: process.env.RPC_URL || "YOUR_INFURA_OR_ALCHEMY_URL",
    wsUrl: process.env.WS_URL || "YOUR_WEBSOCKET_URL",
    fallbackRpcUrl: process.env.FALLBACK_RPC_URL, // RPC پشتیبان

    // تنظیمات کیف پول
    privateKey: process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY",

    // آدرس قراردادها
    routerAddress: process.env.ROUTER_ADDRESS || "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    wethAddress: process.env.WETH_ADDRESS || "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    usdcAddress: process.env.USDC_ADDRESS || "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    futuresMarketAddress: process.env.FUTURES_MARKET_ADDRESS || "0xFUTURES_MARKET_ADDRESS",

    // تنظیمات گاز (پویا خواهد شد)
    gasLimit: parseInt(process.env.GAS_LIMIT) || 300000,
    maxGasPrice: ethers.utils.parseUnits(
        process.env.MAX_GAS_PRICE || "100",
        "gwei"
    ),

    // تنظیمات معاملاتی
    slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE) || 1,
    tradeAmount: ethers.utils.parseUnits(
        process.env.TRADE_AMOUNT || "0.1",
        "ether"
    ),
    minTokenAmount: ethers.utils.parseUnits(
        process.env.MIN_TOKEN_AMOUNT || "10",
        6
    ),

    // تنظیمات اتصال مجدد
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
};

// اعتبارسنجی تنظیمات
try {
    ConfigValidator.validate(config);
    logger.info("تنظیمات با موفقیت اعتبارسنجی شد");
} catch (error) {
    logger.error("خطا در تنظیمات:", error);
    process.exit(1);
}

// ABI توکن ERC-20 (بهبود یافته)
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
];

// ABI روتر Uniswap V2 (بهبود یافته)
const ROUTER_ABI = [
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
    "function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function WETH() external pure returns (address)",
];

// ABI بازار آتی (بهبود یافته)
const FUTURES_ABI = [
    "function openPosition(address market, uint256 amountIn, bool isLong, uint256 leverage) external returns (uint256)",
    "function closePosition(uint256 positionId) external returns (bool)",
    "function getPosition(uint256 positionId) external view returns (tuple(address market, uint256 size, bool isLong, uint256 leverage, uint256 entryPrice, uint256 pnl))",
    "function getPositions(address user) external view returns (uint256[] memory)",
    "event PositionOpened(uint256 indexed positionId, address indexed user, address market, uint256 size, bool isLong, uint256 leverage)",
    "event PositionClosed(uint256 indexed positionId, address indexed user, uint256 pnl)",
];

// کلاس مدیریت ارائه‌دهندگان
class ProviderManager {
    constructor(config) {
        this.config = config;
        this.providers = [];
        this.wsProvider = null;
        this.currentProviderIndex = 0;
    }

    /**
     * راه‌اندازی ارائه‌دهندگان با سیستم پشتیبان
     */
    async initialize() {
        try {
            // ایجاد لیست ارائه‌دهندگان
            const providerUrls = [this.config.rpcUrl];
            if (this.config.fallbackRpcUrl) {
                providerUrls.push(this.config.fallbackRpcUrl);
            }

            // ایجاد ارائه‌دهندگان
            this.providers = providerUrls.map(
                (url) =>
                new providers.JsonRpcProvider(url, "homestead", {
                    name: "mainnet",
                    chainId: 1,
                })
            );

            // ایجاد ارائه‌دهنده اصلی با پشتیبان
            this.provider = new providers.FallbackProvider(
                this.providers.map((provider, index) => ({
                    provider,
                    priority: index === 0 ? 1 : 0,
                    weight: index === 0 ? 1 : 0.5,
                }))
            );

            // راه‌اندازی WebSocket
            this.wsProvider = new WebSocketProvider(this.config.wsUrl);
            this.setupWebSocketReconnection();

            logger.info("ارائه‌دهندگان با موفقیت راه‌اندازی شدند");
            return true;
        } catch (error) {
            logger.error("خطا در راه‌اندازی ارائه‌دهندگان:", error);
            throw new TradingBotError(
                "خطا در راه‌اندازی ارائه‌دهندگان",
                "PROVIDER_ERROR", { error: error.message }
            );
        }
    }

    /**
     * راه‌اندازی اتصال مجدد WebSocket
     */
    setupWebSocketReconnection() {
        this.wsProvider.on("error", (error) => {
            logger.warn("خطا در WebSocket:", error.message);
        });

        this.wsProvider.on("close", () => {
            logger.warn("اتصال WebSocket بسته شد، تلاش برای اتصال مجدد...");
            setTimeout(() => {
                this.reconnectWebSocket();
            }, 5000);
        });
    }

    /**
     * اتصال مجدد WebSocket
     */
    async reconnectWebSocket() {
        try {
            this.wsProvider = new WebSocketProvider(this.config.wsUrl);
            this.setupWebSocketReconnection();
            logger.info("اتصال WebSocket مجدداً برقرار شد");
        } catch (error) {
            logger.error("خطا در اتصال مجدد WebSocket:", error);
        }
    }

    /**
     * دریافت قیمت گاز پویا
     */
    async getDynamicGasPrice() {
        try {
            const feeData = await this.provider.getFeeData();
            let gasPrice;

            if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
                // EIP-1559
                gasPrice = feeData.maxFeePerGas;
            } else if (feeData.gasPrice) {
                // Legacy
                gasPrice = feeData.gasPrice;
            } else {
                // Fallback
                gasPrice = ethers.utils.parseUnits("20", "gwei");
            }

            // محدود کردن حداکثر قیمت گاز
            if (gasPrice.gt(this.config.maxGasPrice)) {
                gasPrice = this.config.maxGasPrice;
                logger.warn(
                    `قیمت گاز به حداکثر محدود شد: ${ethers.utils.formatUnits(
            gasPrice,
            "gwei"
          )} gwei`
                );
            }

            return gasPrice;
        } catch (error) {
            logger.error("خطا در دریافت قیمت گاز:", error);
            return ethers.utils.parseUnits("20", "gwei"); // Fallback
        }
    }
}

// کلاس مدیریت قراردادها
class ContractManager {
    constructor(provider, wallet, config) {
        this.provider = provider;
        this.wallet = wallet;
        this.config = config;
        this.contracts = new Map();
    }

    /**
     * راه‌اندازی قراردادها
     */
    async initialize() {
        try {
            // ایجاد قراردادها
            this.contracts.set(
                "router",
                new ethers.Contract(this.config.routerAddress, ROUTER_ABI, this.wallet)
            );
            this.contracts.set(
                "weth",
                new ethers.Contract(this.config.wethAddress, ERC20_ABI, this.wallet)
            );
            this.contracts.set(
                "usdc",
                new ethers.Contract(this.config.usdcAddress, ERC20_ABI, this.wallet)
            );

            if (
                this.config.futuresMarketAddress &&
                this.config.futuresMarketAddress !== "0xFUTURES_MARKET_ADDRESS"
            ) {
                this.contracts.set(
                    "futures",
                    new ethers.Contract(
                        this.config.futuresMarketAddress,
                        FUTURES_ABI,
                        this.wallet
                    )
                );
            }

            // اعتبارسنجی قراردادها
            await this.verifyContracts();

            logger.info("قراردادها با موفقیت راه‌اندازی شدند");
            return true;
        } catch (error) {
            logger.error("خطا در راه‌اندازی قراردادها:", error);
            throw new TradingBotError(
                "خطا در راه‌اندازی قراردادها",
                "CONTRACT_ERROR", { error: error.message }
            );
        }
    }

    /**
     * اعتبارسنجی قراردادها
     */
    async verifyContracts() {
        const contractAddresses = [
            { name: "router", address: this.config.routerAddress },
            { name: "weth", address: this.config.wethAddress },
            { name: "usdc", address: this.config.usdcAddress },
        ];

        for (const contract of contractAddresses) {
            try {
                const code = await this.provider.getCode(contract.address);
                if (code === "0x") {
                    throw new Error(
                        `هیچ قراردادی در آدرس ${contract.address} مستقر نشده`
                    );
                }
                logger.info(`قرارداد ${contract.name} تأیید شد`);
            } catch (error) {
                throw new TradingBotError(
                    `خطا در اعتبارسنجی قرارداد ${contract.name}`,
                    "CONTRACT_VERIFICATION_ERROR", {
                        contract: contract.name,
                        address: contract.address,
                        error: error.message,
                    }
                );
            }
        }
    }

    /**
     * دریافت قرارداد
     */
    getContract(name) {
        const contract = this.contracts.get(name);
        if (!contract) {
            throw new TradingBotError(
                `قرارداد ${name} یافت نشد`,
                "CONTRACT_NOT_FOUND"
            );
        }
        return contract;
    }
}

// کلاس ربات معاملاتی DEX بهبود یافته
class DEXTradingBot {
    constructor(config) {
        this.config = config;
        this.providerManager = new ProviderManager(config);
        this.contractManager = null;
        this.wallet = null;
        this.positions = new Map(); // ردیابی پوزیشن‌های آتی
        this.isRunning = false;
        this.healthCheckInterval = null;
    }

    /**
     * مقداردهی اولیه ربات معاملاتی DEX
     */
    async initialize() {
        try {
            logger.info("شروع مقداردهی اولیه ربات معاملاتی DEX...");

            // راه‌اندازی ارائه‌دهندگان
            await this.providerManager.initialize();

            // ایجاد کیف پول
            this.wallet = new Wallet(
                this.config.privateKey,
                this.providerManager.provider
            );
            logger.info(`کیف پول متصل شد: ${this.wallet.address}`);

            // بررسی موجودی
            const balance = await this.wallet.getBalance();
            logger.info(`موجودی کیف پول: ${ethers.utils.formatEther(balance)} ETH`);

            if (balance.eq(0)) {
                logger.warn("هشدار: موجودی کیف پول صفر است");
            }

            // راه‌اندازی قراردادها
            this.contractManager = new ContractManager(
                this.providerManager.provider,
                this.wallet,
                this.config
            );
            await this.contractManager.initialize();

            // راه‌اندازی شنوندگان
            this.setupEventListeners();

            // شروع بررسی سلامت
            this.startHealthCheck();

            logger.info("ربات معاملاتی DEX با موفقیت مقداردهی اولیه شد!");
            return true;
        } catch (error) {
            logger.error("مقداردهی اولیه ناموفق:", error);
            return false;
        }
    }

    /**
     * راه‌اندازی شنوندگان رویداد
     */
    setupEventListeners() {
        // شنیدن بلاک‌های جدید
        this.providerManager.provider.on("block", (blockNumber) => {
            logger.debug(`بلاک جدید: ${blockNumber}`);
        });

        // شنیدن تراکنش‌های در انتظار (فیلتر شده)
        this.providerManager.wsProvider.on("pending", async(txHash) => {
            try {
                const tx = await this.providerManager.wsProvider.getTransaction(txHash);
                if (
                    tx &&
                    (tx.from === this.wallet.address ||
                        tx.to === this.config.routerAddress)
                ) {
                    this.handlePendingTransaction(txHash, tx);
                }
            } catch (error) {
                // نادیده گرفتن خطاهای جزئی در پردازش تراکنش‌های در انتظار
                logger.debug(`خطا در پردازش تراکنش ${txHash}:`, error.message);
            }
        });

        // شنیدن رویدادهای پوزیشن آتی
        if (this.contractManager.contracts.has("futures")) {
            const futuresContract = this.contractManager.getContract("futures");

            futuresContract.on(
                "PositionOpened",
                (positionId, user, market, size, isLong, leverage, event) => {
                    if (user === this.wallet.address) {
                        this.positions.set(positionId.toString(), {
                            market,
                            size,
                            isLong,
                            leverage,
                            entryPrice: 0, // باید از قرارداد دریافت شود
                            timestamp: Date.now(),
                        });
                        logger.info(`پوزیشن جدید باز شد: ${positionId}`);
                    }
                }
            );

            futuresContract.on("PositionClosed", (positionId, user, pnl, event) => {
                if (user === this.wallet.address) {
                    this.positions.delete(positionId.toString());
                    logger.info(
                        `پوزیشن بسته شد: ${positionId}, PnL: ${ethers.utils.formatEther(
              pnl
            )} ETH`
                    );
                }
            });
        }
    }

    /**
     * مدیریت تراکنش‌های در انتظار
     */
    async handlePendingTransaction(txHash, tx) {
        try {
            if (tx.from === this.wallet.address) {
                logger.info(`تراکنش خروجی شناسایی شد: ${txHash}`);
                logger.info(`به: ${tx.to}`);
                logger.info(`مقدار: ${ethers.utils.formatEther(tx.value)} ETH`);
                logger.info(
                    `قیمت گاز: ${ethers.utils.formatUnits(tx.gasPrice, "gwei")} gwei`
                );
            }
        } catch (error) {
            logger.error("خطا در مدیریت تراکنش در انتظار:", error);
        }
    }

    /**
     * دریافت موجودی توکن با مدیریت خطا
     */
    async getTokenBalance(tokenAddress) {
        return await retry(
            async() => {
                try {
                    const tokenContract = new ethers.Contract(
                        tokenAddress,
                        ERC20_ABI,
                        this.wallet
                    );
                    const [balance, decimals] = await Promise.all([
                        tokenContract.balanceOf(this.wallet.address),
                        tokenContract.decimals(),
                    ]);
                    return {
                        balance: ethers.utils.formatUnits(balance, decimals),
                        raw: balance,
                        decimals,
                    };
                } catch (error) {
                    throw new TradingBotError(
                        "خطا در دریافت موجودی توکن",
                        "BALANCE_ERROR", {
                            tokenAddress,
                            error: error.message,
                        }
                    );
                }
            }, {
                retries: this.config.maxRetries,
                minTimeout: this.config.retryDelay,
                maxTimeout: this.config.retryDelay * 2,
            }
        );
    }

    /**
     * تأیید توکن با مدیریت خطا
     */
    async approveToken(tokenAddress, spenderAddress, amount) {
        return await retry(
            async() => {
                try {
                    logger.info(`تأیید ${ethers.utils.formatUnits(amount, 18)} توکن...`);

                    const tokenContract = new ethers.Contract(
                        tokenAddress,
                        ERC20_ABI,
                        this.wallet
                    );

                    // دریافت قیمت گاز پویا
                    const gasPrice = await this.providerManager.getDynamicGasPrice();

                    // تخمین گاز
                    const gasLimit = await tokenContract.estimateGas.approve(
                        spenderAddress,
                        amount
                    );

                    const tx = await tokenContract.approve(spenderAddress, amount, {
                        gasLimit: gasLimit.mul(120).div(100), // 20% buffer
                        gasPrice,
                    });

                    const receipt = await tx.wait();
                    logger.info(`تأیید موفق: ${receipt.transactionHash}`);
                    return receipt;
                } catch (error) {
                    if (error.code === "INSUFFICIENT_FUNDS") {
                        throw new TradingBotError(
                            "موجودی ناکافی برای پرداخت گاز",
                            "INSUFFICIENT_FUNDS"
                        );
                    } else if (error.reason) {
                        throw new TradingBotError(
                            `تراکنش لغو شد: ${error.reason}`,
                            "TRANSACTION_REVERTED"
                        );
                    } else {
                        throw new TradingBotError("خطا در تأیید توکن", "APPROVAL_ERROR", {
                            error: error.message,
                        });
                    }
                }
            }, {
                retries: this.config.maxRetries,
                minTimeout: this.config.retryDelay,
                maxTimeout: this.config.retryDelay * 2,
            }
        );
    }

    /**
     * خرید توکن با ETH (بهبود یافته)
     */
    async buyTokenWithETH(tokenAddress, ethAmount) {
        return await retry(
            async() => {
                try {
                    logger.info(
                        `خرید توکن با ${ethers.utils.formatEther(ethAmount)} ETH...`
                    );

                    const router = this.contractManager.getContract("router");

                    // دریافت مقدار خروجی مورد انتظار
                    const path = [this.config.wethAddress, tokenAddress];
                    const amountsOut = await router.getAmountsOut(ethAmount, path);
                    const amountOutMin = amountsOut[1]
                        .mul(100 - this.config.slippageTolerance)
                        .div(100);

                    logger.info(
                        `انتظار دریافت: ${ethers.utils.formatUnits(amountsOut[1], 18)} توکن`
                    );
                    logger.info(
                        `حداقل قابل قبول با لغزش: ${ethers.utils.formatUnits(
              amountOutMin,
              18
            )} توکن`
                    );

                    // دریافت قیمت گاز پویا
                    const gasPrice = await this.providerManager.getDynamicGasPrice();

                    // تخمین گاز
                    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 دقیقه
                    const gasLimit = await router.estimateGas.swapExactETHForTokens(
                        amountOutMin,
                        path,
                        this.wallet.address,
                        deadline, { value: ethAmount }
                    );

                    // اجرای تعویض
                    const tx = await router.swapExactETHForTokens(
                        amountOutMin,
                        path,
                        this.wallet.address,
                        deadline, {
                            value: ethAmount,
                            gasLimit: gasLimit.mul(120).div(100), // 20% buffer
                            gasPrice,
                        }
                    );

                    const receipt = await tx.wait();
                    logger.info(`خرید توکن موفق: ${receipt.transactionHash}`);
                    return receipt;
                } catch (error) {
                    if (error.code === "INSUFFICIENT_FUNDS") {
                        throw new TradingBotError(
                            "موجودی ETH ناکافی",
                            "INSUFFICIENT_FUNDS"
                        );
                    } else if (error.reason) {
                        throw new TradingBotError(
                            `تراکنش لغو شد: ${error.reason}`,
                            "TRANSACTION_REVERTED"
                        );
                    } else {
                        throw new TradingBotError("خطا در خرید توکن با ETH", "BUY_ERROR", {
                            error: error.message,
                        });
                    }
                }
            }, {
                retries: this.config.maxRetries,
                minTimeout: this.config.retryDelay,
                maxTimeout: this.config.retryDelay * 2,
            }
        );
    }

    /**
     * فروش توکن برای ETH (بهبود یافته)
     */
    async sellTokenForETH(tokenAddress, tokenAmount) {
        return await retry(
            async() => {
                try {
                    logger.info(
                        `فروش ${ethers.utils.formatUnits(tokenAmount, 18)} توکن برای ETH...`
                    );

                    const router = this.contractManager.getContract("router");
                    const tokenContract = new ethers.Contract(
                        tokenAddress,
                        ERC20_ABI,
                        this.wallet
                    );

                    // بررسی موجودی کافی
                    const balance = await tokenContract.balanceOf(this.wallet.address);
                    if (balance.lt(tokenAmount)) {
                        throw new TradingBotError(
                            `موجودی توکن ناکافی. موجود: ${ethers.utils.formatUnits(
                balance,
                18
              )}, نیاز: ${ethers.utils.formatUnits(tokenAmount, 18)}`,
                            "INSUFFICIENT_TOKEN_BALANCE"
                        );
                    }

                    // بررسی و تنظیم تأیید در صورت نیاز
                    const allowance = await tokenContract.allowance(
                        this.wallet.address,
                        this.config.routerAddress
                    );
                    if (allowance.lt(tokenAmount)) {
                        logger.info("مجوز ناکافی، در حال تأیید توکن‌ها...");
                        await this.approveToken(
                            tokenAddress,
                            this.config.routerAddress,
                            tokenAmount
                        );
                    }

                    // دریافت مقدار خروجی مورد انتظار
                    const path = [tokenAddress, this.config.wethAddress];
                    const amountsOut = await router.getAmountsOut(tokenAmount, path);
                    const amountOutMin = amountsOut[1]
                        .mul(100 - this.config.slippageTolerance)
                        .div(100);

                    logger.info(
                        `انتظار دریافت: ${ethers.utils.formatEther(amountsOut[1])} ETH`
                    );
                    logger.info(
                        `حداقل قابل قبول با لغزش: ${ethers.utils.formatEther(
              amountOutMin
            )} ETH`
                    );

                    // دریافت قیمت گاز پویا
                    const gasPrice = await this.providerManager.getDynamicGasPrice();

                    // تخمین گاز
                    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 دقیقه
                    const gasLimit = await router.estimateGas.swapExactTokensForETH(
                        tokenAmount,
                        amountOutMin,
                        path,
                        this.wallet.address,
                        deadline
                    );

                    // اجرای تعویض
                    const tx = await router.swapExactTokensForETH(
                        tokenAmount,
                        amountOutMin,
                        path,
                        this.wallet.address,
                        deadline, {
                            gasLimit: gasLimit.mul(120).div(100), // 20% buffer
                            gasPrice,
                        }
                    );

                    const receipt = await tx.wait();
                    logger.info(`فروش توکن موفق: ${receipt.transactionHash}`);
                    return receipt;
                } catch (error) {
                    if (error.code === "INSUFFICIENT_FUNDS") {
                        throw new TradingBotError(
                            "موجودی ناکافی برای پرداخت گاز",
                            "INSUFFICIENT_FUNDS"
                        );
                    } else if (error.reason) {
                        throw new TradingBotError(
                            `تراکنش لغو شد: ${error.reason}`,
                            "TRANSACTION_REVERTED"
                        );
                    } else {
                        throw new TradingBotError(
                            "خطا در فروش توکن برای ETH",
                            "SELL_ERROR", { error: error.message }
                        );
                    }
                }
            }, {
                retries: this.config.maxRetries,
                minTimeout: this.config.retryDelay,
                maxTimeout: this.config.retryDelay * 2,
            }
        );
    }

    /**
     * دریافت موجودی‌های همه توکن‌ها
     */
    async getAllBalances() {
        try {
            const [ethBalance, wethBalance, usdcBalance] = await Promise.all([
                this.wallet.getBalance(),
                this.getTokenBalance(this.config.wethAddress),
                this.getTokenBalance(this.config.usdcAddress),
            ]);

            return {
                ETH: ethers.utils.formatEther(ethBalance),
                WETH: wethBalance.balance,
                USDC: usdcBalance.balance,
            };
        } catch (error) {
            logger.error("خطا در دریافت موجودی‌ها:", error);
            return {
                ETH: "0",
                WETH: "0",
                USDC: "0",
            };
        }
    }

    /**
     * نمایش وضعیت کیف پول
     */
    async displayStatus() {
        try {
            logger.info("\n=== وضعیت کیف پول ===");
            logger.info(`آدرس: ${this.wallet.address}`);

            const balances = await this.getAllBalances();
            logger.info(`موجودی ETH: ${balances.ETH} ETH`);
            logger.info(`موجودی WETH: ${balances.WETH} WETH`);
            logger.info(`موجودی USDC: ${balances.USDC} USDC`);

            if (this.contractManager.contracts.has("futures")) {
                logger.info("\n=== پوزیشن‌های آتی ===");
                if (this.positions.size > 0) {
                    for (const [positionId, position] of this.positions) {
                        logger.info(
                            `پوزیشن ${positionId}: ${
                position.isLong ? "لانگ" : "شورت"
              }, اندازه: ${ethers.utils.formatEther(
                position.size
              )} ETH, اهرم: ${position.leverage}x`
                        );
                    }
                } else {
                    logger.info("هیچ پوزیشن فعالی وجود ندارد");
                }
            }

            logger.info("======================\n");
        } catch (error) {
            logger.error("خطا در نمایش وضعیت:", error);
        }
    }

    /**
     * شروع بررسی سلامت
     */
    startHealthCheck() {
        this.healthCheckInterval = setInterval(async() => {
            try {
                // بررسی اتصال ارائه‌دهنده
                const blockNumber =
                    await this.providerManager.provider.getBlockNumber();
                logger.debug(`بررسی سلامت: بلاک فعلی ${blockNumber}`);

                // بررسی موجودی
                const balance = await this.wallet.getBalance();
                if (balance.lt(ethers.utils.parseEther("0.001"))) {
                    logger.warn("هشدار: موجودی ETH کم است");
                }
            } catch (error) {
                logger.error("خطا در بررسی سلامت:", error);
            }
        }, 60000); // هر دقیقه
    }

    /**
     * توقف بررسی سلامت
     */
    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * شروع ربات معاملاتی
     */
    start() {
        if (this.isRunning) {
            logger.warn("ربات معاملاتی در حال اجرا است");
            return;
        }

        this.isRunning = true;
        logger.info("ربات معاملاتی شروع شد");
    }

    /**
     * توقف ربات معاملاتی
     */
    stop() {
        if (!this.isRunning) {
            logger.warn("ربات معاملاتی در حال اجرا نیست");
            return;
        }

        this.isRunning = false;
        this.stopHealthCheck();
        logger.info("ربات معاملاتی متوقف شد");
    }
}

// تابع اصلی برای نمایش نحوه استفاده
async function main() {
    try {
        // ایجاد نمونه ربات معاملاتی
        const tradingBot = new DEXTradingBot(config);

        // مقداردهی اولیه ربات
        const initialized = await tradingBot.initialize();
        if (!initialized) {
            logger.error("مقداردهی اولیه ربات معاملاتی ناموفق");
            return;
        }

        // نمایش وضعیت کیف پول
        await tradingBot.displayStatus();

        // مثال: خرید USDC با ETH
        try {
            logger.info("\n=== خرید USDC با ETH ===");
            await tradingBot.buyTokenWithETH(config.usdcAddress, config.tradeAmount);
            await tradingBot.displayStatus();
        } catch (error) {
            logger.error("خطا در مثال معامله:", error);
        }

        // مثال: فروش USDC برای ETH
        try {
            logger.info("\n=== فروش USDC برای ETH ===");
            const usdcBalance = await tradingBot.getTokenBalance(config.usdcAddress);
            if (usdcBalance.raw.gt(0)) {
                await tradingBot.sellTokenForETH(config.usdcAddress, usdcBalance.raw);
                await tradingBot.displayStatus();
            } else {
                logger.info("هیچ USDC برای فروش وجود ندارد");
            }
        } catch (error) {
            logger.error("خطا در مثال معامله:", error);
        }

        // نگه داشتن ربات در حال اجرا برای نظارت بر تراکنش‌ها
        tradingBot.start();

        // خاموش کردن مناسب
        process.on("SIGINT", async() => {
            logger.info("\nدر حال خاموش کردن ربات معاملاتی...");
            tradingBot.stop();
            process.exit(0);
        });
    } catch (error) {
        logger.error("خطا در تابع اصلی:", error);
        process.exit(1);
    }
}

// اجرای تابع اصلی
if (require.main === module) {
    main().catch((error) => {
        logger.error("خطای غیرمنتظره:", error);
        process.exit(1);
    });
}

module.exports = {
    DEXTradingBot,
    TradingBotError,
    ConfigValidator,
    ProviderManager,
    ContractManager,
};