/**
 * auditLogger.js — Security event audit logger
 *
 * Logs critical security events to:
 *  1. PostgreSQL audit_logs table (queryable, searchable, alertable)
 *  2. Winston security.log file (backup, SIEM integration)
 *
 * Events tracked:
 *  LOGIN, LOGOUT, FAILED_LOGIN, ACCOUNT_LOCKED, REGISTER,
 *  PASSWORD_CHANGE, TOKEN_REFRESH, UNAUTHORIZED_ACCESS, IDOR_ATTEMPT
 *
 * Non-blocking: DB write failure never breaks the main request flow.
 */

const logger = require('../utils/logger');

// ── Security event type constants ──
const EVENTS = {
  LOGIN:                'LOGIN',
  LOGOUT:               'LOGOUT',
  FAILED_LOGIN:         'FAILED_LOGIN',
  ACCOUNT_LOCKED:       'ACCOUNT_LOCKED',
  REGISTER:             'REGISTER',
  PASSWORD_CHANGE:      'PASSWORD_CHANGE',
  TOKEN_REFRESH:        'TOKEN_REFRESH',
  UNAUTHORIZED_ACCESS:  'UNAUTHORIZED_ACCESS',
  IDOR_ATTEMPT:         'IDOR_ATTEMPT',
  ACCOUNT_DELETED:      'ACCOUNT_DELETED',
};

// ── Extract the real client IP ──
// Handles proxies, load balancers, Docker NAT
// req.ip already honours `trust proxy` (1 hop), so it can't be spoofed by a client
// sending its own X-Forwarded-For header. Fall back to socket info if unavailable.
const getClientIp = (req) => {
  return (
    req.ip ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

/**
 * Log a security event.
 *
 * @param {object} req         - Express request object
 * @param {string} eventType   - One of EVENTS constants
 * @param {object} options
 * @param {string} options.userId   - UUID of the user involved (or null)
 * @param {object} options.metadata - Extra context to store (auto-masked in logger)
 */
const logSecurityEvent = async (req, eventType, { userId = null, metadata = {} } = {}) => {
  const ip = getClientIp(req);
  const userAgent = (req.headers['user-agent'] || 'unknown').substring(0, 500);
  const timestamp = new Date().toISOString();

  // ── [1] Always log to file (works even if DB is down) ──
  logger.info(`SECURITY_EVENT`, {
    eventType,
    userId,
    ip,
    userAgent,
    metadata,
    timestamp,
  });

  // ── [2] Log to DB (non-blocking) — do not let DB failure break the request ──
  try {
    // Lazy-require to avoid circular dependency during startup
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      user_id: userId,
      event_type: eventType,
      ip_address: ip,
      user_agent: userAgent,
      metadata,
    });
  } catch (err) {
    // Log the failure but do NOT throw — never break request flow for audit logging
    logger.error('Failed to write security event to audit_logs table', {
      eventType,
      userId,
      error: err.message,
    });
  }
};

module.exports = { logSecurityEvent, EVENTS };
