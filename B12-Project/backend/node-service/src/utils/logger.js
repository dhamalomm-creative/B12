/**
 * logger.js — Winston structured logger with security audit support
 *
 * Security features:
 *  - Masks sensitive fields (passwords, tokens) before logging
 *  - Strips control characters (\n, \r, null bytes) to prevent log injection
 *  - Structured JSON format (no string interpolation — prevents log injection)
 *  - Supports both Serverless (Vercel/Lambda stdout) and Server (Daily file rotation)
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');

// Fields whose values must NEVER appear in logs
const SENSITIVE_KEYS = [
  'password',
  'password_hash',
  'currentPassword',
  'newPassword',
  'token',
  'authorization',
  'jwt',
  'secret',
];

// ── Custom format: mask sensitive fields in log metadata ──
const maskSensitive = format((info) => {
  const sanitizeObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const result = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        result[key] = sanitizeObj(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  };

  Object.keys(info).forEach((key) => {
    if (!['level', 'message', 'timestamp', 'stack'].includes(key)) {
      info[key] = sanitizeObj(info[key]);
    }
  });

  return info;
});

// ── Custom format: strip newlines and control chars to prevent log injection ──
const sanitizeMessage = format((info) => {
  if (typeof info.message === 'string') {
    info.message = info.message.replace(/[\r\n\x00-\x1f\x7f]/g, ' ').trim();
  }
  return info;
});

// Detect serverless environment (Vercel, AWS Lambda, etc.) where filesystem is read-only
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const logTransports = [];
const exceptionHandlers = [];

if (isServerless) {
  // In serverless environments, write to console/stdout so Vercel captures it in real-time
  logTransports.push(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp || ''} [${level}]: ${message} ${metaStr}`.trim();
        }),
      ),
    }),
  );
  exceptionHandlers.push(new transports.Console());
} else {
  // Dedicated server with persistent filesystem: use daily rotated files
  const DailyRotateFile = require('winston-daily-rotate-file');
  const logDir = path.join(__dirname, '../../logs');

  logTransports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '90d',
      zippedArchive: true,
    }),
  );

  exceptionHandlers.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    logTransports.push(
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      }),
    );
  }
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    maskSensitive(),
    sanitizeMessage(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: logTransports,
  exceptionHandlers: exceptionHandlers,
  exitOnError: false,
});

module.exports = logger;
