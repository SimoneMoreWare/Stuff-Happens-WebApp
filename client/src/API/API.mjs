/**
 * Frontend API client for "Stuff Happens" game
 * 
 * This module provides a clean abstraction layer for all server communication.
 * Each function is autonomous, receives all necessary parameters, and handles
 * its own error management without dependencies on React state or components.
 * 
 * Architecture Decisions:
 * 
 * 1. Autonomous Functions:
 *    - Each API function is self-contained and stateless
 *    - No dependencies on global state or React components
 *    - Receives all required parameters explicitly
 *    - Returns only the data needed for that specific functionality
 * 
 * 2. Session Management:
 *    - All functions use 'credentials: include' for automatic cookie handling
 *    - After login, session cookies are automatically included in requests
 *    - Server handles authentication validation, client handles responses
 * 
 * 3. Error Handling Strategy:
 *    - Always check response.ok before processing data
 *    - Throw specific error types for different scenarios
 *    - Include error context (type, activeGameId) for complex cases
 *    - Consistent error format across all functions
 * 
 * 4. URL Management:
 *    - Centralized SERVER_URL configuration for easy deployment changes
 *    - Automatic image URL conversion from relative to absolute paths
 *    - Consistent API endpoint structure
 * 
 * 5. Data Transformation:
 *    - Convert relative image URLs to absolute URLs for proper display
 *    - Maintain data consistency between demo and full game responses
 *    - Filter sensitive data (bad_luck_index) appropriately
 */

import { User } from "../models/User.mjs";

// Centralized server configuration - modify for production deployment
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ==============================================================================
// AUTHENTICATION APIs
// ==============================================================================

/**
 * User authentication via session creation
 * 
 * Establishes a new session on the server using username/password credentials.
 * The server responds with a session cookie that is automatically saved by the browser.
 * 
 * Technical Details:
 * - Uses POST for security (credentials in body, not URL)
 * - credentials: 'include' ensures proper CORS cookie handling
 * - Session cookie is automatically managed by the browser
 * 
 * @param {Object} credentials - Object containing username and password
 * @returns {Promise<User>} User object with session established
 * @throws {string} Error message for display to user
 */
const logIn = async (credentials) => {
  const response = await fetch(SERVER_URL + '/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Essential for session cookie management
    body: JSON.stringify(credentials),
  });
  
  if(response.ok) {
    const user = await response.json();
    return user;
  } else {
    // Extract error message for user feedback
    const errDetails = await response.text();
    throw errDetails;
  }
};

/**
 * Retrieve current user session information
 * 
 * Validates existing session using the stored session cookie.
 * Useful for app initialization and session persistence across page refreshes.
 * 
 * @returns {Promise<User>} Current user object if session valid
 * @throws {Object} Error object if session invalid or expired
 */
const getUserInfo = async () => {
  const response = await fetch(SERVER_URL + '/api/sessions/current', {
    credentials: 'include', // Sends existing session cookie for validation
  });
  
  const user = await response.json();
  if (response.ok) {
    return user;
  } else {
    throw user; // Server error object with details
  }
};

/**
 * Destroy current user session
 * 
 * Invalidates the session on the server side. The session cookie remains
 * in the browser but becomes invalid for subsequent requests.
 * 
 * @returns {Promise<null>} null if logout successful
 */
const logOut = async() => {
  const response = await fetch(SERVER_URL + '/api/sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  });
  
  if (response.ok)
    return null;
};

// ==============================================================================
// DEMO GAME APIs (for anonymous users)
// ==============================================================================

/**
 * Initialize a demo game session for anonymous users
 * 
 * Creates a temporary game with 3 initial cards and 1 target card.
 * No server-side persistence or user authentication required.
 * 
 * @param {string} theme - Card theme selection (default: 'university_life')
 * @returns {Promise<Object>} Demo game data with initial and target cards
 * @throws {Error} Error message if demo creation fails
 */
const startDemoGame = async (theme = 'university_life') => {
  const response = await fetch(SERVER_URL + '/api/demo/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ theme }),
  });
  
  if (response.ok) {
    const demoData = await response.json();
    
    // Convert relative image URLs to absolute URLs for proper display
    return {
      ...demoData,
      initialCards: demoData.initialCards.map(c => ({
        ...c,
        image_url: c.image_url.startsWith('http') ? c.image_url : `${SERVER_URL}/${c.image_url}`
      })),
      targetCard: {
        ...demoData.targetCard,
        image_url: demoData.targetCard.image_url.startsWith('http') 
          ? demoData.targetCard.image_url 
          : `${SERVER_URL}/${demoData.targetCard.image_url}`
      }
    };
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error starting demo game");
  }
};

/**
 * Process demo game position guess
 * 
 * Validates player's position choice and returns immediate feedback.
 * No persistence required since it's a demo.
 * 
 * @param {number} targetCardId - ID of card being positioned
 * @param {number[]} initialCardIds - IDs of initial cards in current order
 * @param {number} position - Player's position choice (0-based index)
 * @param {number} timeElapsed - Time taken for validation (optional)
 * @returns {Promise<Object>} Guess result with correctness and explanation
 * @throws {Error} Error message if guess processing fails
 */
const submitDemoGuess = async (targetCardId, initialCardIds, position, timeElapsed = 0) => {
  const response = await fetch(SERVER_URL + '/api/demo/guess', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetCardId,
      initialCardIds,
      position,
      timeElapsed
    }),
  });
  
  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error processing demo guess");
  }
};

// ==============================================================================
// FULL GAME APIs (for authenticated users)
// ==============================================================================

/**
 * Create new persistent game for authenticated user
 * 
 * Initializes a full game with database persistence, game history tracking,
 * and complete win/loss condition management.
 * 
 * Error Handling:
 * - Detects existing active games and provides recovery options
 * - Returns specific error types for different failure scenarios
 * 
 * @param {string} theme - Card theme selection (default: 'university_life')
 * @returns {Promise<Object>} New game data with initial cards
 * @throws {Object|Error} Specific error types for different scenarios
 */
const createGame = async (theme = 'university_life') => {
  const response = await fetch(SERVER_URL + '/api/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Required for user identification
    body: JSON.stringify({ theme }),
  });
  
  if (response.ok) {
    const gameData = await response.json();
    
    // Ensure proper image URL formatting
    return {
      ...gameData,
      initialCards: gameData.initialCards ? gameData.initialCards.map(c => ({
        ...c,
        image_url: c.image_url.startsWith('http') ? c.image_url : `${SERVER_URL}/${c.image_url}`
      })) : []
    };
  } else {
    const errorData = await response.json();
    
    // Special case: active game exists - provide recovery information
    if (response.status === 400 && errorData.activeGameId) {
      throw { 
        message: errorData.error, 
        activeGameId: errorData.activeGameId,
        type: 'ACTIVE_GAME_EXISTS'
      };
    }
    throw new Error(errorData.error || "Error creating game");
  }
};

/**
 * Retrieve current active game state
 * 
 * Fetches complete game information including won cards and game progress.
 * Essential for app state restoration and game continuation.
 * 
 * @returns {Promise<Object>} Current game data with all cards and metadata
 * @throws {Object|Error} Specific error types for different scenarios
 */
const getCurrentGame = async () => {
  const response = await fetch(SERVER_URL + '/api/games/current', {
    credentials: 'include', // Session cookie identifies the user
  });
  
  if (response.ok) {
    // GESTIONE 204: No Content (nessuna partita attiva)
    if (response.status === 204) {
      throw { message: "No active game found", type: 'NO_ACTIVE_GAME' };
    }
    
    const gameData = await response.json();
    
    // Convert image URLs for all card collections
    return {
      ...gameData,
      wonCards: gameData.wonCards ? gameData.wonCards.map(c => ({
        ...c,
        image_url: c.image_url.startsWith('http') ? c.image_url : `${SERVER_URL}/${c.image_url}`
      })) : [],
      allCards: gameData.allCards ? gameData.allCards.map(c => ({
        ...c,
        image_url: c.image_url.startsWith('http') ? c.image_url : `${SERVER_URL}/${c.image_url}`
      })) : []
    };
  } else {
    if (response.status === 404) {
      throw { message: "No active game found", type: 'NO_ACTIVE_GAME' };
    }
    const errorData = await response.json();
    throw new Error(errorData.error || "Error fetching current game");
  }
};

/**
 * Retrieve user's completed game history
 * 
 * Fetches all finished games with complete card details and game statistics.
 * Used for profile page and performance tracking.
 * 
 * @returns {Promise<Object[]>} Array of completed games with card details
 * @throws {Error} Error message if history retrieval fails
 */
const getGameHistory = async () => {
  const response = await fetch(SERVER_URL + '/api/games/history', {
    credentials: 'include',
  });
  
  if (response.ok) {
    const history = await response.json();
    
    // Convert image URLs for all cards in game history
    return history.map(game => ({
      ...game,
      cards: game.cards ? game.cards.map(c => ({
        ...c,
        image_url: c.image_url.startsWith('http') ? c.image_url : `${SERVER_URL}/${c.image_url}`
      })) : []
    }));
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error fetching game history");
  }
};

/**
 * Abandon active game and clean up resources
 * 
 * Permanently deletes an active game, allowing the user to start fresh.
 * Includes proper authorization checks on the server side.
 * 
 * @param {number} gameId - ID of game to abandon
 * @returns {Promise<null>} null if abandonment successful
 * @throws {Error} Error message for different failure scenarios
 */
const abandonGame = async (gameId) => {
  const response = await fetch(`${SERVER_URL}/api/games/${gameId}`, {
    method: 'DELETE',
    credentials: 'include', // Required for authorization
  });
  
  if (response.ok) {
    return null; // Successful abandonment
  } else {
    // Provide specific error messages for different HTTP status codes
    if (response.status === 404) {
      throw new Error("Game not found");
    }
    if (response.status === 403) {
      throw new Error("You can only abandon your own games");
    }
    const errorData = await response.json();
    throw new Error(errorData.error || "Error abandoning game");
  }
};

/**
 * Request next round card for active game
 * 
 * Initiates a new round by requesting a target card for positioning.
 * The card's bad_luck_index is hidden from the client until after the guess.
 * 
 * @param {number} gameId - ID of active game
 * @returns {Promise<Object>} Round card data (without bad_luck_index)
 * @throws {Object|Error} Specific error types for different scenarios
 */
const getNextRoundCard = async (gameId) => {
  const response = await fetch(`${SERVER_URL}/api/games/${gameId}/next-round`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  
  if (response.ok) {
    const roundData = await response.json();
    
    // Convert image URL for round card
    return {
      ...roundData,
      roundCard: roundData.roundCard ? {
        ...roundData.roundCard,
        image_url: roundData.roundCard.image_url.startsWith('http') 
          ? roundData.roundCard.image_url 
          : `${SERVER_URL}/${roundData.roundCard.image_url}`
      } : null
    };
  } else {
    const errorData = await response.json();
    if (response.status === 400) {
      throw { 
        message: errorData.error, 
        type: 'GAME_NOT_ACTIVE'
      };
    }
    throw new Error(errorData.error || "Error getting next round card");
  }
};

/**
 * Submit position guess for current round
 * 
 * Processes player's position choice and returns complete result including
 * the revealed bad_luck_index and game status updates.
 * 
 * @param {number} gameId - ID of active game
 * @param {number} gameCardId - ID of GameCard being positioned
 * @param {number} position - Player's position choice (0-based index)
 * @param {number} timeElapsed - Time taken for server validation
 * @returns {Promise<Object>} Complete guess result with game status
 * @throws {Object|Error} Specific error types for different scenarios
 */
const submitGameGuess = async (gameId, gameCardId, position, timeElapsed = 0) => {
  const response = await fetch(`${SERVER_URL}/api/games/${gameId}/guess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      gameCardId,
      position,
      timeElapsed
    }),
  });
  
  if (response.ok) {
    const result = await response.json();
    
    // Convert image URL for revealed card
    return {
      ...result,
      revealed_card: result.revealed_card ? {
        ...result.revealed_card,
        image_url: result.revealed_card.image_url.startsWith('http') 
          ? result.revealed_card.image_url 
          : `${SERVER_URL}/${result.revealed_card.image_url}`
      } : null
    };
  } else {
    const errorData = await response.json();
    if (response.status === 400) {
      throw { 
        message: errorData.error, 
        type: 'INVALID_GAME_STATE'
      };
    }
    throw new Error(errorData.error || "Error processing game guess");
  }
};

/**
 * Handle round timeout (30 seconds elapsed)
 * 
 * Processes automatic round failure when the timer expires.
 * Updates game state and tracks the timeout as a wrong guess.
 * 
 * @param {number} gameId - ID of active game
 * @param {number} gameCardId - ID of GameCard that timed out
 * @returns {Promise<Object>} Timeout result with updated game status
 * @throws {Object|Error} Specific error types for different scenarios
 */
const submitGameTimeout = async (gameId, gameCardId) => {
  const response = await fetch(`${SERVER_URL}/api/games/${gameId}/timeout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      gameCardId
    }),
  });
  
  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    const errorData = await response.json();
    if (response.status === 400) {
      throw { 
        message: errorData.error, 
        type: 'INVALID_GAME_STATE'
      };
    }
    throw new Error(errorData.error || "Error processing game timeout");
  }
};

// ==============================================================================
// EXPORTED API OBJECT
// ==============================================================================

/**
 * Main API object with organized function groups
 * 
 * Structure:
 * - Authentication: Session management functions
 * - Demo Games: Anonymous user functionality
 * - Full Games: Authenticated user complete game features
 * 
 * Each function is designed to be called independently with all required parameters.
 * No shared state or dependencies between functions.
 */
const API = {
  // Authentication functions
  logIn,
  getUserInfo,
  logOut,
  
  // Demo game functions (anonymous users)
  startDemoGame,
  submitDemoGuess, 
  
  // Full game functions (authenticated users)
  createGame,
  getCurrentGame,
  getGameHistory,
  abandonGame,
  getNextRoundCard,
  submitGameGuess,
  submitGameTimeout
};

export default API;