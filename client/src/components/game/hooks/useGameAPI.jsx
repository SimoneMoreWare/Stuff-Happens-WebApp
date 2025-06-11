import API from '../../../API/API.mjs';
import { Card as CardModel } from '../../../models/Card.mjs';

/**
 * Hook per gestire le chiamate API del gioco
 * ✅ VERSIONE SEMPLICE: SEMPRE E SOLO NUOVE PARTITE
 * 
 * NON riprendiamo MAI partite esistenti!
 * Abbandoniamo sempre tutto e creiamo nuove partite.
 */
export const useGameAPI = (gameState) => {

  // ============================================================================
  // ✅ SEMPLIFICATO: Non esiste più "checkCurrentGame"
  // ============================================================================

  // Rimosso completamente checkCurrentGame
  // Ora abbiamo solo createNewGame che fa tutto

  // ============================================================================
  // ✅ UNICA FUNZIONE: Crea sempre nuova partita
  // ============================================================================

  const createNewGame = async (gameState) => {
    try {
      gameState.setLoading(true);
      gameState.setError('');

      console.log('🆕 Creating new game (abandoning any existing)...');

      // ✅ STEP 1: SEMPRE abbandona eventuali partite esistenti
      try {
        console.log('🔍 Checking for existing games to abandon...');
        const existingGameData = await API.getCurrentGame();
        
        if (existingGameData && existingGameData.game && existingGameData.game.id) {
          console.log('🗑️ Found existing game, abandoning:', existingGameData.game.id);
          await API.abandonGame(existingGameData.game.id);
          console.log('✅ Successfully abandoned existing game');
          
          // Pausa per assicurarsi che il server abbia processato l'abbandono
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (abandonError) {
        // ✅ Se non trova partite da abbandonare (404), è NORMALE - continua
        console.log('ℹ️ No existing games to abandon (404 is normal):', abandonError.message);
      }

      // ✅ STEP 2: Ora crea la nuova partita
      console.log('🎯 Creating fresh new game...');
      const gameData = await API.createGame('university_life');
      console.log('✅ New game created successfully:', gameData);

      // Setup del nuovo gioco
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
      console.error('❌ Error creating new game:', err);

      if (err.type === 'ACTIVE_GAME_EXISTS') {
        // Se ancora fallisce per partita esistente, proviamo un ultimo tentativo più aggressivo
        console.log('🔄 Still has active game, trying more aggressive abandon...');
        
        try {
          if (err.activeGameId) {
            await API.abandonGame(err.activeGameId);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Ultimo tentativo di creazione
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
          console.error('❌ Error in aggressive abandon+retry:', retryErr);
          gameState.setError('Errore nella creazione della partita. Riprova tra qualche secondo.');
          gameState.setGameState('error');
        }
      } else {
        gameState.setError(err.message || 'Errore nella creazione della partita');
        gameState.setGameState('error');
      }
    } finally {
      gameState.setLoading(false);
    }
  };

  // ============================================================================
  // GESTIONE ROUND (RIMANE UGUALE)
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
  // GESTIONE RISULTATI (RIMANE UGUALE)
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

  // ============================================================================
  // ABBANDONO GIOCO (RIMANE UGUALE)
  // ============================================================================

  const abandonGame = async (gameState) => {
    if (!gameState.currentGame) return;

    try {
      console.log('🗑️ Abandoning current game:', gameState.currentGame.id);
      await API.abandonGame(gameState.currentGame.id);
      console.log('✅ Game abandoned successfully');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('❌ Error abandoning game:', err);
      // Non bloccare l'operazione anche se l'abbandono fallisce
    }

    gameState.cleanupGameState();
    gameState.setMessage({ type: 'info', msg: 'Partita abbandonata' });
    gameState.setGameState('abandoned');

    return true;
  };

  // ============================================================================
  // ✅ RETURN API SEMPLIFICATA
  // ============================================================================

  return {
    // ✅ RIMOSSO: checkCurrentGame, forceCreateNewGame
    // ✅ SOLO: createNewGame (che fa tutto)
    createNewGame,
    startNextRound,
    processGameResult,
    processTimeUp,
    abandonGame
  };
};