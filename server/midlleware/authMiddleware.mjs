/**
 * Authentication middleware for protecting routes
 */

/**
 * Middleware for checking if user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
export const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authorized' }).end();
};

/**
 * Middleware for checking if user is anonymous (not logged in)
 * Useful for demo routes that should only be accessible to non-logged users
 */
export const isAnonymous = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  return res.status(403).json({ error: 'This feature is only available to anonymous users' }).end();
};