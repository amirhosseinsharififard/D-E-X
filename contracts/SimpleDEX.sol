// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TestToken.sol";

contract SimpleDEX {
    TestToken public token;
    address public owner;
    
    // Pool reserves
    uint256 public ethReserve;
    uint256 public tokenReserve;
    
    // Events
    event SwapETHForTokens(address indexed user, uint256 ethAmount, uint256 tokenAmount);
    event SwapTokensForETH(address indexed user, uint256 tokenAmount, uint256 ethAmount);
    event LiquidityAdded(address indexed user, uint256 ethAmount, uint256 tokenAmount);
    
    constructor(address _token) {
        token = TestToken(_token);
        owner = msg.sender;
    }
    
    // Add liquidity to the pool
    function addLiquidity() external payable {
        require(msg.value > 0, "Must send ETH");
        
        uint256 tokenAmount = msg.value * 1000; // 1 ETH = 1000 tokens (simple rate)
        
        require(token.balanceOf(address(this)) >= tokenAmount, "Insufficient token balance in DEX");
        
        ethReserve += msg.value;
        tokenReserve += tokenAmount;
        
        emit LiquidityAdded(msg.sender, msg.value, tokenAmount);
    }
    
    // Get amount of tokens for given ETH
    function getAmountsOut(uint256 ethAmount) external view returns (uint256) {
        if (ethReserve == 0 || tokenReserve == 0) {
            return 0;
        }
        
        // Simple constant product formula: x * y = k
        uint256 newEthReserve = ethReserve + ethAmount;
        uint256 newTokenReserve = (ethReserve * tokenReserve) / newEthReserve;
        uint256 tokenAmount = tokenReserve - newTokenReserve;
        
        return tokenAmount;
    }
    
    // Get amount of ETH for given tokens
    function getAmountsIn(uint256 tokenAmount) external view returns (uint256) {
        if (ethReserve == 0 || tokenReserve == 0) {
            return 0;
        }
        
        uint256 newTokenReserve = tokenReserve + tokenAmount;
        uint256 newEthReserve = (ethReserve * tokenReserve) / newTokenReserve;
        uint256 ethAmount = ethReserve - newEthReserve;
        
        return ethAmount;
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
    
    // Internal function to calculate ETH amount for tokens
    function _getETHAmountForTokens(uint256 tokenAmount) internal view returns (uint256) {
        if (ethReserve == 0 || tokenReserve == 0) {
            return 0;
        }
        
        uint256 newTokenReserve = tokenReserve + tokenAmount;
        uint256 newEthReserve = (ethReserve * tokenReserve) / newTokenReserve;
        return ethReserve - newEthReserve;
    }
    
    // Swap ETH for tokens
    function swapETHForTokens() external payable {
        require(msg.value > 0, "Must send ETH");
        require(ethReserve > 0 && tokenReserve > 0, "Pool not initialized");
        
        uint256 tokenAmount = _getTokenAmountForETH(msg.value);
        require(tokenAmount > 0, "Insufficient liquidity");
        require(token.balanceOf(address(this)) >= tokenAmount, "Insufficient token balance");
        
        // Update reserves
        ethReserve += msg.value;
        tokenReserve -= tokenAmount;
        
        // Transfer tokens to user
        token.transfer(msg.sender, tokenAmount);
        
        emit SwapETHForTokens(msg.sender, msg.value, tokenAmount);
    }
    
    // Swap tokens for ETH
    function swapTokensForETH(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Must send tokens");
        require(ethReserve > 0 && tokenReserve > 0, "Pool not initialized");
        
        uint256 ethAmount = _getETHAmountForTokens(tokenAmount);
        require(ethAmount > 0, "Insufficient liquidity");
        require(address(this).balance >= ethAmount, "Insufficient ETH balance");
        
        // Transfer tokens from user
        token.transferFrom(msg.sender, address(this), tokenAmount);
        
        // Update reserves
        tokenReserve += tokenAmount;
        ethReserve -= ethAmount;
        
        // Transfer ETH to user
        payable(msg.sender).transfer(ethAmount);
        
        emit SwapTokensForETH(msg.sender, tokenAmount, ethAmount);
    }
    
    // Initialize pool with initial liquidity
    function initializePool() external payable {
        require(msg.value > 0, "Must send ETH");
        require(ethReserve == 0, "Pool already initialized");
        
        uint256 tokenAmount = msg.value * 1000; // 1 ETH = 1000 tokens
        
        // Transfer tokens to this contract
        token.transferFrom(msg.sender, address(this), tokenAmount);
        
        ethReserve = msg.value;
        tokenReserve = tokenAmount;
        
        emit LiquidityAdded(msg.sender, msg.value, tokenAmount);
    }
    
    // Get pool info
    function getPoolInfo() external view returns (uint256, uint256) {
        return (ethReserve, tokenReserve);
    }
    
    // Owner functions
    function withdrawETH() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }
    
    function withdrawTokens() external {
        require(msg.sender == owner, "Only owner");
        token.transfer(owner, token.balanceOf(address(this)));
    }
}