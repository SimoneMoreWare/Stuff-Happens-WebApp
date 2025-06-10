import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import UserContext from '../../../context/UserContext.jsx';
import API from '../../../API/API.mjs';
import { Card as CardModel } from '../../../models/Card.mjs';

/**
 * Hook per gestire la logica completa del gioco
 * Estrae tutta la logica di gestione stato, API calls e navigazione
 */
export const useGameManagement = () => {
  const { user, setMessage, updateCurrentGame, clearCurrentGame, isInActiveGame, setIsInActiveGame } = useContext(UserContext);
  const navigate = useNavigate();
  
  // ============================================================================
  // STATO LOCALE
  // ============================================================================
  const [gameState, setGameState] = useState('loading');
  const [currentGame, setCurrentGame] = useState(null);
  const [currentCards, setCurrentCards] = useState([]);
  const [targetCard, setTargetCard] = useState(null);
  const [currentRoundCard, setCurrentRoundCard] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allGameCards, setAllGameCards] = useState([]);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // Aggiorna layout compatto
  useEffect(() => {
    setIsCompactLayout(currentCards.length >= 4);
  }, [currentCards.length]);
  
  // Gestione protezione navigazione
  useEffect(() => {
    if (currentGame?.status === 'playing') {
      setIsInActiveGame(true);
      console.log('🔒 Game protection activated');
    } else {
      setIsInActiveGame(false);
      console.log('🔓 Game protection deactivated');
    }
  }, [currentGame, setIsInActiveGame]);
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  const cleanupGameState = () => {
    setIsInActiveGame(false);
    clearCurrentGame();
    setCurrentGame(null);
    setCurrentCards([]);
    setTargetCard(null);
    setCurrentRoundCard(null);
    setRoundResult(null);
    setAllGameCards([]);
    setError('');
  };
  
  // ============================================================================
  // NAVIGAZIONE PROTETTA
  // ============================================================================
  
  const handleProtectedNavigation = async (path) => {
    if (isInActiveGame && (gameState === 'playing')) {
      const confirmMessage = 'Hai una partita in corso. Vuoi abbandonarla per continuare? Tutti i progressi andranno persi.';
      const userConfirmed = window.confirm(confirmMessage);
      
      if (userConfirmed) {
        try {
          console.log('🗑️ Auto-abandoning game before navigation to:', path);
          
          if (currentGame) {
            await API.abandonGame(currentGame.id);
            console.log('✅ Game auto-abandoned successfully');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          cleanupGameState();
          setMessage({ type: 'info', msg: 'Partita abbandonata automaticamente' });
          navigate(path);
          
        } catch (err) {
          console.error('❌ Error auto-abandoning game:', err);
          cleanupGameState();
          setMessage({ type: 'warning', msg: 'Partita abbandonata localmente (errore API)' });
          navigate(path);
        }
      }
    } else {
      navigate(path);
    }
  };
  
  // ============================================================================
  // INIZIALIZZAZIONE E CREAZIONE GIOCO
  // ============================================================================
  
  const checkCurrentGame = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🎮 Checking for existing game...');
      
      try {
        const gameData = await API.getCurrentGame();
        console.log('📋 Found existing game:', gameData);
        
        setCurrentGame(gameData.game);
        updateCurrentGame(gameData.game);
        
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
        setAllGameCards(allGameCardsData);
        
        // Gestione carte vinte
        if (gameData.wonCards && gameData.wonCards.length > 0) {
          const wonCards = gameData.wonCards.map(c => 
            new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
          );
          wonCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
          setCurrentCards(wonCards);
        }
        
        if (gameData.game.status !== 'playing') {
          setGameState('game-over');
          return;
        }
        
        if (gameData.game.cards_collected >= 6 || gameData.game.wrong_guesses >= 3) {
          setGameState('game-over');
          return;
        }
        
        setGameState('playing');
        
      } catch (gameError) {
        console.log('ℹ️ No active game found');
        cleanupGameState();
        setGameState('no-game');
        
        setTimeout(() => {
          handleCreateNewGame();
        }, 500);
      }
      
    } catch (err) {
      console.error('❌ Error checking current game:', err);
      setError('Errore nel caricamento della partita');
      setGameState('error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateNewGame = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🆕 Creating new game...');
      
      const gameData = await API.createGame('university_life');
      console.log('✅ Game created:', gameData);
      
      setCurrentGame(gameData.game);
      updateCurrentGame(gameData.game);
      
      const initialCards = gameData.initialCards.map(c =>
        new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
      );
      initialCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
      setCurrentCards(initialCards);
      
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
      setAllGameCards(allGameCardsData);
      
      setGameState('playing');
      setMessage({ type: 'success', msg: 'Nuova partita creata!' });
      
    } catch (err) {
      console.error('❌ Error creating game:', err);
      
      if (err.type === 'ACTIVE_GAME_EXISTS') {
        console.log('🔄 Game exists, trying to abandon and retry...');
        
        try {
          if (err.activeGameId) {
            await API.abandonGame(err.activeGameId);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const retryGameData = await API.createGame('university_life');
            setCurrentGame(retryGameData.game);
            updateCurrentGame(retryGameData.game);
            
            const initialCards = retryGameData.initialCards.map(c =>
              new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
            );
            initialCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
            setCurrentCards(initialCards);
            
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
            setAllGameCards(allGameCardsData);
            
            setGameState('playing');
            setMessage({ type: 'success', msg: 'Nuova partita creata (precedente abbandonata)!' });
          }
        } catch (retryErr) {
          console.error('❌ Error in abandon+retry:', retryErr);
          setError('Hai già una partita in corso. Completa quella prima di iniziarne una nuova.');
          setTimeout(() => checkCurrentGame(), 1000);
        }
      } else {
        setError(err.message || 'Errore nella creazione della partita');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // ============================================================================
  // GESTIONE ROUND E GAME LOGIC
  // ============================================================================
  
  const startNextRound = async () => {
    try {
      setError('');
      setGameState('loading');
      
      console.log('🎯 Starting next round for game:', currentGame.id);
      
      const roundData = await API.getNextRoundCard(currentGame.id);
      console.log('🃏 Got round card:', roundData);
      
      const roundCard = {
        id: roundData.roundCard.id,
        name: roundData.roundCard.name,
        image_url: roundData.roundCard.image_url,
        theme: roundData.roundCard.theme
      };
      
      setTargetCard(roundCard);
      setCurrentRoundCard(roundData.roundCard);
      setGameState('playing');
      
      return true; // Indica successo per il timer
      
    } catch (err) {
      console.error('❌ Error starting round:', err);
      
      if (err.type === 'GAME_NOT_ACTIVE') {
        setGameState('game-over');
      } else {
        setError(err.message || 'Errore nell\'avvio del round');
        setGameState('playing');
      }
      return false;
    }
  };
  
  const processGameResult = async (position, timeElapsed) => {
    try {
      setGameState('loading');
      
      console.log('🎯 Submitting guess:', {
        gameId: currentGame.id,
        gameCardId: currentRoundCard.gameCardId,
        position,
        timeElapsed
      });
      
      const result = await API.submitGameGuess(
        currentGame.id,
        currentRoundCard.gameCardId,
        position,
        timeElapsed
      );
      
      console.log('📊 Guess result:', result);
      
      if (result.game) {
        setCurrentGame(result.game);
        updateCurrentGame(result.game);
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
        setTargetCard(revealedCardModel);
        
        if (result.correct) {
          setCurrentCards(prev => {
            const newCards = [...prev, revealedCardModel];
            newCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
            return newCards;
          });
          
          setAllGameCards(prev => [...prev, {
            id: revealedCard.id,
            name: revealedCard.name,
            image_url: revealedCard.image_url,
            bad_luck_index: revealedCard.bad_luck_index,
            theme: revealedCard.theme,
            is_initial: false,
            round_number: currentGame.current_round,
            guessed_correctly: true
          }]);
        }
      }
      
      setRoundResult({
        isCorrect: result.correct,
        correctPosition: result.correctPosition,
        guessedPosition: position,
        explanation: result.message,
        gameStatus: result.gameStatus
      });
      
      setGameState('result');
      return true;
      
    } catch (err) {
      console.error('❌ Error submitting guess:', err);
      setError('Errore nell\'invio della risposta. Riprova.');
      setGameState('playing');
      return false;
    }
  };
  
  const processTimeUp = async () => {
    if (!currentRoundCard || gameState !== 'playing') {
      console.log('⏰ Timer already handled, no round card, or wrong game state');
      return false;
    }
    
    console.log('⏰ Time expired! Submitting timeout...');
    
    try {
      setGameState('loading');
      
      const gameId = currentGame.id;
      const gameCardId = currentRoundCard.gameCardId;
      
      console.log('🎯 Sending timeout for:', { gameId, gameCardId });
      
      const result = await API.submitGameTimeout(gameId, gameCardId);
      
      console.log('📊 Timeout result:', result);
      
      if (result.game) {
        setCurrentGame(result.game);
        updateCurrentGame(result.game);
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
        setTargetCard(revealedCardModel);
      }
      
      setRoundResult({
        isCorrect: false,
        isTimeout: result.isTimeout || true,
        correctPosition: result.correctPosition,
        explanation: result.message,
        gameStatus: result.gameStatus
      });
      
      setGameState('result');
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
          
          if (gameData.game.current_round > currentGame.current_round) {
            console.log('✅ Round already advanced, continuing to next round');
            setCurrentGame(gameData.game);
            updateCurrentGame(gameData.game);
            setRoundResult(null);
            setTargetCard(null);
            setCurrentRoundCard(null);
            setGameState('playing');
            return true;
          } else {
            setError('Errore nella gestione del timeout. Riprova.');
            setGameState('playing');
            return false;
          }
        } catch (reloadErr) {
          console.error('❌ Error reloading game state:', reloadErr);
          setError('Errore nella gestione del timeout. Riprova.');
          setGameState('playing');
          return false;
        }
      } else {
        setError('Errore nella gestione del timeout. Riprova.');
        setGameState('playing');
        return false;
      }
    }
  };
  
  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================
  
  const handleContinueAfterResult = () => {
    if (roundResult?.gameStatus === 'playing') {
      setRoundResult(null);
      setTargetCard(null);
      setCurrentRoundCard(null);
      startNextRound();
    } else {
      setGameState('game-over');
    }
  };
  
  const handleNewGame = () => {
    setGameState('loading');
    cleanupGameState();
    handleCreateNewGame();
  };
  
  const handleBackHome = async () => {
    await handleProtectedNavigation('/');
  };
  
  const handleAbandonGame = async () => {
    if (!currentGame) return;
    
    try {
      console.log('🗑️ Abandoning game:', currentGame.id);
      await API.abandonGame(currentGame.id);
      console.log('✅ Game abandoned successfully');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('❌ Error abandoning game:', err);
    }
    
    cleanupGameState();
    setMessage({ type: 'info', msg: 'Partita abbandonata' });
    setGameState('abandoned');
    
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };
  
  // ============================================================================
  // RETURN API
  // ============================================================================
  
  return {
    // State
    gameState,
    currentGame,
    currentCards,
    targetCard,
    currentRoundCard,
    roundResult,
    loading,
    error,
    allGameCards,
    isCompactLayout,
    user,
    
    // Actions
    checkCurrentGame,
    handleCreateNewGame,
    startNextRound,
    processGameResult,
    processTimeUp,
    handleContinueAfterResult,
    handleNewGame,
    handleBackHome,
    handleAbandonGame,
    
    // Utils
    cleanupGameState
  };
};