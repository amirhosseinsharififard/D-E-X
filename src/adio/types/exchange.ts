export interface ExchangeConfig {
  name: string;
  routerAddress: string;
  factoryAddress: string;
  fee: number;
  supportedTokens: string[];
}

export interface TokenPair {
  baseToken: string;
  quoteToken: string;
  liquidityUSD: number;
  volume24h: number;
}

export interface ArbitrageOpportunity {
  pair: TokenPair;
  buyExchange: string;
  sellExchange: string;
  expectedProfitETH: number;
  minAmountIn: string;
  maxAmountIn: string;
}

export interface MEVProtectionConfig {
  maxSlippage: number;
  frontrunProtection: boolean;
  flashbotsEnabled: boolean;
  minProfitThreshold: number;
}
