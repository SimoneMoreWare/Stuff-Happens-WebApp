import API from '../../../API/API.mjs';
import { Card as CardModel } from '../../../models/Card.mjs';

/**
 * Hook per gestire le chiamate API del gioco
 * Separato dallo stato per mantenere file piccoli
 */
export const useGameAPI = (gameState) => {
  
  // ============================================================================
  // INIZIALIZZAZIONE E CREAZIONE GIOCO
  // ============================================================================
  
  const checkCurrentGame = async (gameState) => {
    try {
      gameState.setLoading(true);
      gameState.setError('');
      
      console.log('🎮 Checking for existing game...');
      
      try {
        const gameData = await API.getCurrentGame();
        console.log('📋 Found existing game:', gameData);
        
        gameState.setCurrentGame(gameData.game);
        gameState.updateCurrentGame(gameData.game);
        
        // Gestione allGameCards
        let allGameCardsData = [];
        if (gameData.allCards && gameData.allCards.length > 0) {
          allGameCardsData = gameData.allCards;
        } else if (gameData.wonCards && gameData.wonCards.length > 0) {
          const wonCards = gameData.wonCards;
          const sortedByIndex = [...wonCards].sort((a, b) => a.bad_luck_index - b.bad_luck_index);
          
          allGameCardsData = sortedByIndex.map((card, index) => ({
            ...card,
            is_initial: index < 3,
            round_number: index < 3 ? 0 : index - 2,
            guessed_correctly: index < 3 ? null : true
          }));
        }
        gameState.setAllGameCards(allGameCardsData);
        
        // Gestione carte vinte
        if (gameData.wonCards && gameData.wonCards.length > 0) {
          const wonCards = gameData.wonCards.map(c => 
            new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
          );
          wonCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
          gameState.setCurrentCards(wonCards);
        }
        
        if (gameData.game.status !== 'playing') {
          gameState.setGameState('game-over');
          return;
        }
        
        if (gameData.game.cards_collected >= 6 || gameData.game.wrong_guesses >= 3) {
          gameState.setGameState('game-over');
          return;
        }
        
        gameState.setGameState('playing');
        
      } catch (gameError) {
        console.log('ℹ️ No active game found');
        gameState.cleanupGameState();
        gameState.setGameState('no-game');
        return 'no-game';
      }
      
    } catch (err) {
      console.error('❌ Error checking current game:', err);
      gameState.setError('Errore nel caricamento della partita');
      gameState.setGameState('error');
    } finally {
      gameState.setLoading(false);
    }
  };
  
  const createNewGame = async (gameState) => {
    try {
      gameState.setLoading(true);
      gameState.setError('');
      
      console.log('🆕 Creating new game...');
      
      const gameData = await API.createGame('university_life');
      console.log('✅ Game created:', gameData);
      
      gameState.setCurrentGame(gameData.game);
      gameState.updateCurrentGame(gameData.game);
      
      const initialCards = gameData.initialCards.map(c =>
        new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
      );
      initialCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
      gameState.setCurrentCards(initialCards);
      
      const allGameCardsData = gameData.initialCards.map(c => ({
        id: c.id,
        name: c.name,
        image_url: c.image_url,
        bad_luck_index: c.bad_luck_index,
        theme: c.theme,
        is_initial: true,
        round_number: 0,
        guessed_correctly: null
      }));
      gameState.setAllGameCards(allGameCardsData);
      
      gameState.setGameState('playing');
      gameState.setMessage({ type: 'success', msg: 'Nuova partita creata!' });
      
    } catch (err) {
      console.error('❌ Error creating game:', err);
      
      if (err.type === 'ACTIVE_GAME_EXISTS') {
        console.log('🔄 Game exists, trying to abandon and retry...');
        
        try {
          if (err.activeGameId) {
            await API.abandonGame(err.activeGameId);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Retry creazione
            const retryGameData = await API.createGame('university_life');
            gameState.setCurrentGame(retryGameData.game);
            gameState.updateCurrentGame(retryGameData.game);
            
            const initialCards = retryGameData.initialCards.map(c =>
              new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
            );
            initialCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
            gameState.setCurrentCards(initialCards);
            
            const allGameCardsData = retryGameData.initialCards.map(c => ({
              id: c.id,
              name: c.name,
              image_url: c.image_url,
              bad_luck_index: c.bad_luck_index,
              theme: c.theme,
              is_initial: true,
              round_number: 0,
              guessed_correctly: null
            }));
            gameState.setAllGameCards(allGameCardsData);
            
            gameState.setGameState('playing');
            gameState.setMessage({ type: 'success', msg: 'Nuova partita creata (precedente abbandonata)!' });
          }
        } catch (retryErr) {
          console.error('❌ Error in abandon+retry:', retryErr);
          gameState.setError('Hai già una partita in corso. Completa quella prima di iniziarne una nuova.');
          setTimeout(() => checkCurrentGame(gameState), 1000);
        }
      } else {
        gameState.setError(err.message || 'Errore nella creazione della partita');
      }
    } finally {
      gameState.setLoading(false);
    }
  };
  
  // ============================================================================
  // GESTIONE ROUND
  // ============================================================================
  
  const startNextRound = async (gameState) => {
    try {
      gameState.setError('');
      gameState.setGameState('loading');
      
      console.log('🎯 Starting next round for game:', gameState.currentGame.id);
      
      const roundData = await API.getNextRoundCard(gameState.currentGame.id);
      console.log('🃏 Got round card:', roundData);
      
      const roundCard = {
        id: roundData.roundCard.id,
        name: roundData.roundCard.name,
        image_url: roundData.roundCard.image_url,
        theme: roundData.roundCard.theme
      };
      
      gameState.setTargetCard(roundCard);
      gameState.setCurrentRoundCard(roundData.roundCard);
      gameState.setGameState('playing');
      
      return true;
      
    } catch (err) {
      console.error('❌ Error starting round:', err);
      
      if (err.type === 'GAME_NOT_ACTIVE') {
        gameState.setGameState('game-over');
      } else {
        gameState.setError(err.message || 'Errore nell\'avvio del round');
        gameState.setGameState('playing');
      }
      return false;
    }
  };
  
  // ============================================================================
  // GESTIONE RISULTATI
  // ============================================================================
  
  const processGameResult = async (gameState, position, timeElapsed) => {
    try {
      gameState.setGameState('loading');
      
      console.log('🎯 Submitting guess:', {
        gameId: gameState.currentGame.id,
        gameCardId: gameState.currentRoundCard.gameCardId,
        position,
        timeElapsed
      });
      
      const result = await API.submitGameGuess(
        gameState.currentGame.id,
        gameState.currentRoundCard.gameCardId,
        position,
        timeElapsed
      );
      
      console.log('📊 Guess result:', result);
      
      if (result.game) {
        gameState.setCurrentGame(result.game);
        gameState.updateCurrentGame(result.game);
      }
      
      if (result.revealed_card) {
        const revealedCard = Array.isArray(result.revealed_card) ? result.revealed_card[0] : result.revealed_card;
        const revealedCardModel = new CardModel(
          revealedCard.id,
          revealedCard.name,
          revealedCard.image_url,
          revealedCard.bad_luck_index,
          revealedCard.theme
        );
        gameState.setTargetCard(revealedCardModel);
        
        if (result.correct) {
          gameState.setCurrentCards(prev => {
            const newCards = [...prev, revealedCardModel];
            newCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
            return newCards;
          });
          
          gameState.setAllGameCards(prev => [...prev, {
            id: revealedCard.id,
            name: revealedCard.name,
            image_url: revealedCard.image_url,
            bad_luck_index: revealedCard.bad_luck_index,
            theme: revealedCard.theme,
            is_initial: false,
            round_number: gameState.currentGame.current_round,
            guessed_correctly: true
          }]);
        }
      }
      
      gameState.setRoundResult({
        isCorrect: result.correct,
        correctPosition: result.correctPosition,
        guessedPosition: position,
        explanation: result.message,
        gameStatus: result.gameStatus
      });
      
      gameState.setGameState('result');
      return true;
      
    } catch (err) {
      console.error('❌ Error submitting guess:', err);
      gameState.setError('Errore nell\'invio della risposta. Riprova.');
      gameState.setGameState('playing');
      return false;
    }
  };
  
  const processTimeUp = async (gameState) => {
    if (!gameState.currentRoundCard || gameState.gameState !== 'playing') {
      console.log('⏰ Timer already handled, no round card, or wrong game state');
      return false;
    }
    
    console.log('⏰ Time expired! Submitting timeout...');
    
    try {
      gameState.setGameState('loading');
      
      const gameId = gameState.currentGame.id;
      const gameCardId = gameState.currentRoundCard.gameCardId;
      
      console.log('🎯 Sending timeout for:', { gameId, gameCardId });
      
      const result = await API.submitGameTimeout(gameId, gameCardId);
      
      console.log('📊 Timeout result:', result);
      
      if (result.game) {
        gameState.setCurrentGame(result.game);
        gameState.updateCurrentGame(result.game);
      }
      
      if (result.revealed_card) {
        const revealedCard = Array.isArray(result.revealed_card) ? result.revealed_card[0] : result.revealed_card;
        const revealedCardModel = new CardModel(
          revealedCard.id,
          revealedCard.name,
          revealedCard.image_url,
          revealedCard.bad_luck_index,
          revealedCard.theme
        );
        gameState.setTargetCard(revealedCardModel);
      }
      
      gameState.setRoundResult({
        isCorrect: false,
        isTimeout: result.isTimeout || true,
        correctPosition: result.correctPosition,
        explanation: result.message,
        gameStatus: result.gameStatus
      });
      
      gameState.setGameState('result');
      return true;
      
    } catch (err) {
      console.error('❌ Error submitting timeout:', err);
      
      if (err.message && (
        err.message.includes('Invalid game card') || 
        err.message.includes('Card already processed') ||
        err.message.includes('Card already played')
      )) {
        console.log('🔄 Card already processed by previous call, continuing...');
        
        try {
          const gameData = await API.getCurrentGame();
          
          if (gameData.game.current_round > gameState.currentGame.current_round) {
            console.log('✅ Round already advanced, continuing to next round');
            gameState.setCurrentGame(gameData.game);
            gameState.updateCurrentGame(gameData.game);
            gameState.setRoundResult(null);
            gameState.setTargetCard(null);
            gameState.setCurrentRoundCard(null);
            gameState.setGameState('playing');
            return true;
          } else {
            gameState.setError('Errore nella gestione del timeout. Riprova.');
            gameState.setGameState('playing');
            return false;
          }
        } catch (reloadErr) {
          console.error('❌ Error reloading game state:', reloadErr);
          gameState.setError('Errore nella gestione del timeout. Riprova.');
          gameState.setGameState('playing');
          return false;
        }
      } else {
        gameState.setError('Errore nella gestione del timeout. Riprova.');
        gameState.setGameState('playing');
        return false;
      }
    }
  };
  
  const abandonGame = async (gameState) => {
    if (!gameState.currentGame) return;
    
    try {
      console.log('🗑️ Abandoning game:', gameState.currentGame.id);
      await API.abandonGame(gameState.currentGame.id);
      console.log('✅ Game abandoned successfully');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('❌ Error abandoning game:', err);
    }
    
    gameState.cleanupGameState();
    gameState.setMessage({ type: 'info', msg: 'Partita abbandonata' });
    gameState.setGameState('abandoned');
    
    return true;
  };
  
  // ============================================================================
  // RETURN API
  // ============================================================================
  
  return {
    checkCurrentGame,
    createNewGame,
    startNextRound,
    processGameResult,
    processTimeUp,
    abandonGame
  };
};