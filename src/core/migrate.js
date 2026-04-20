'use strict';

require('dotenv').config();

const { initDatabase, getPool } = require('./database');

(async () => {
  try {
    await initDatabase();
    console.log('Schema ensured successfully.');
    await getPool().end();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
