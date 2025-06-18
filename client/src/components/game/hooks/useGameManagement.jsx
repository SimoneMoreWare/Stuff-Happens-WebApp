// useGameManagement.jsx - Main game management hook combining state, API, and navigation
import { useGameState } from './useGameState.jsx';
import { useGameAPI } from './useGameAPI.jsx';
import { useGameNavigation } from './useGameNavigation.jsx';

/**
 * Main hook for game management functionality
 * 
 * Combines specialized hooks for state management, API operations, and navigation
 * to provide a unified interface for game operations. Handles the complete game
 * lifecycle including creation, round management, and cleanup.
 * 
 * @returns {Object} Game state, actions, and handlers
 */
export const useGameManagement = () => {
  
  // ============================================================================
  // SPECIALIZED HOOKS INTEGRATION
  // ============================================================================
  
  // Local game state management
  const gameState = useGameState();
  
  // API operations handling
  const gameAPI = useGameAPI(gameState);
  
  // Protected navigation management
  const navigation = useGameNavigation();
  
  // ============================================================================
  // PRIMARY GAME ACTIONS
  // ============================================================================
  
  /**
   * Create a new game session
   * Handles cleanup of existing games and initializes new game state
   */
  const handleCreateNewGame = async () => {
    await gameAPI.createNewGame(gameState);
  };
  
  /**
   * Abandon current game and create a new one
   * Simplified flow for quick game restart
   */
  const handleAbandonAndCreateNew = async () => {
    await gameAPI.abandonAndCreateNew(gameState);
  };
  
  /**
   * Start the next round by fetching a new target card
   * @returns {boolean} Success status
   */
  const startNextRound = async () => {
    return await gameAPI.startNextRound(gameState);
  };
  
  /**
   * Process player's position guess
   * @param {number} position - Selected position for target card
   * @param {number} timeElapsed - Time taken to make the guess
   * @returns {boolean} Success status
   */
  const processGameResult = async (position, timeElapsed) => {
    return await gameAPI.processGameResult(gameState, position, timeElapsed);
  };
  
  /**
   * Handle timeout when player doesn't make a guess in time
   * @returns {boolean} Success status
   */
  const processTimeUp = async () => {
    return await gameAPI.processTimeUp(gameState);
  };
  
  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================
  
  // Create navigation handlers with game state integration
  const {
    handleContinueAfterResult,
    handleNewGame,
    handleBackHome,
    handleAbandonGame
  } = navigation.createNavigationHandlers(gameState, gameAPI);
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  return {
    // Game State Properties
    gameState: gameState.gameState,
    currentGame: gameState.currentGame,
    currentCards: gameState.currentCards,
    targetCard: gameState.targetCard,
    currentRoundCard: gameState.currentRoundCard,
    roundResult: gameState.roundResult,
    loading: gameState.loading,
    error: gameState.error,
    allGameCards: gameState.allGameCards,
    isCompactLayout: gameState.isCompactLayout,
    user: gameState.user,
    
    // Primary Game Actions
    handleCreateNewGame,        // Create new game with cleanup
    handleAbandonAndCreateNew,  // Quick restart functionality
    startNextRound,             // Begin next round
    processGameResult,          // Handle player guess
    processTimeUp,              // Handle timeout
    
    // Navigation Actions
    handleContinueAfterResult,  // Continue after round result
    handleNewGame,              // New game from within game interface
    handleBackHome,             // Return to home page
    handleAbandonGame,          // Abandon current game
    
    // Utility Functions
    cleanupGameState: gameState.cleanupGameState  // Clean up game state
  };
};