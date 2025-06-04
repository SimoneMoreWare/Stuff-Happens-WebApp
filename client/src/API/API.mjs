/**
 * Frontend API client for "Stuff Happens" game
 * 
 * This file contains all functions to communicate with the backend APIs.
 * Each function is autonomous and receives all necessary parameters.
 * 
 * IMPORTANT: All functions use credentials: 'include' for session cookie management.
 * After login, all subsequent API calls automatically include the session cookie.
 * 
 * /*
 * Spiegazione delle scelte architetturali
 * Ecco le decisioni chiave:
 * 
 * Perché ogni funzione ha const da qualche parte:
 * - const SERVER_URL: Definito una sola volta in cima al file per centralizzare la configurazione. 
 *   Evita duplicazione e rende facile modificare l'URL per produzione.
 * - const response: Ogni chiamata fetch viene assegnata a una const per:
 *   - Poter riutilizzare l'oggetto response per controlli multipli (response.ok, response.status)
 *   - Evitare di chiamare fetch due volte per errore
 *   - Rendere il codice più leggibile e debuggabile
 * - const errorData: Per gestire errori in modo consistente senza duplicare await response.json()
 * 
 * API atomiche e funzionali:
 * - Ogni funzione è autonoma e riceve tutti i parametri necessari
 * - Non dipende da stato globale o componenti React
 * - Restituisce solo i dati necessari per quella specifica funzionalità
 * - Gestione errori dedicata per ogni tipo di chiamata
 * 
 * Sicurezza e autenticazione:
 * - credentials: 'include' su tutte le chiamate per gestire automaticamente i cookie di sessione
 * - Distinzione chiara tra API pubbliche (demo) e API autenticate (full games)
 * - Validazione server-side implicita (il server fa i controlli, il client li gestisce)
 * 
 * Separazione per tipologia utente:
 * - Demo APIs: per utenti anonimi (nessun credentials richiesto per alcune)
 * - Full Game APIs: solo per utenti autenticati
 * - Card APIs: miste (alcune pubbliche, altre autenticate)
 * 
 * Gestione errori intelligente:
 * - Controllo sempre di response.ok prima di processare i dati
 * - Throw di errori specifici con informazioni utili
 * - Status code 404, 403, 400 gestiti in modo differenziato
 * - Oggetti errore con tipo specifico per casi complessi (es. ACTIVE_GAME_EXISTS)
 * 
 * Non polling irragionevole:
 * Le API sono progettate per essere chiamate solo quando necessario:
 * - getCurrentGame() solo all'avvio app o dopo azioni importanti
 * - getNextRoundCard() solo quando l'utente è pronto per il prossimo round
 * - getGameHistory() solo quando l'utente visita la pagina storico
 * 
 * Dati filtrati per funzionalità:
 * - getCardWithoutIndex() per il gameplay (nasconde bad_luck_index)
 * - getCardById() per vedere dettagli completi
 * - getRandomCards() per setup iniziale giochi
 * - Ogni API restituisce esattamente quello che serve per quel caso d'uso
 * 
 */

import { User } from "../models/User.mjs";
import { Card } from "../models/Card.mjs";
import { Game } from "../models/Game.mjs";

// Base server URL - modify if different in production
const SERVER_URL = 'http://localhost:3001';

// ==============================================================================
// AUTHENTICATION APIs
// ==============================================================================

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

// ==============================================================================
// CARD APIs
// ==============================================================================

/**
 * Get all cards (mainly for debugging/admin purposes)
 * 
 * @returns {Promise<Card[]>} - Array of all cards
 * @throws {string} - Error message if request fails
 */
const getAllCards = async () => {
  const response = await fetch(SERVER_URL + '/api/cards', {
    credentials: 'include'
  });
  
  if (response.ok) {
    const cardsJson = await response.json();
    return cardsJson.map(c => new Card(c.id, c.name, c.image_url, c.bad_luck_index, c.theme));
  } else {
    throw new Error("Error fetching cards");
  }
};

/**
 * Get cards by theme
 * 
 * @param {string} theme - Theme to filter by (university_life, travel, sports, love_life, work_life)
 * @returns {Promise<Card[]>} - Array of cards for the specified theme
 * @throws {string} - Error message if request fails
 */
const getCardsByTheme = async (theme) => {
  const response = await fetch(`${SERVER_URL}/api/cards/theme/${theme}`, {
    credentials: 'include'
  });
  
  if (response.ok) {
    const cardsJson = await response.json();
    return cardsJson.map(c => new Card(c.id, c.name, c.image_url, c.bad_luck_index, c.theme));
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error fetching cards by theme");
  }
};

/**
 * Get a specific card by ID (with complete details including bad_luck_index)
 * 
 * @param {number} cardId - ID of the card to retrieve
 * @returns {Promise<Card>} - Card object with all details
 * @throws {string} - Error message if request fails
 */
const getCardById = async (cardId) => {
  const response = await fetch(`${SERVER_URL}/api/cards/${cardId}`, {
    credentials: 'include'
  });
  
  if (response.ok) {
    const cardJson = await response.json();
    return new Card(cardJson.id, cardJson.name, cardJson.image_url, cardJson.bad_luck_index, cardJson.theme);
  } else {
    if (response.status === 404) {
      throw new Error("Card not found");
    }
    throw new Error("Error fetching card");
  }
};

/**
 * Get random cards for game setup
 * 
 * @param {string} theme - Theme of cards to select from
 * @param {number} count - Number of cards to return
 * @param {number[]} excludeIds - Array of card IDs to exclude (optional)
 * @returns {Promise<Card[]>} - Array of random cards
 * @throws {string} - Error message if request fails
 */
const getRandomCards = async (theme, count, excludeIds = []) => {
  const response = await fetch(SERVER_URL + '/api/cards/random', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ theme, count, excludeIds }),
  });
  
  if (response.ok) {
    const cardsJson = await response.json();
    return cardsJson.map(c => new Card(c.id, c.name, c.image_url, c.bad_luck_index, c.theme));
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error fetching random cards");
  }
};

/**
 * Get multiple cards by their IDs
 * 
 * @param {number[]} cardIds - Array of card IDs to retrieve
 * @returns {Promise<Card[]>} - Array of cards ordered by bad_luck_index
 * @throws {string} - Error message if request fails
 */
const getCardsByIds = async (cardIds) => {
  const response = await fetch(SERVER_URL + '/api/cards/by-ids', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ ids: cardIds }),
  });
  
  if (response.ok) {
    const cardsJson = await response.json();
    return cardsJson.map(c => new Card(c.id, c.name, c.image_url, c.bad_luck_index, c.theme));
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error fetching cards");
  }
};

/**
 * Get card WITHOUT bad_luck_index (for gameplay)
 * 
 * @param {number} cardId - ID of the card to retrieve
 * @returns {Promise<Object>} - Card object without bad_luck_index
 * @throws {string} - Error message if request fails
 */
const getCardWithoutIndex = async (cardId) => {
  const response = await fetch(`${SERVER_URL}/api/cards/${cardId}/without-index`, {
    credentials: 'include'
  });
  
  if (response.ok) {
    const cardJson = await response.json();
    return cardJson; // Returns plain object without bad_luck_index
  } else {
    if (response.status === 404) {
      throw new Error("Card not found");
    }
    throw new Error("Error fetching card");
  }
};

// ==============================================================================
// DEMO GAME APIs (for anonymous users)
// ==============================================================================

/**
 * Start a demo game for anonymous users
 * 
 * @param {string} theme - Theme for the cards (default: 'university_life')
 * @returns {Promise<Object>} - Demo game data with initial cards and target card
 * @throws {string} - Error message if request fails
 */
const startDemoGame = async (theme = 'university_life') => {
  const response = await fetch(SERVER_URL + '/api/demo/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Note: No credentials needed for demo games
    body: JSON.stringify({ theme }),
  });
  
  if (response.ok) {
    const demoData = await response.json();
    return demoData;
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error starting demo game");
  }
};

/**
 * Submit a guess for demo game
 * 
 * @param {number} targetCardId - ID of the card being guessed
 * @param {number[]} initialCardIds - IDs of the initial 3 cards in order
 * @param {number} position - Position where player thinks the card belongs (0-based)
 * @param {number} timeElapsed - Time elapsed in seconds (for validation)
 * @returns {Promise<Object>} - Result of the guess with explanation
 * @throws {string} - Error message if request fails
 */
const submitDemoGuess = async (targetCardId, initialCardIds, position, timeElapsed = 0) => {
  const response = await fetch(SERVER_URL + '/api/demo/guess', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Note: No credentials needed for demo games
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

/**
 * Get game instructions for anonymous users
 * 
 * @returns {Promise<Object>} - Game instructions and rules
 * @throws {string} - Error message if request fails
 */
const getGameInstructions = async () => {
  const response = await fetch(SERVER_URL + '/api/demo/instructions');
  
  if (response.ok) {
    const instructions = await response.json();
    return instructions;
  } else {
    throw new Error("Error fetching game instructions");
  }
};

/**
 * Get practice cards for learning the scoring system
 * 
 * @param {string} theme - Theme for the cards (default: 'university_life')
 * @param {number} count - Number of cards to return (default: 5, max: 10)
 * @returns {Promise<Object>} - Practice cards with explanations
 * @throws {string} - Error message if request fails
 */
const getPracticeCards = async (theme = 'university_life', count = 5) => {
  const response = await fetch(SERVER_URL + '/api/demo/practice-cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ theme, count }),
  });
  
  if (response.ok) {
    const practiceData = await response.json();
    return practiceData;
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error fetching practice cards");
  }
};

// ==============================================================================
// FULL GAME APIs (for authenticated users)
// ==============================================================================

/**
 * Create a new full game for authenticated users
 * 
 * @param {string} theme - Theme for the cards (default: 'university_life')
 * @returns {Promise<Object>} - New game data with initial cards
 * @throws {string} - Error message if request fails
 */
const createGame = async (theme = 'university_life') => {
  const response = await fetch(SERVER_URL + '/api/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Required for authenticated endpoint
    body: JSON.stringify({ theme }),
  });
  
  if (response.ok) {
    const gameData = await response.json();
    return gameData;
  } else {
    const errorData = await response.json();
    if (response.status === 400 && errorData.activeGameId) {
      // User already has an active game
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
 * Get the current active game for authenticated user
 * 
 * @returns {Promise<Object>} - Current game data with won cards
 * @throws {string} - Error message if request fails or no active game
 */
const getCurrentGame = async () => {
  const response = await fetch(SERVER_URL + '/api/games/current', {
    credentials: 'include', // Required for authenticated endpoint
  });
  
  if (response.ok) {
    const gameData = await response.json();
    return gameData;
  } else {
    if (response.status === 404) {
      throw { message: "No active game found", type: 'NO_ACTIVE_GAME' };
    }
    const errorData = await response.json();
    throw new Error(errorData.error || "Error fetching current game");
  }
};

/**
 * Get user's game history (completed games)
 * 
 * @returns {Promise<Object[]>} - Array of completed games with card details
 * @throws {string} - Error message if request fails
 */
const getGameHistory = async () => {
  const response = await fetch(SERVER_URL + '/api/games/history', {
    credentials: 'include', // Required for authenticated endpoint
  });
  
  if (response.ok) {
    const history = await response.json();
    return history;
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error fetching game history");
  }
};

/**
 * Get specific game details by ID
 * 
 * @param {number} gameId - ID of the game to retrieve
 * @returns {Promise<Object>} - Complete game information
 * @throws {string} - Error message if request fails
 */
const getGameById = async (gameId) => {
  const response = await fetch(`${SERVER_URL}/api/games/${gameId}`, {
    credentials: 'include', // Required for authentication check
  });
  
  if (response.ok) {
    const gameData = await response.json();
    return gameData;
  } else {
    if (response.status === 404) {
      throw new Error("Game not found");
    }
    if (response.status === 403) {
      throw new Error("You can only access your own games");
    }
    const errorData = await response.json();
    throw new Error(errorData.error || "Error fetching game");
  }
};

/**
 * Abandon/delete a game in progress
 * 
 * @param {number} gameId - ID of the game to abandon
 * @returns {Promise<null>} - null if successful
 * @throws {string} - Error message if request fails
 */
const abandonGame = async (gameId) => {
  const response = await fetch(`${SERVER_URL}/api/games/${gameId}`, {
    method: 'DELETE',
    credentials: 'include', // Required for authenticated endpoint
  });
  
  if (response.ok) {
    return null; // Success - game abandoned
  } else {
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
 * Start next round or get current round card
 * 
 * @param {number} gameId - ID of the game
 * @returns {Promise<Object>} - Round card data (without bad_luck_index)
 * @throws {string} - Error message if request fails
 */
const getNextRoundCard = async (gameId) => {
  const response = await fetch(`${SERVER_URL}/api/games/${gameId}/next-round`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Required for authentication check
  });
  
  if (response.ok) {
    const roundData = await response.json();
    return roundData;
  } else {
    const errorData = await response.json();
    if (response.status === 400) {
      // Game might be completed or other specific error
      throw { 
        message: errorData.error, 
        type: 'GAME_NOT_ACTIVE'
      };
    }
    throw new Error(errorData.error || "Error getting next round card");
  }
};

/**
 * Submit a position guess for the current round card
 * 
 * @param {number} gameId - ID of the game
 * @param {number} gameCardId - ID of the GameCard being guessed
 * @param {number} position - Position where player thinks the card belongs (0-based)
 * @param {number} timeElapsed - Time elapsed in seconds (for server-side validation)
 * @returns {Promise<Object>} - Result of the guess with game status
 * @throws {string} - Error message if request fails
 */
const submitGameGuess = async (gameId, gameCardId, position, timeElapsed = 0) => {
  const response = await fetch(`${SERVER_URL}/api/games/${gameId}/guess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Required for authenticated endpoint
    body: JSON.stringify({
      gameCardId,
      position,
      timeElapsed
    }),
  });
  
  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    const errorData = await response.json();
    if (response.status === 400) {
      // Invalid game state or other specific error
      throw { 
        message: errorData.error, 
        type: 'INVALID_GAME_STATE'
      };
    }
    throw new Error(errorData.error || "Error processing game guess");
  }
};

// ==============================================================================
// EXPORTED API OBJECT
// ==============================================================================

/**
 * Main API object containing all available functions
 * 
 * Organized by functionality:
 * - Authentication: logIn, getUserInfo, logOut
 * - Cards: getAllCards, getCardsByTheme, getCardById, etc.
 * - Demo Games: startDemoGame, submitDemoGuess, getGameInstructions, etc.
 * - Full Games: createGame, getCurrentGame, getGameHistory, etc.
 */
const API = {
  // Authentication
  logIn,
  getUserInfo,
  logOut,
  
  // Cards
  getAllCards,
  getCardsByTheme,
  getCardById,
  getRandomCards,
  getCardsByIds,
  getCardWithoutIndex,
  
  // Demo Games (anonymous users)
  startDemoGame,
  submitDemoGuess,
  getGameInstructions,
  getPracticeCards,
  
  // Full Games (authenticated users)
  createGame,
  getCurrentGame,
  getGameHistory,
  getGameById,
  abandonGame,
  getNextRoundCard,
  submitGameGuess
};

export default API;