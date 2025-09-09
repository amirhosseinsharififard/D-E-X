import winston from 'winston';
import { format } from 'logform';

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

export const logger = winston.createLogger({
  level: 'debug',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/bot.log' })
  ],
});

export function logTransaction(txHash: string, details: object) {
  logger.info(`Transaction: ${txHash}`, { metadata: details });
}

export function logError(error: Error, context: object = {}) {
  logger.error(error.message, { error, ...context });
}
