// useGameState.jsx - Custom hook for local game state management
import { useState, useEffect, useContext } from 'react';
import UserContext from '../../../context/UserContext.jsx';

/**
 * Custom hook for managing local game state
 * 
 * Handles all local state variables for the game including game status,
 * cards, rounds, and UI state. Separated from API logic for better
 * maintainability and testing. Integrates with UserContext for global state.
 * 
 * @returns {Object} Game state variables and setter functions
 */
export const useGameState = () => {
  const { 
    user, 
    setMessage, 
    updateCurrentGame, 
    clearCurrentGame, 
    isInActiveGame, 
    setIsInActiveGame 
  } = useContext(UserContext);

  // ============================================================================
  // LOCAL STATE VARIABLES
  // ============================================================================
  
  // Core game state
  const [gameState, setGameState] = useState('loading');
  const [currentGame, setCurrentGame] = useState(null);
  const [currentCards, setCurrentCards] = useState([]);
  const [targetCard, setTargetCard] = useState(null);
  const [currentRoundCard, setCurrentRoundCard] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  
  // UI and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allGameCards, setAllGameCards] = useState([]);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  
  // Abandonment tracking for API decision making
  const [wasAbandoned, setWasAbandoned] = useState(false);

  // ============================================================================
  // REACTIVE EFFECTS
  // ============================================================================

  // Update compact layout based on number of cards
  useEffect(() => {
    setIsCompactLayout(currentCards.length >= 4);
  }, [currentCards.length]);

  // Manage navigation protection based on game status
  useEffect(() => {
    if (currentGame?.status === 'playing') {
      setIsInActiveGame(true);
    } else {
      setIsInActiveGame(false);
    }
  }, [currentGame, setIsInActiveGame]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Clean up all game state variables
   * 
   * Resets the game to initial state and disables navigation protection.
   * Sets abandonment flag to inform API operations about recent cleanup.
   */
  const cleanupGameState = () => {
    setIsInActiveGame(false);
    clearCurrentGame();
    setCurrentGame(null);
    setCurrentCards([]);
    setTargetCard(null);
    setCurrentRoundCard(null);
    setRoundResult(null);
    setAllGameCards([]);
    setError('');
    setWasAbandoned(true); // Flag for API decision making
  };

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  return {
    // Context Integration
    user,
    setMessage,
    updateCurrentGame,
    clearCurrentGame,
    isInActiveGame,
    setIsInActiveGame,

    // Core Game State
    gameState,
    setGameState,
    currentGame,
    setCurrentGame,
    currentCards,
    setCurrentCards,
    targetCard,
    setTargetCard,
    currentRoundCard,
    setCurrentRoundCard,
    roundResult,
    setRoundResult,

    // UI and Error State
    loading,
    setLoading,
    error,
    setError,
    allGameCards,
    setAllGameCards,
    isCompactLayout,

    // Abandonment Tracking
    wasAbandoned,
    setWasAbandoned,

    // Utility Functions
    cleanupGameState
  };
};