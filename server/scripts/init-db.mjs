import sqlite from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path al database
const dbPath = process.env.DATABASE_PATH 
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, '../database/database.sqlite');

console.log('Initializing database at:', dbPath);

// Assicurati che la directory esista
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Created database directory:', dbDir);
}

// Copia il database template se non esiste
const templatePath = path.join(__dirname, '../database/database.sqlite');
if (!fs.existsSync(dbPath) && fs.existsSync(templatePath)) {
  fs.copyFileSync(templatePath, dbPath);
  console.log('Copied database template to:', dbPath);
} else if (fs.existsSync(dbPath)) {
  console.log('Database already exists at:', dbPath);
} else {
  console.log('No template found, database will be created empty');
}

// Verifica che il database sia accessibile
const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
  console.log('Database connection successful');
  
  // Verifica che le tabelle esistano
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Users'", (err, row) => {
    if (err) {
      console.error('Error checking database tables:', err);
      process.exit(1);
    }
    if (!row) {
      console.warn('Users table not found! Database may need initialization.');
    } else {
      console.log('Database tables verified');
    }
    db.close();
    process.exit(0);
  });
});