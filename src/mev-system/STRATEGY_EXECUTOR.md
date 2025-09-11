# سیستم اجرای استراتژی (Strategy Executor)

## توضیحات

سیستم اجرای استراتژی، مغز عملیاتی یک ربات MEV است. این سیستم پس از شناسایی یک فرصت سودآور توسط سایر اجزا (مانند تحلیلگرها)، مسئولیت ساخت، امضا، و ارسال تراکنش‌های لازم برای بهره‌برداری از آن فرصت را بر عهده دارد. سرعت و دقت در این مرحله برای موفقیت در رقابت MEV حیاتی است.

## قابلیت‌ها

- **ساخت تراکنش (Transaction Crafting)**: ایجاد تراکنش‌های پیچیده، از جمله فراخوانی توابع قراردادهای هوشمند با پارامترهای دقیق.
- **مدیریت Nonce**: پیگیری و مدیریت صحیح `nonce` حساب برای جلوگیری از خطا و اطمینان از ترتیب اجرای تراکنش‌ها.
- **محاسبه بهینه Gas**: تعیین `gasPrice` و `gasLimit` بهینه برای اطمینان از ورود سریع تراکنش به بلاک، بدون پرداخت هزینه اضافی.
- **ارسال تراکنش**: ارسال تراکنش‌های امضاشده به شبکه از طریق یک نود RPC یا سرویس‌های اختصاصی مانند Flashbots.
- **مدیریت خطا**: مدیریت خطاهای احتمالی در زمان ارسال تراکنش، مانند `nonce` تکراری یا موجودی ناکافی.

## مثال کد (JavaScript)

این مثال یک تراکنش ساده برای ارسال توکن ERC20 را با استفاده از `ethers.js` نشان می‌دهد.

```javascript
const ethers = require('ethers');

class StrategyExecutor {
    constructor(privateKey, providerUrl) {
        this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
    }

    async executeTransaction(txDetails) {
        try {
            const tx = {
                to: txDetails.to,
                value: txDetails.value ? ethers.utils.parseEther(txDetails.value) : undefined,
                data: txDetails.data,
                gasPrice: await this.provider.getGasPrice(), // یا یک قیمت سفارشی
                nonce: await this.wallet.getTransactionCount('pending'),
            };

            const gasLimit = await this.provider.estimateGas(tx);
            tx.gasLimit = gasLimit;

            console.log('Sending transaction:', tx);
            const signedTx = await this.wallet.signTransaction(tx);
            const txResponse = await this.provider.sendTransaction(signedTx);

            console.log(`Transaction sent: ${txResponse.hash}`);
            return txResponse.wait(); // منتظر ماندن برای تأیید تراکنش
        } catch (error) {
            console.error('Failed to execute transaction:', error.message);
            throw error;
        }
    }
}

// مثال استفاده
async function main() {
    const privateKey = 'YOUR_PRIVATE_KEY';
    const providerUrl = 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID';

    const executor = new StrategyExecutor(privateKey, providerUrl);

    // جزئیات یک تراکنش نمونه (ارسال توکن)
    const tokenAddress = '0x_SOME_TOKEN_ADDRESS';
    const recipientAddress = '0x_RECIPIENT_ADDRESS';
    const amount = ethers.utils.parseUnits('100', 18); // 100 توکن

    const tokenInterface = new ethers.utils.Interface([
        'function transfer(address to, uint256 amount)'
    ]);

    const txData = tokenInterface.encodeFunctionData('transfer', [recipientAddress, amount]);

    await executor.executeTransaction({
        to: tokenAddress,
        data: txData,
    });
}

main().catch(console.error);
```

## نکات مهم

- **امنیت کلید خصوصی**: کلید خصوصی هرگز نباید در کد به صورت مستقیم قرار گیرد. از متغیرهای محیطی یا سرویس‌های مدیریت کلید استفاده کنید.
- **استفاده از Flashbots**: برای جلوگیری از front-running و اطمینان از اجرای تراکنش‌ها، استفاده از سرویس‌هایی مانند **Flashbots** برای ارسال باندل‌های خصوصی (Private Bundles) به ماینرها/ولیدیتورها توصیه می‌شود.
- **جنگ Gas (Gas Wars)**: در فرصت‌های بسیار رقابتی، ممکن است نیاز به استفاده از استراتژی‌های پیچیده‌تر برای تعیین `gasPrice` باشد.