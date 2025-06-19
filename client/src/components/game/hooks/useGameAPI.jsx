// useGameAPI.jsx - Custom hook for game API operations
import API from '../../../API/API.mjs';
import { Card as CardModel } from '../../../models/Card.mjs';

/**
 * Custom hook for handling game API operations
 * 
 * Provides functions for game lifecycle management:
 * - Creating new games
 * - Starting rounds
 * - Processing game results
 * - Handling timeouts and game abandonment
 * 
 * @param {Object} gameState - Game state object with setters
 * @returns {Object} API operation functions
 */
export const useGameAPI = (gameState) => {
  
  /**
   * Create a new game session
   * Handles existing game cleanup and initializes new game state
   */
  const createNewGame = async (gameState) => {
    try {
      // Check current state before cleanup
      const currentState = gameState.gameState;
      const roundResult = gameState.roundResult;
      const wasRecentlyAbandoned = gameState.wasAbandoned;
      
      // Determine if game was just completed (don't abandon completed games)
      const isGameJustCompleted = roundResult && 
        (roundResult.gameStatus === 'won' || roundResult.gameStatus === 'lost');
      
      const shouldCheckAndAbandon = !isGameJustCompleted &&
                                  !wasRecentlyAbandoned &&
                                  currentState !== 'result' &&
                                  currentState !== 'game-over' &&
                                  currentState !== 'abandoned';
      
      gameState.setLoading(true);
      gameState.setError('');
      
      // Reset abandonment flag if present
      if (wasRecentlyAbandoned) {
        gameState.setWasAbandoned(false);
      }
      
      // Check and abandon existing active games if necessary
      if (shouldCheckAndAbandon) {
        try {
          const existingGameData = await API.getCurrentGame();
          if (existingGameData && existingGameData.game && existingGameData.game.id) {
            await API.abandonGame(existingGameData.game.id);
          }
        } catch (checkError) {
          // 404 is normal - no active game found
        }
      }
      
      // Clean up internal state after checks
      gameState.setCurrentGame(null);
      gameState.setCurrentCards([]);
      gameState.setTargetCard(null);
      gameState.setCurrentRoundCard(null);
      gameState.setRoundResult(null);
      gameState.setAllGameCards([]);
      gameState.setError('');
      
      // Create new game
      const gameData = await API.createGame('university_life');
      
      // Setup new game state
      gameState.setCurrentGame(gameData.game);
      gameState.updateCurrentGame(gameData.game);
      
      // Process initial cards
      const initialCards = gameData.initialCards.map(c =>
        new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
      );
      initialCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
      
      gameState.setCurrentCards(initialCards);
      
      // Setup game cards tracking
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
      // Handle specific error types
      if (err.type === 'ACTIVE_GAME_EXISTS') {
        try {
          // Retry after abandoning existing game
          if (err.activeGameId) {
            await API.abandonGame(err.activeGameId);
            
            // Retry game creation
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
            gameState.setMessage({ 
              type: 'success', 
              msg: 'Nuova partita creata (precedente partita abbandonata automaticamente)!' 
            });
          }
        } catch (retryErr) {
          gameState.setError('Errore nella creazione della partita. Riprova tra qualche secondo.');
          gameState.setGameState('error');
        }
      } else {
        // Handle other errors
        gameState.setError(err.message || 'Errore nella creazione della partita');
        gameState.setGameState('error');
      }
    } finally {
      gameState.setLoading(false);
    }
  };

  /**
   * Start next round by fetching a new card from the server
   */
  const startNextRound = async (gameState) => {
    try {
      gameState.setError('');
      gameState.setGameState('loading');
      
      const roundData = await API.getNextRoundCard(gameState.currentGame.id);
      
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
      if (err.type === 'GAME_NOT_ACTIVE') {
        gameState.setGameState('game-over');
      } else {
        gameState.setError(err.message || 'Errore nell\'avvio del round');
        gameState.setGameState('playing');
      }
      return false;
    }
  };

  /**
   * Process game result after player makes a guess
   */
  const processGameResult = async (gameState, position, timeElapsed) => {
    try {
      gameState.setGameState('loading');
      
      const result = await API.submitGameGuess(
        gameState.currentGame.id,
        gameState.currentRoundCard.gameCardId,
        position,
        timeElapsed
      );
      
      // Update game state from server response
      if (result.game) {
        gameState.setCurrentGame(result.game);
        gameState.updateCurrentGame(result.game);
      }
      
      // Process revealed card
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
        
        // Add card to player's collection if guess was correct
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
      
      // Set round result for display
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
      gameState.setError('Errore nell\'invio della risposta. Riprova.');
      gameState.setGameState('playing');
      return false;
    }
  };

  /**
   * Process timeout when player doesn't make a guess in time
   */
  const processTimeUp = async (gameState) => {
    if (!gameState.currentRoundCard || gameState.gameState !== 'playing') {
      return false;
    }
    
    try {
      gameState.setGameState('loading');
      const gameId = gameState.currentGame.id;
      const gameCardId = gameState.currentRoundCard.gameCardId;
      
      const result = await API.submitGameTimeout(gameId, gameCardId);
      
      // Update game state
      if (result.game) {
        gameState.setCurrentGame(result.game);
        gameState.updateCurrentGame(result.game);
      }
      
      // Process revealed card for timeout
      if (result.revealed_card) {
        const revealedCard = Array.isArray(result.revealed_card) ? result.revealed_card[0] : result.revealed_card;
        const revealedCardModel = new CardModel(
          revealedCard.id,
          revealedCard.name,
          revealedCard.image_url,
          revealedCard.bad_luck_index,
          revealedCard.theme
        );
        gameState.setTargetCard(revealedCard);
      }
      
      // Set timeout result
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
      // Handle specific timeout errors
      if (err.message && (
        err.message.includes('Invalid game card') || 
        err.message.includes('Card already processed') ||
        err.message.includes('Card already played')
      )) {
        try {
          // Try to reload current game state
          const gameData = await API.getCurrentGame();
          if (gameData.game.current_round > gameState.currentGame.current_round) {
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

  /**
   * Abandon current game
   */
  const abandonGame = async (gameState) => {
    if (!gameState.currentGame) return;
    
    try {
      await API.abandonGame(gameState.currentGame.id);
    } catch (err) {
      // Don't block operation even if abandon fails
    }
    
    // Immediate local cleanup
    gameState.cleanupGameState();
    gameState.setCurrentGame(null);
    gameState.setMessage({ type: 'info', msg: 'Partita abbandonata' });
    gameState.setGameState('abandoned');
    return true;
  };

  /**
   * Abandon current game and create a new one
   */
  const abandonAndCreateNew = async (gameState) => {
    // For now, same as createNewGame which handles abandonment
    await createNewGame(gameState);
  };
  
  // Return API operation functions
  return {
    createNewGame,
    startNextRound,
    processGameResult,
    processTimeUp,
    abandonGame,
    abandonAndCreateNew
  };
};