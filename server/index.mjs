// imports
import express from 'express';
// import cors for handling CORS issues and use in development mode react and express server
import cors from 'cors';
// For debbugin purposes
import morgan from 'morgan';
// Importing the necessary modules for authentication
import passport from 'passport';
import session from 'express-session';
import { configurePassport } from './config/passport.mjs';
import authRoutes from './api/auth.mjs'; // Add this import

// init express
const app = new express();
// Use express.json for parsing JSON bodies
app.use(express.json());
// Use morgan for logging requests to the console
app.use(morgan('dev'));
const port = 3001;

const corsOptions = {
  origin: 'http://localhost:5173', // React app URL
  optionsSuccessStatus: 200, // For legacy browser support
  credentials: true, // Allow cookies to be sent with requests
}
// Enable ALL CORS requests for this server
// Use ONLY for development purposes, otherwise use a more restrictive policy
app.use(cors(corsOptions));

// Configure Passport
configurePassport();

// Initialize Passport and use session for authentication
app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

app.use('/api', authRoutes); 

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});