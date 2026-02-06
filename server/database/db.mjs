import sqlite from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use environment variable or default path
const dbPath = process.env.DATABASE_PATH 
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, 'database.sqlite');

const db = new sqlite.Database(dbPath, (err) => { 
    if (err) throw err; 
    console.log('Connected to SQLite database at:', dbPath);
});

export default db;