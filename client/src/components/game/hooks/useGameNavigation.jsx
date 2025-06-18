// useGameNavigation.jsx - Custom hook for protected game navigation
import { useNavigate } from 'react-router';

/**
 * Custom hook for managing protected game navigation
 * 
 * Handles navigation scenarios where active games need to be properly
 * abandoned before allowing navigation to other routes. Provides handlers
 * for common navigation patterns within the game interface.
 * 
 * @returns {Object} Navigation utilities and handler creators
 */
export const useGameNavigation = () => {
  const navigate = useNavigate();

  /**
   * Handle navigation with game abandonment protection
   * 
   * Checks if there's an active game in progress and either navigates
   * directly or triggers abandonment confirmation based on game state.
   * 
   * @param {Object} gameState - Current game state object
   * @param {Object} gameAPI - Game API operations object
   * @param {string} path - Target navigation path
   * @param {Function} onConfirmAbandon - Callback for abandonment confirmation
   */
  const handleProtectedNavigation = async (gameState, gameAPI, path, onConfirmAbandon) => {
    if (gameState.isInActiveGame && (gameState.gameState === 'playing')) {
      if (onConfirmAbandon) {
        onConfirmAbandon(path, gameState, gameAPI);
      }
    } else {
      navigate(path);
    }
  };

  /**
   * Create navigation handlers with game state integration
   * 
   * Returns a set of navigation handlers that are aware of the current
   * game state and can perform appropriate cleanup before navigation.
   * 
   * @param {Object} gameState - Game state management object
   * @param {Object} gameAPI - Game API operations object
   * @param {Object} timerFunctions - Optional timer control functions
   * @returns {Object} Set of navigation handler functions
   */
  const createNavigationHandlers = (gameState, gameAPI, timerFunctions = {}) => {
    const { startTimer } = timerFunctions;

    /**
     * Continue to next round after viewing round result
     * Transitions from result state back to playing state with new round
     */
    const handleContinueAfterResult = async () => {
      if (gameState.roundResult?.gameStatus === 'playing') {
        // Clear result state
        gameState.setRoundResult(null);
        gameState.setTargetCard(null);
        gameState.setCurrentRoundCard(null);

        // Start next round
        const success = await gameAPI.startNextRound(gameState);

        // Start timer if round started successfully
        if (success && startTimer) {
          startTimer();
        }
      } else {
        // Game ended, transition to game over state
        gameState.setGameState('game-over');
      }
    };

    /**
     * Create new game from within game interface
     * Handles game creation with appropriate state management
     */
    const handleNewGame = async () => {
      try {
        gameState.setGameState('loading');
        // Game state information needed by createNewGame for decision making
        await gameAPI.createNewGame(gameState);
      } catch (err) {
        gameState.setError('Errore nella creazione della nuova partita');
        gameState.setGameState('error');
      }
    };

    /**
     * Navigate back to home page with game protection
     * Uses protected navigation to handle active game abandonment
     */
    const handleBackHome = async (onConfirmAbandon) => {
      await handleProtectedNavigation(gameState, gameAPI, '/', onConfirmAbandon);
    };

    /**
     * Abandon current game and return to home
     * Performs cleanup and immediate navigation
     */
    const handleAbandonGame = async () => {
      const success = await gameAPI.abandonGame(gameState);

      if (success) {
        navigate('/');
      }
    };

    return {
      handleContinueAfterResult,
      handleNewGame,
      handleBackHome,
      handleAbandonGame
    };
  };

  return {
    handleProtectedNavigation,
    createNavigationHandlers,
    navigate
  };
};