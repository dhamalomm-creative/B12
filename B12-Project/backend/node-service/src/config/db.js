const { Sequelize } = require('sequelize');

const isSupabase = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.com');
const requiresSSL = process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true' || isSupabase;

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
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

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully (Supabase/PostgreSQL)');
  } catch (err) {
    console.error('❌ Unable to connect to PostgreSQL:', err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
