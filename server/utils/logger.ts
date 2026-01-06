/**
 * Simple logger utility for server-side logging
 * Provides tagged, level-based logging that can be controlled via environment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default to 'info' in production, 'debug' in development
const currentLevel = process.env.LOG_LEVEL as LogLevel ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(tag: string, message: string): string {
  return `[${tag}] ${message}`;
}

export const logger = {
  debug: (tag: string, message: string, ...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.log(formatMessage(tag, message), ...args);
    }
  },

  info: (tag: string, message: string, ...args: unknown[]) => {
    if (shouldLog('info')) {
      console.log(formatMessage(tag, message), ...args);
    }
  },

  warn: (tag: string, message: string, ...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage(tag, message), ...args);
    }
  },

  error: (tag: string, message: string, ...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error(formatMessage(tag, message), ...args);
    }
  },
};

export default logger;
