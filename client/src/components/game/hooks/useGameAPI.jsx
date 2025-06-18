// useGameAPI.jsx - VERSIONE ORIGINALE FUNZIONANTE (senza errori 400)

import API from '../../../API/API.mjs';
import { Card as CardModel } from '../../../models/Card.mjs';

/**
* Hook per gestire le chiamate API del gioco
* ✅ VERSIONE ORIGINALE che funzionava perfettamente
*/
export const useGameAPI = (gameState) => {
  
  const createNewGame = async (gameState) => {
    try {
      // ✅ CONTROLLA PRIMA del cleanup (dati ancora presenti)
      const currentState = gameState.gameState;
      const hadCurrentGame = !!gameState.currentGame;
      const roundResult = gameState.roundResult;
      const wasRecentlyAbandoned = gameState.wasAbandoned;
      
      // ✅ LOGICA MIGLIORATA per riconoscere partite appena completate
      const isGameJustCompleted = roundResult && 
        (roundResult.gameStatus === 'won' || roundResult.gameStatus === 'lost');
      
      const shouldCheckAndAbandon = !isGameJustCompleted &&
                                  !wasRecentlyAbandoned &&
                                  currentState !== 'result' &&
                                  currentState !== 'game-over' &&
                                  currentState !== 'abandoned';
      
      console.log('🎮 createNewGame - Debug values:');
      console.log('  - currentState:', currentState);
      console.log('  - hadCurrentGame:', hadCurrentGame);
      console.log('  - roundResult:', roundResult);
      console.log('  - isGameJustCompleted:', isGameJustCompleted);
      console.log('  - shouldCheckAndAbandon:', shouldCheckAndAbandon);
      
      gameState.setLoading(true);
      gameState.setError('');
      
      // ✅ RESET del flag se presente
      if (wasRecentlyAbandoned) {
        gameState.setWasAbandoned(false);
      }
      
      // ✅ Solo se necessario controlla partite attive (PRIMA del cleanup)
      if (shouldCheckAndAbandon) {
        try {
          console.log('🔍 Checking for existing game...');
          const existingGameData = await API.getCurrentGame();
          if (existingGameData && existingGameData.game && existingGameData.game.id) {
            console.log('🗑️ Abandoning existing game:', existingGameData.game.id);
            await API.abandonGame(existingGameData.game.id);
          }
        } catch (checkError) {
          console.log('✅ No active game found (404 is normal)');
          // 404 è normale = nessuna partita attiva
        }
      } else {
        console.log('⏭️ Skipping getCurrentGame check - game just completed');
      }
      
      // ✅ CLEANUP INTERNO dopo i controlli (dati usati, ora posso pulire)
      console.log('🧹 Cleaning up state before creating new game...');
      gameState.setCurrentGame(null);
      gameState.setCurrentCards([]);
      gameState.setTargetCard(null);
      gameState.setCurrentRoundCard(null);
      gameState.setRoundResult(null);
      gameState.setAllGameCards([]);
      gameState.setError('');
      
      // ✅ Crea la nuova partita
      console.log('🎯 Creating new game...');
      const gameData = await API.createGame('university_life');
      
      // ✅ Setup del nuovo gioco
      gameState.setCurrentGame(gameData.game);
      gameState.updateCurrentGame(gameData.game);
      
      // Processa le carte iniziali
      const initialCards = gameData.initialCards.map(c =>
        new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
      );
      initialCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
      
      gameState.setCurrentCards(initialCards);
      
      // Setup allGameCards per il tracking
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
      
      console.log('✅ New game created successfully');
      
    } catch (err) {
      console.error('❌ Error in createNewGame:', err);
      
      // ✅ Gestione errori specifici
      if (err.type === 'ACTIVE_GAME_EXISTS') {
        try {
          console.log('🔄 Retrying after abandoning existing game...');
          if (err.activeGameId) {
            await API.abandonGame(err.activeGameId);
            
            // Retry creazione partita
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
            
            console.log('✅ Retry successful');
          }
        } catch (retryErr) {
          console.error('❌ Retry failed:', retryErr);
          gameState.setError('Errore nella creazione della partita. Riprova tra qualche secondo.');
          gameState.setGameState('error');
        }
      } else {
        // Altri errori
        gameState.setError(err.message || 'Errore nella creazione della partita');
        gameState.setGameState('error');
      }
    } finally {
      gameState.setLoading(false);
    }
  };
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

  const processGameResult = async (gameState, position, timeElapsed) => {
    try {
      gameState.setGameState('loading');
      
      const result = await API.submitGameGuess(
        gameState.currentGame.id,
        gameState.currentRoundCard.gameCardId,
        position,
        timeElapsed
      );
      
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
      gameState.setError('Errore nell\'invio della risposta. Riprova.');
      gameState.setGameState('playing');
      return false;
    }
  };

  const processTimeUp = async (gameState) => {
    if (!gameState.currentRoundCard || gameState.gameState !== 'playing') {
      return false;
    }
    
    try {
      gameState.setGameState('loading');
      const gameId = gameState.currentGame.id;
      const gameCardId = gameState.currentRoundCard.gameCardId;
      
      const result = await API.submitGameTimeout(gameId, gameCardId);
      
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
        gameState.setTargetCard(revealedCard);
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
      if (err.message && (
        err.message.includes('Invalid game card') || 
        err.message.includes('Card already processed') ||
        err.message.includes('Card already played')
      )) {
        try {
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

  const abandonGame = async (gameState) => {
    if (!gameState.currentGame) return;
    
    try {
      await API.abandonGame(gameState.currentGame.id);
    } catch (err) {
      // Non bloccare l'operazione anche se l'abbandono fallisce
    }
    
    // Cleanup locale immediato
    gameState.cleanupGameState();
    gameState.setCurrentGame(null);
    gameState.setMessage({ type: 'info', msg: 'Partita abbandonata' });
    gameState.setGameState('abandoned');
    return true;
  };

  // ✅ NUOVA FUNZIONE SEMPLICE: Abbandona + Crea Nuova
  const abandonAndCreateNew = async (gameState) => {
    // Per ora, facciamo la stessa cosa di createNewGame
    await createNewGame(gameState);
  };

  // ✅ RETURN DELLE FUNZIONI
  return {
    createNewGame,
    startNextRound,
    processGameResult,
    processTimeUp,
    abandonGame,
    abandonAndCreateNew
  };
};