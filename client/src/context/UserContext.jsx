// UserContext.jsx - Context definition for user authentication state
import { createContext } from 'react';

/**
 * Context Definition following React patterns from course
 * 
 * Creates a context object for sharing user authentication state
 * across the component tree without prop drilling.
 * 
 * The context will contain:
 * - user: current authenticated user object
 * - loggedIn: boolean authentication status
 * - authentication functions (handleLogin, handleLogout)
 * - message state for user feedback
 * 
 * The actual state and Provider logic are implemented in App.jsx
 * as shown in course slides.
 */
const UserContext = createContext();

export default UserContext;