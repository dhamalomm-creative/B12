require('dotenv').config();
const { Sequelize } = require('sequelize');
const pg = require('pg');

// Clean and sanitize the database URL (trim whitespace and remove accidental surrounding quotes)
const rawUrl = (process.env.DATABASE_URL || 'postgresql://localhost:5432/b12db').trim().replace(/^["']|["']$/g, '');

const isSupabase = rawUrl.includes('supabase.com');
const requiresSSL = process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true' || isSupabase;

let sequelize;
try {
  sequelize = new Sequelize(rawUrl, {
    dialect: 'postgres',
    dialectModule: pg, // Explicitly provide pg module for serverless bundlers (Vercel)
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: requiresSSL
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  });
} catch (err) {
  console.error('\n🚨 DATABASE URL ERROR: Unable to parse DATABASE_URL.');
  console.error('Check for square brackets [ ] or unescaped special characters (@, #, %) in your password.\n');
  throw err;
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully (Supabase/PostgreSQL)');
  } catch (err) {
    console.error('❌ Unable to connect to PostgreSQL:', err.message);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = { sequelize, connectDB };
