// imports
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';
import { configurePassport } from './config/passport.mjs';
import authRoutes from './api/auth.mjs';
import gamesRoutes from './api/games.mjs';
import demoRoutes from './api/demo.mjs';

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config();
}

const app = express();

// Use express.json for parsing JSON bodies
app.use(express.json());
app.use(morgan('dev'));

// Port configuration
const port = process.env.PORT || 3001;

// CORS configuration - allow frontend origin
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  optionsSuccessStatus: 200,
  credentials: true, // CRITICAL: Allow cookies
};
app.use(cors(corsOptions));

// Serve static files (images)
app.use(express.static('public'));

// Configure Passport strategies
configurePassport();

// Session configuration with secure cookies for production
app.use(session({
  secret: process.env.SESSION_SECRET || "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport AFTER session middleware
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/demo', demoRoutes);

// Health check endpoint (useful for Render)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});