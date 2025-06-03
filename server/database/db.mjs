import sqlite from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build the absolute path to the database file
const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite.Database(dbPath, (err) => { 
    if (err) throw err; 
    console.log('Connected to SQLite database at:', dbPath);
});

export default db;