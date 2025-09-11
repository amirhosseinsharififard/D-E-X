# سیستم شبیه‌سازی تراکنش‌ها

## توضیحات

سیستم شبیه‌سازی تراکنش‌ها به ربات‌های MEV اجازه می‌دهد تا تأثیر یک تراکنش یا مجموعه‌ای از تراکنش‌ها را بر وضعیت بلاکچین (State) پیش‌بینی کنند، بدون اینکه نیاز به ارسال واقعی آن‌ها به شبکه باشد. این کار برای ارزیابی سودآوری یک استراتژی MEV و جلوگیری از ارسال تراکنش‌های ناموفق یا زیان‌آور ضروری است.

## قابلیت‌ها

- **اجرای محلی تراکنش‌ها**: قابلیت اجرای یک تراکنش بر روی یک نسخه محلی از وضعیت بلاکچین (Forked State).
- **پیش‌بینی تغییرات وضعیت**: نمایش تغییرات در موجودی حساب‌ها، ذخایر استخرها و سایر متغیرهای قراردادهای هوشمند.
- **محاسبه سود و زیان (PnL)**: تخمین سود یا زیان حاصل از اجرای یک استراتEstrateژی خاص.
- **شناسایی Revert**: تشخیص اینکه آیا یک تراکنش در صورت اجرا Revert خواهد شد یا خیر.

## مثال کد (JavaScript)

برای شبیه‌سازی تراکنش‌ها، معمولاً از ابزارهایی مانند Hardhat یا Tenderly استفاده می‌شود. در اینجا یک مثال با استفاده از `Hardhat` برای Fork کردن شبکه اصلی و شبیه‌سازی یک `swap` آورده شده است.

```javascript
const { ethers } = require('hardhat');
const { expect } = require('chai');

// این کد باید در محیط تست Hardhat اجرا شود

describe('Transaction Simulation', function () {
  it('Should simulate a Uniswap V2 swap successfully', async function () {
    // Fork کردن شبکه اصلی اتریum در یک بلاک خاص
    await network.provider.request({
      method: 'hardhat_reset',
      params: [{
        forking: {
          jsonRpcUrl: `https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID`,
          blockNumber: 13000000, // یک شماره بلاک مشخص
        },
      }],
    });

    const UNISWAP_V2_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

    // دریافت یک Signer که هویت یک حساب با موجودی بالا را جعل می‌کند
    const whaleSigner = await ethers.getImpersonatedSigner('0x_SOME_WHALE_ADDRESS');

    const uniswapRouter = await ethers.getContractAt('IUniswapV2Router02', UNISWAP_V2_ROUTER, whaleSigner);
    const wethContract = await ethers.getContractAt('IERC20', WETH_ADDRESS, whaleSigner);

    const amountIn = ethers.utils.parseEther('1');
    const path = [WETH_ADDRESS, DAI_ADDRESS];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    // شبیه‌سازی تماس (بدون ارسال تراکنش واقعی)
    const amountsOut = await uniswapRouter.callStatic.getAmountsOut(amountIn, path);
    console.log(`Simulated output: ${ethers.utils.formatUnits(amountsOut[1], 18)} DAI`);

    // اجرای واقعی تراکنش در محیط Fork شده
    await wethContract.approve(UNISWAP_V2_ROUTER, amountIn);
    const tx = await uniswapRouter.swapExactTokensForTokens(
      amountIn,
      amountsOut[1],
      path,
      whaleSigner.address,
      deadline
    );
    await tx.wait();

    // در اینجا می‌توانید وضعیت پس از تراکنش را بررسی کنید
    // ...
  });
});
```

## نکات مهم

- **دقت شبیه‌سازی**: دقت شبیه‌سازی به کیفیت Fork و نود RPC شما بستگی دارد.
- **پیچیدگی**: شبیه‌سازی تراکنش‌های پیچیده که با چندین قرارداد هوشمند تعامل دارند، می‌تواند چالش‌برانگیز باشد.
- **ابزارهای جایگزین**: سرویس‌هایی مانند **Tenderly** و **Flashbots-bundle-simulator** ابزارهای قدرتمندی برای شبیه‌سازی‌های پیشرفته‌تر ارائه می‌دهند.