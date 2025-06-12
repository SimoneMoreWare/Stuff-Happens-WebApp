import { useNavigate } from 'react-router';

/**
 * Hook per gestire la navigazione protetta del gioco
 * ✅ VERSIONE SENZA ERRORI: Non chiama mai getCurrentGame
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
  
  const createNavigationHandlers = (gameState, gameAPI, timerFunctions = {}) => {
    const { startTimer } = timerFunctions;
    
    const handleContinueAfterResult = async () => {
      if (gameState.roundResult?.gameStatus === 'playing') {
        console.log('🎮 Continue after result - starting next round...');
        
        // Reset dello stato
        gameState.setRoundResult(null);
        gameState.setTargetCard(null);
        gameState.setCurrentRoundCard(null);
        
        // Avvia il prossimo round
        const success = await gameAPI.startNextRound(gameState);
        
        if (success && startTimer) {
          console.log('🎮 Starting timer after continue...');
          startTimer();
        }
        
      } else {
        gameState.setGameState('game-over');
      }
    };
    
    // ✅ FIX: handleNewGame NON chiama più getCurrentGame
    const handleNewGame = async () => {
      try {
        console.log('🔥 Starting completely new game...');
        
        // ✅ STEP 1: Cleanup stato locale
        gameState.setGameState('loading');
        gameState.cleanupGameState();
        
        // ✅ STEP 2: Chiama DIRETTAMENTE createNewGame (che gestisce abbandono internamente)
        await gameAPI.createNewGame(gameState);
        
        console.log('✅ New game created from navigation');
        
      } catch (err) {
        console.error('❌ Error in handleNewGame:', err);
        gameState.setError('Errore nella creazione della nuova partita');
        gameState.setGameState('error');
      }
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