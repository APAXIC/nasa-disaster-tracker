require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection:
      'postgres://postgres:postgres@db:5432/nasa_eonet',
    migrations: {
      directory: './migrations',
    },
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 0,
      max: 5,
    },
    migrations: {
      directory: './migrations',
    },
  },
};