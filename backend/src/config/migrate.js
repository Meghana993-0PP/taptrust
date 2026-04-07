/**
 * Migration runner.
 * Reads all .sql files from the /migrations directory in alphabetical order
 * and executes them against the configured MySQL database.
 *
 * Usage: node src/config/migrate.js
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

async function runMigrations() {
  // Connect without specifying a database first so we can CREATE DATABASE if needed
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    timezone: '+00:00',
  });

  try {
    const dbName = process.env.DB_NAME || 'taptrust';

    // Ensure the database exists
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await conn.query(`USE \`${dbName}\`;`);

    // Create a migrations tracking table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        filename   VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Fetch already-applied migrations
    const [applied] = await conn.query('SELECT filename FROM _migrations;');
    const appliedSet = new Set(applied.map((r) => r.filename));

    // Read migration files sorted alphabetically
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[migrate] Skipping (already applied): ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`[migrate] Applying: ${file}`);
      await conn.query(sql);
      await conn.query('INSERT INTO _migrations (filename) VALUES (?);', [file]);
      console.log(`[migrate] Applied: ${file}`);
    }

    console.log('[migrate] All migrations complete.');
  } finally {
    await conn.end();
  }
}

runMigrations().catch((err) => {
  console.error('[migrate] Migration failed:', err);
  process.exit(1);
});
