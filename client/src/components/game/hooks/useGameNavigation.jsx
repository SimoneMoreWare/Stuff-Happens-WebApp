import { useNavigate } from 'react-router';

/**
 * Hook per gestire la navigazione protetta del gioco
 * ✅ VERSIONE CORRETTA: Usa componenti React invece di window.confirm
 */
export const useGameNavigation = () => {
  const navigate = useNavigate();
  
  // ============================================================================
  // NAVIGAZIONE PROTETTA
  // ============================================================================
  
  const handleProtectedNavigation = async (gameState, gameAPI, path, onConfirmAbandon) => {
    if (gameState.isInActiveGame && (gameState.gameState === 'playing')) {
      // ✅ CORRETTO: Usa callback invece di window.confirm
      if (onConfirmAbandon) {
        onConfirmAbandon(path, gameState, gameAPI);
      }
    } else {
      navigate(path);
    }
  };
  
  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================
  
  const createNavigationHandlers = (gameState, gameAPI, timerFunctions = {}) => {
    const { startTimer } = timerFunctions;
    
    const handleContinueAfterResult = async () => {
      if (gameState.roundResult?.gameStatus === 'playing') {
        // Rimuovi console.log per produzione
        gameState.setRoundResult(null);
        gameState.setTargetCard(null);
        gameState.setCurrentRoundCard(null);
        
        const success = await gameAPI.startNextRound(gameState);
        
        if (success && startTimer) {
          startTimer();
        }
        
      } else {
        gameState.setGameState('game-over');
      }
    };
    
    const handleNewGame = async () => {
      try {
        gameState.setGameState('loading');
        gameState.cleanupGameState();
        
        await gameAPI.createNewGame(gameState);
        
      } catch (err) {
        gameState.setError('Errore nella creazione della nuova partita');
        gameState.setGameState('error');
      }
    };
    
    const handleBackHome = async (onConfirmAbandon) => {
      await handleProtectedNavigation(gameState, gameAPI, '/', onConfirmAbandon);
    };
    
    const handleAbandonGame = async () => {
      const success = await gameAPI.abandonGame(gameState);
      
      if (success) {
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    };
    
    return {
      handleContinueAfterResult,
      handleNewGame,
      handleBackHome,
      handleAbandonGame
    };
  };
  
  // ============================================================================
  // RETURN API
  // ============================================================================
  
  return {
    handleProtectedNavigation,
    createNavigationHandlers,
    navigate
  };
};