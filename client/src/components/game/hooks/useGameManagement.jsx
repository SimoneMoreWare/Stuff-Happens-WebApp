import { useGameState } from './useGameState.jsx';
import { useGameAPI } from './useGameAPI.jsx';
import { useGameNavigation } from './useGameNavigation.jsx';

/**
 * Hook principale per la gestione del gioco
 * ✅ VERSIONE SEMPLICE: Solo nuove partite sempre
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
  // ✅ HANDLERS SEMPLIFICATI
  // ============================================================================
  
  // ✅ UNICA FUNZIONE: Crea sempre nuova partita
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
  // ✅ RETURN API SEMPLIFICATA
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
    
    // ✅ Actions SEMPLIFICATI
    handleCreateNewGame,        // UNICA funzione per creare partite
    startNextRound,
    processGameResult,
    processTimeUp,
    handleContinueAfterResult,
    handleNewGame,              // Per bottoni interni al gioco
    handleBackHome,
    handleAbandonGame,
    
    // Utils (da useGameState)
    cleanupGameState: gameState.cleanupGameState
  };
};