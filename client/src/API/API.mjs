import { User } from "../../../server/models/User.mjs";

const SERVER_URL = 'http://localhost:3001';

// LOGIN-LOGOUT APIs

/**
* User Login API
* 
* Sends credentials to the server to create a new session.
* Uses POST method for security - credentials are sent in the request body
* instead of the URL.
* 
* @param {Object} credentials - Object containing username and password
* @returns {Promise<User>} - User object if login successful
* @throws {string} - Error message if login fails
*/
const logIn = async (credentials) => {
 const response = await fetch(SERVER_URL + '/api/sessions', {
   method: 'POST',
   headers: {
     'Content-Type': 'application/json',
   },
   /**
    * credentials: 'include' is essential for session management
    * Even though we're not sending a cookie in this first login request,
    * we need this setting so that:
    * 1. The browser will save the session cookie from the response
    * 2. Future requests will automatically include the cookie
    * Without this, CORS won't handle credentials properly in subsequent requests
    */
   credentials: 'include',
   /**
    * Send the credentials (username, password) in the request body
    * Must match the field names expected by Passport LocalStrategy
    */
   body: JSON.stringify(credentials),
 });
 
 if(response.ok) {
   // Login successful - return the user object from the server
   const user = await response.json();
   return user;
 }
 else {
   // Login failed - get the error message and throw it
   // This will be caught by the handleLogin function to display error messages
   const errDetails = await response.text();
   throw errDetails;
 }
};

/**
* Get Current User Info API
* 
* Retrieves information about the currently authenticated user.
* Uses the session cookie to identify the user.
* 
* This API is useful for:
* - Checking if a user session is still active after page refresh
* - Restoring user state when the React app restarts
* - Verifying if the session has expired
* 
* @returns {Promise<User>} - Current user object if authenticated
* @throws {Object} - Error object if not authenticated or other error
*/
const getUserInfo = async () => {
 const response = await fetch(SERVER_URL + '/api/sessions/current', {
   /**
    * credentials: 'include' is needed here because:
    * - When React app restarts (refresh, navigation via URL)
    * - The cookie remains saved in the browser
    * - We send the cookie to the server to check if the session is still valid
    * - The server checks if that cookie corresponds to a logged-in user
    */
   credentials: 'include',
 });
 const user = await response.json();
 if (response.ok) {
   return user;
 } else {
   throw user;  // an object with the error coming from the server
 }
};

/**
* User Logout API
* 
* Destroys the current session on the server.
* The session cookie will be automatically sent due to credentials: 'include'
* 
* Note: When logout is performed from one browser tab, other tabs won't 
* automatically know about it. However, the session is closed on the server,
* so any subsequent requests from other tabs will fail authentication.
* 
* @returns {Promise<null>} - null if logout successful
*/
const logOut = async() => {
 const response = await fetch(SERVER_URL + '/api/sessions/current', {
   method: 'DELETE',
   credentials: 'include'
 });
 if (response.ok)
   return null;
};

const API = { logIn, getUserInfo, logOut };
export default API;