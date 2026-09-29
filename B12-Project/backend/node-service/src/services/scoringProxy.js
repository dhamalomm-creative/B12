/**
 * scoringProxy.js — Standalone Scoring Engine Adapter
 * ===================================================
 * Directly invokes the internal JavaScript scoring engine.
 * No external Python service or HTTP call required.
 */
const scoringEngine = require('./scoringEngine');

const score = async (payload) => {
  return scoringEngine.score(payload);
};

const getTrends = async (logs) => {
  return scoringEngine.getTrends(logs);
};

module.exports = { score, getTrends };
