// config/database.js
const env = process.env.NODE_ENV || 'development';
const config = require('./db.json')[env];

module.exports = config;
