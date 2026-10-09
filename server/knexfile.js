require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection:
      process.env.DATABASE_URL ||
      'postgres://postgres:postgres@db:5432/nasa_eonet',
    migrations: {
      directory: './migrations',
    },
  },
};