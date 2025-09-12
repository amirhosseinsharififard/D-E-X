import { ethers, NonceManager } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Local hardhat node config
const RPC_URL = 'http://127.0.0.1:8545';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const resolveArtifactPath = (rel) => path.join(__dirname, '..', 'artifacts', 'contracts', rel);

const readArtifact = async(rel) => {
    const file = await fs.readFile(resolveArtifactPath(rel), 'utf8');
    const json = JSON.parse(file);
    return { abi: json.abi, bytecode: json.bytecode };
};

const makeWallet = () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const signer = new NonceManager(wallet);
    return { provider, wallet: signer };
};

const deploy = async(wallet, artifact, args = []) => {
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    return contract;
};

const initializePool = async(token, router) => {
    const tokenAmount = ethers.parseEther('100000');
    const routerAddr = await router.getAddress();
    await (await token.approve(routerAddr, tokenAmount)).wait();

    const ethAmount = ethers.parseEther('100');
    await (await router.initializePool({ value: ethAmount })).wait();
};

const writeDeployment = async(addresses) => {
    const outDir = path.join(__dirname, '..', 'deployments');
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, 'local.json');
    await fs.writeFile(outPath, JSON.stringify(addresses, null, 2), 'utf8');
    console.log(`\nSaved deployment to ${outPath}`);
};

const main = async() => {
    console.log('Deploying Mock Uniswap contracts...');

    const { wallet } = makeWallet();
    const deployerAddress = await wallet.getAddress();
    console.log('Deploying with account:', deployerAddress);

    const tokenArt = await readArtifact('TestToken.sol/TestToken.json');
    const routerArt = await readArtifact('MockUniswapRouter.sol/MockUniswapRouter.json');

    console.log('\n1. Deploying TestToken...');
    const token = await deploy(wallet, tokenArt);
    const tokenAddr = await token.getAddress();
    console.log('TestToken deployed to:', tokenAddr);

    console.log('\n2. Deploying MockUniswapRouter...');
    const router = await deploy(wallet, routerArt, [tokenAddr]);
    const routerAddr = await router.getAddress();
    console.log('MockUniswapRouter deployed to:', routerAddr);

    console.log('\n3. Initializing pool...');
    await initializePool(token, router);
    console.log('Pool initialized with 100 ETH and 100,000 tokens');

    const testWallet = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    if (deployerAddress.toLowerCase() !== testWallet.toLowerCase()) {
        console.log('\n4. Transferring tokens to test wallet...');
        await (await token.transfer(testWallet, ethers.parseEther('10000'))).wait();
        console.log('Transferred 10,000 TEST tokens to test wallet');
    }

    const addresses = {
        TEST_TOKEN: tokenAddr,
        ROUTER: routerAddr,
        WETH: '0x0000000000000000000000000000000000000001',
    };

    console.log('\n=== CONTRACT ADDRESSES ===');
    console.log('TEST_TOKEN:', addresses.TEST_TOKEN);
    console.log('ROUTER:', addresses.ROUTER);
    console.log('WETH (Mock):', addresses.WETH);

    if (router.getPoolInfo) {
        const [ethReserve, tokenReserve] = await router.getPoolInfo();
        console.log('\n=== POOL INFO ===');
        console.log('ETH Reserve:', ethers.formatEther(ethReserve));
        console.log('Token Reserve:', ethers.formatEther(tokenReserve));
    }

    await writeDeployment(addresses);
};

main().catch((e) => {
    console.error(e);
    process.exit(1);
});