/**
 * api/index.js — Vercel Serverless Function Handler
 * ==================================================
 * Exports the Express app directly for Vercel's serverless runtime.
 */
const app = require('../server');

module.exports = app;
