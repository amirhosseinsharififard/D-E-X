import { ethers } from 'ethers';
import { ExchangeConfig, TokenPair } from '../types/exchange';
import { logger } from '../utils/logger';

const HISTORICAL_DATA_CACHE: Map<string, number[]> = new Map();

export async function getHistoricalPrices(exchange: string, pair: TokenPair, hours: number = 24): Promise<number[]> {
  const cacheKey = `${exchange}-${pair.baseToken}-${pair.quoteToken}`;
  
  if (HISTORICAL_DATA_CACHE.has(cacheKey)) {
    return HISTORICAL_DATA_CACHE.get(cacheKey)!;
  }

  // Simulated price data - replace with actual chain data feed
  const prices = Array.from({ length: hours }, (_, i) => 
    1000 + Math.sin(i * 0.5) * 50 + Math.random() * 20
  );

  HISTORICAL_DATA_CACHE.set(cacheKey, prices);
  return prices;
}

export async function getCurrentPrice(exchange: string, pair: TokenPair): Promise<number> {
  try {
    // Simulated price feed - replace with actual DEX price lookup
    const prices = await getHistoricalPrices(exchange, pair, 1);
    return prices[prices.length - 1];
  } catch (error) {
    logger.error(`Error getting price from ${exchange}`, error);
    return 0;
  }
}

export function calculateSpread(buyPrice: number, sellPrice: number): number {
  return ((sellPrice - buyPrice) / buyPrice) * 100;
}
