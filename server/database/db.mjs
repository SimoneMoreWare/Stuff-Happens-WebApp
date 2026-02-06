import sqlite from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use environment variable or default path
const dbPath = process.env.DATABASE_PATH 
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, 'database.sqlite');

console.log('Database path:', dbPath);

// Verify database file exists
if (!fs.existsSync(dbPath)) {
  console.error('DATABASE FILE NOT FOUND at:', dbPath);
  console.error('Available files in directory:');
  const dbDir = path.dirname(dbPath);
  if (fs.existsSync(dbDir)) {
    console.error(fs.readdirSync(dbDir));
  } else {
    console.error('Directory does not exist:', dbDir);
  }
  throw new Error(`Database file not found: ${dbPath}`);
}

const db = new sqlite.Database(dbPath, (err) => { 
    if (err) {
      console.error('Failed to connect to database:', err);
      throw err;
    }
    console.log('Connected to SQLite database at:', dbPath);
});

export default db;