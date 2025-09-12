// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TestToken.sol";

contract MockUniswapRouter {
    TestToken public token;
    
    // Pool reserves
    uint256 public ethReserve;
    uint256 public tokenReserve;
    
    // Events
    event SwapETHForTokens(address indexed user, uint256 ethAmount, uint256 tokenAmount);
    event SwapTokensForETH(address indexed user, uint256 tokenAmount, uint256 ethAmount);
    
    constructor(address _token) {
        token = TestToken(_token);
    }
    
    // Initialize pool with liquidity
    function initializePool() external payable {
        require(msg.value > 0, "Must send ETH");
        require(ethReserve == 0, "Pool already initialized");
        
        uint256 tokenAmount = msg.value * 1000; // 1 ETH = 1000 tokens
        
        // Transfer tokens to this contract
        token.transferFrom(msg.sender, address(this), tokenAmount);
        
        ethReserve = msg.value;
        tokenReserve = tokenAmount;
    }
    
    // Get amounts out (Uniswap V2 style)
    function getAmountsOut(uint256 amountIn, address[] calldata /* path */) 
        external view returns (uint256[] memory amounts) {
        
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        
        if (ethReserve == 0 || tokenReserve == 0) {
            amounts[1] = 0;
            return amounts;
        }
        
        // Simple constant product formula
        uint256 newEthReserve = ethReserve + amountIn;
        uint256 newTokenReserve = (ethReserve * tokenReserve) / newEthReserve;
        amounts[1] = tokenReserve - newTokenReserve;
        
        return amounts;
    }
    
    // Internal function to calculate token amount for ETH
    function _getTokenAmountForETH(uint256 ethAmount) internal view returns (uint256) {
        if (ethReserve == 0 || tokenReserve == 0) {
            return 0;
        }
        
        uint256 newEthReserve = ethReserve + ethAmount;
        uint256 newTokenReserve = (ethReserve * tokenReserve) / newEthReserve;
        return tokenReserve - newTokenReserve;
    }
    
    // Swap exact ETH for tokens (Uniswap V2 style)
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata /* path */,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        require(msg.value > 0, "Must send ETH");
        require(ethReserve > 0 && tokenReserve > 0, "Pool not initialized");
        require(block.timestamp <= deadline, "Transaction expired");
        
        uint256 tokenAmount = _getTokenAmountForETH(msg.value);
        require(tokenAmount >= amountOutMin, "Insufficient output amount");
        require(token.balanceOf(address(this)) >= tokenAmount, "Insufficient token balance");
        
        // Update reserves
        ethReserve += msg.value;
        tokenReserve -= tokenAmount;
        
        // Transfer tokens to user
        token.transfer(to, tokenAmount);
        
        amounts = new uint256[](2);
        amounts[0] = msg.value;
        amounts[1] = tokenAmount;
        
        emit SwapETHForTokens(to, msg.value, tokenAmount);
        return amounts;
    }
    
    // Swap exact tokens for ETH (Uniswap V2 style)
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata /* path */,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(amountIn > 0, "Must send tokens");
        require(ethReserve > 0 && tokenReserve > 0, "Pool not initialized");
        require(block.timestamp <= deadline, "Transaction expired");
        
        // Transfer tokens from user
        token.transferFrom(msg.sender, address(this), amountIn);
        
        uint256 newTokenReserve = tokenReserve + amountIn;
        uint256 newEthReserve = (ethReserve * tokenReserve) / newTokenReserve;
        uint256 ethAmount = ethReserve - newEthReserve;
        
        require(ethAmount >= amountOutMin, "Insufficient output amount");
        require(address(this).balance >= ethAmount, "Insufficient ETH balance");
        
        // Update reserves
        tokenReserve = newTokenReserve;
        ethReserve = newEthReserve;
        
        // Transfer ETH to user
        payable(to).transfer(ethAmount);
        
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = ethAmount;
        
        emit SwapTokensForETH(to, amountIn, ethAmount);
        return amounts;
    }
    
    // Get WETH address
    function WETH() external pure returns (address) {
        return address(0x1); // Mock WETH
    }
    
    // Get pool info
    function getPoolInfo() external view returns (uint256, uint256) {
        return (ethReserve, tokenReserve);
    }
    
    // Add liquidity
    function addLiquidity() external payable {
        require(msg.value > 0, "Must send ETH");
        
        uint256 tokenAmount = msg.value * 1000; // 1 ETH = 1000 tokens
        
        require(token.balanceOf(address(this)) >= tokenAmount, "Insufficient token balance in DEX");
        
        ethReserve += msg.value;
        tokenReserve += tokenAmount;
    }
}