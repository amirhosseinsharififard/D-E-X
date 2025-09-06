const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying TestToken...");

    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy();

    await testToken.deployed();

    console.log("TestToken deployed to:", testToken.address);
    console.log("Name:", await testToken.name());
    console.log("Symbol:", await testToken.symbol());
    console.log(
        "Total Supply:",
        ethers.utils.formatEther(await testToken.totalSupply())
    );

    // Transfer some tokens to our wallet
    const [deployer] = await ethers.getSigners();
    const walletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Hardhat account 0

    if (deployer.address !== walletAddress) {
        console.log("Transferring tokens to wallet...");
        await testToken.transfer(walletAddress, ethers.utils.parseEther("10000"));
        console.log("Transferred 10000 TEST tokens to wallet");
    }

    console.log("\n=== Contract Address ===");
    console.log("TEST_TOKEN:", testToken.address);
    console.log("Add this to your CONTRACTS.ADDRESSES in index.js");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });