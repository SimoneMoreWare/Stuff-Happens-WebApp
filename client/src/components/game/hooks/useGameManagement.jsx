import { useGameState } from './useGameState.jsx';
import { useGameAPI } from './useGameAPI.jsx';
import { useGameNavigation } from './useGameNavigation.jsx';

/**
 * Hook principale per la gestione del gioco
 * Compone tutti gli altri hooks specializzati
 * 
 * Versione finale: ~80 righe (da 540!)
 * Architettura modulare e scalabile
 */
export const useGameManagement = () => {
  
  // ============================================================================
  // HOOKS SPECIALIZZATI
  // ============================================================================
  
  // Gestione stato locale del gioco
  const gameState = useGameState();
  
  // Gestione chiamate API
  const gameAPI = useGameAPI();
  
  // Gestione navigazione protetta
  const navigation = useGameNavigation();
  
  // ============================================================================
  // HANDLERS COMPOSITI
  // ============================================================================
  
  // Inizializzazione del gioco
  const checkCurrentGame = async () => {
    const result = await gameAPI.checkCurrentGame(gameState);
    
    // Se nessun gioco attivo, crea nuovo gioco
    if (result === 'no-game') {
      setTimeout(() => {
        handleCreateNewGame();
      }, 500);
    }
  };
  
  // Creazione nuovo gioco
  const handleCreateNewGame = async () => {
    await gameAPI.createNewGame(gameState);
  };
  
  // Avvio round con integrazione timer
  const startNextRound = async () => {
    return await gameAPI.startNextRound(gameState);
  };
  
  // Processamento risultati
  const processGameResult = async (position, timeElapsed) => {
    return await gameAPI.processGameResult(gameState, position, timeElapsed);
  };
  
  // Gestione timeout
  const processTimeUp = async () => {
    return await gameAPI.processTimeUp(gameState);
  };
  
  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================
  
  // Crea tutti gli handlers di navigazione
  const {
    handleContinueAfterResult,
    handleNewGame,
    handleBackHome,
    handleAbandonGame
  } = navigation.createNavigationHandlers(gameState, gameAPI);
  
  // ============================================================================
  // RETURN API COMPLETA
  // ============================================================================
  
  return {
    // State (da useGameState)
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
    
    // Actions (compositi)
    checkCurrentGame,
    handleCreateNewGame,
    startNextRound,
    processGameResult,
    processTimeUp,
    handleContinueAfterResult,
    handleNewGame,
    handleBackHome,
    handleAbandonGame,
    
    // Utils (da useGameState)
    cleanupGameState: gameState.cleanupGameState
  };
};