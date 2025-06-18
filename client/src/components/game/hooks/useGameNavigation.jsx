import { useNavigate } from 'react-router';

/**
 * Hook per gestire la navigazione protetta del gioco
 * ✅ VERSIONE OTTIMIZZATA: setTimeout ridotti per test veloci
 */
export const useGameNavigation = () => {
  const navigate = useNavigate();
  
  const handleProtectedNavigation = async (gameState, gameAPI, path, onConfirmAbandon) => {
    if (gameState.isInActiveGame && (gameState.gameState === 'playing')) {
      if (onConfirmAbandon) {
        onConfirmAbandon(path, gameState, gameAPI);
      }
    } else {
      navigate(path);
    }
  };
  
  const createNavigationHandlers = (gameState, gameAPI, timerFunctions = {}) => {
    const { startTimer } = timerFunctions;
    
    const handleContinueAfterResult = async () => {
      if (gameState.roundResult?.gameStatus === 'playing') {
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
        // ✅ NON chiamare cleanupGameState() qui!
        // Le informazioni servono ancora a createNewGame per decidere cosa fare
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
        // ✅ IMMEDIATO - Navigazione senza delay
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