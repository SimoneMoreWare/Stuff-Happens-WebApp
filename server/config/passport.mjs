import passport from 'passport';
import LocalStrategy from 'passport-local';
import { checkUserCredentials } from '../dao/userDAO.mjs';

/**
 * Configure Passport LocalStrategy and serialization
 */
export const configurePassport = () => {
  passport.use(new LocalStrategy(
    /**
     * Configure the LocalStrategy with a verify function.
     * 
     * The LocalStrategy automatically extracts 'username' and 'password' fields 
     * from the request body - these field names are hardcoded by Passport.
     * 
     * IMPORTANT: When making the login API call from the client, the request body 
     * must contain exactly these field names: 'username' and 'password'.
     * Passport will NOT work if you use different field names like 'email' or 'user'.
     * 
     * @param {string} username - Automatically extracted from req.body.username
     * @param {string} password - Automatically extracted from req.body.password  
     * @param {function} cb - Callback function to handle authentication result
     */
    async function verify(username, password, cb) {
      // Retrieve user from database using our DAO function
      const user = await checkUserCredentials(username, password);
      
      if (!user) {
        // Authentication failed - user not found or wrong credentials
        // cb(error, user, info) - null=no error, false=no user, message=optional info
        return cb(null, false, { message: 'Incorrect username or password.' });
      }
      
      // Authentication successful
      // cb(error, user) - null=no error, user=authenticated user object
      return cb(null, user);
    }
  ));

  /**
   * Serialize user for session storage
   * Called automatically by Passport after successful authentication.
   * Stores user data in the session cookie.
   */
  passport.serializeUser(function(user, cb) {
    cb(null, user);
  });

  /**
   * Deserialize user from session storage
   * Called automatically on every request with a session cookie.
   * Reconstructs the user object from session data.
   */
  passport.deserializeUser(async function(user, cb) {
    cb(null, user);
  });

};