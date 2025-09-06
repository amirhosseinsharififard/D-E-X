// فایل نمونه تنظیمات - این فایل را کپی کرده و به config.js تغییر نام دهید
// سپس مقادیر واقعی را وارد کنید

module.exports = {
    // تنظیمات شبکه
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
    wsUrl: "wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID",
    fallbackRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY",

    // تنظیمات کیف پول (امن نگه دارید!)
    privateKey: "0xYOUR_PRIVATE_KEY_HERE",

    // آدرس قراردادها
    routerAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
    wethAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH on Mainnet
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Mainnet
    futuresMarketAddress: "0xFUTURES_MARKET_ADDRESS", // آدرس بازار آتی

    // تنظیمات گاز
    gasLimit: 300000,
    maxGasPrice: "100", // gwei

    // تنظیمات معاملاتی
    slippageTolerance: 1, // درصد
    tradeAmount: "0.1", // ETH
    minTokenAmount: "10", // USDC

    // تنظیمات اتصال مجدد
    maxRetries: 3,
    retryDelay: 1000, // میلی‌ثانیه

    // تنظیمات لاگینگ
    logLevel: "info", // debug, info, warn, error
};