import express from 'express';
import passport from 'passport';

const router = express.Router();

/**
 * POST /api/sessions - User Login
 * 
 * Creates a new session for the user after successful authentication.
 * Uses POST method for security - credentials are sent in the request body
 * instead of the URL (which would be visible and insecure).
 * 
 * The passport.authenticate middleware automatically:
 * - Extracts username/password from req.body
 * - Calls our LocalStrategy verify function
 * - Handles the authentication flow
 * 
 * If we reach the callback function, it means all our configuration
 * functions have executed successfully and we have the user data.
 */
router.post('/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // Authentication failed - display wrong login messages
      // Return 401 Unauthorized with the error message from our verify function
      return res.status(401).send(info).end();
    }
    // Authentication successful, perform the login and create session
    req.login(user, (err) => {
      if (err) return next(err);
      // req.user contains the authenticated user, send all user info back
      // Status 201 indicates successful creation of a new session
      return res.status(201).json(req.user).end();
    });
  })(req, res, next);
});

/**
 * GET /api/sessions/current - Get Current User Session
 * 
 * Returns the current authenticated user's information.
 * Used to check if a user is logged in and get their data.
 */
router.get('/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    // User is authenticated, return their information
    res.json(req.user).end();
  }
  else {
    // User is not authenticated
    res.status(401).json({ error: 'Not authenticated' }).end();
  }
});

/**
 * DELETE /api/sessions/current - User Logout
 * 
 * Destroys the current user session, effectively logging them out.
 */
router.delete('/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});

export default router;