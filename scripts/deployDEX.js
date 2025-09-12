const { ethers } = require('hardhat');

async function main() {
    console.log('Deploying DEX contracts...');

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with account:', deployer.address);

    // Deploy TestToken
    console.log('\n1. Deploying TestToken...');
    const TestToken = await ethers.getContractFactory('TestToken');
    const testToken = await TestToken.deploy();
    await testToken.deployed();
    console.log('TestToken deployed to:', testToken.address);

    // Deploy SimpleDEX
    console.log('\n2. Deploying SimpleDEX...');
    const SimpleDEX = await ethers.getContractFactory('SimpleDEX');
    const dex = await SimpleDEX.deploy(testToken.address);
    await dex.deployed();
    console.log('SimpleDEX deployed to:', dex.address);

    // Initialize the pool
    console.log('\n3. Initializing DEX pool...');

    // Approve DEX to spend tokens
    const tokenAmount = ethers.utils.parseEther('100000'); // 100k tokens
    await testToken.approve(dex.address, tokenAmount);

    // Initialize pool with 100 ETH worth of liquidity
    const ethAmount = ethers.utils.parseEther('100');
    await dex.initializePool({ value: ethAmount });

    console.log('Pool initialized with 100 ETH and 100,000 tokens');

    // Transfer some tokens to the test wallet
    const testWallet = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    if (deployer.address !== testWallet) {
        console.log('\n4. Transferring tokens to test wallet...');
        await testToken.transfer(testWallet, ethers.utils.parseEther('10000'));
        console.log('Transferred 10,000 TEST tokens to test wallet');
    }

    console.log('\n=== CONTRACT ADDRESSES ===');
    console.log('TEST_TOKEN:', testToken.address);
    console.log('DEX_ROUTER:', dex.address);
    console.log('WETH (use ETH directly):', '0x0000000000000000000000000000000000000000');

    console.log('\n=== POOL INFO ===');
    const [ethReserve, tokenReserve] = await dex.getPoolInfo();
    console.log('ETH Reserve:', ethers.utils.formatEther(ethReserve));
    console.log('Token Reserve:', ethers.utils.formatEther(tokenReserve));

    console.log('\n=== NEXT STEPS ===');
    console.log('1. Update CONTRACTS.ADDRESSES in index.js with these addresses');
    console.log('2. Use DEX_ROUTER as ROUTER address');
    console.log('3. Use TEST_TOKEN as TEST_TOKEN address');
    console.log('4. Set WETH to zero address (0x0000000000000000000000000000000000000000)');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });