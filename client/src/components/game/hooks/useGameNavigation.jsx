import { useNavigate } from 'react-router';

/**
 * Hook per gestire la navigazione protetta del gioco
 * Separato per mantenere file piccoli e logica chiara
 */
export const useGameNavigation = () => {
  const navigate = useNavigate();
  
  // ============================================================================
  // NAVIGAZIONE PROTETTA
  // ============================================================================
  
  const handleProtectedNavigation = async (gameState, gameAPI, path) => {
    if (gameState.isInActiveGame && (gameState.gameState === 'playing')) {
      const confirmMessage = 'Hai una partita in corso. Vuoi abbandonarla per continuare? Tutti i progressi andranno persi.';
      const userConfirmed = window.confirm(confirmMessage);
      
      if (userConfirmed) {
        try {
          console.log('🗑️ Auto-abandoning game before navigation to:', path);
          
          if (gameState.currentGame) {
            await gameAPI.abandonGame(gameState);
            console.log('✅ Game auto-abandoned successfully');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          gameState.cleanupGameState();
          gameState.setMessage({ type: 'info', msg: 'Partita abbandonata automaticamente' });
          navigate(path);
          
        } catch (err) {
          console.error('❌ Error auto-abandoning game:', err);
          gameState.cleanupGameState();
          gameState.setMessage({ type: 'warning', msg: 'Partita abbandonata localmente (errore API)' });
          navigate(path);
        }
      }
    } else {
      navigate(path);
    }
  };
  
  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================
  
  const createNavigationHandlers = (gameState, gameAPI) => {
    
    const handleContinueAfterResult = () => {
      if (gameState.roundResult?.gameStatus === 'playing') {
        gameState.setRoundResult(null);
        gameState.setTargetCard(null);
        gameState.setCurrentRoundCard(null);
        gameAPI.startNextRound(gameState);
      } else {
        gameState.setGameState('game-over');
      }
    };
    
    const handleNewGame = () => {
      gameState.setGameState('loading');
      gameState.cleanupGameState();
      gameAPI.createNewGame(gameState);
    };
    
    const handleBackHome = async () => {
      await handleProtectedNavigation(gameState, gameAPI, '/');
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