import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import UserContext from '../../context/UserContext.jsx';
import API from '../../API/API.mjs';
import { Card as CardModel } from '../../models/Card.mjs';
import CardDisplay from './CardDisplay.jsx';
import Timer from './Timer.jsx';
import RoundResult from './RoundResult.jsx';
import GameSummary from './GameSummary.jsx';
import GameStatus from './GameStatus.jsx';

// ============================================================================
// ✅ STILE OTTIMIZZATO PER 6 CARTE SENZA SCROLL + LAYOUT MIGLIORATO
// ============================================================================
const hiddenScrollbarStyles = `
  .cards-container::-webkit-scrollbar {
    display: none;
  }
  
  /* ✅ RESPONSIVE CARDS: Si adattano al numero di carte */
  .responsive-card {
    min-width: 100px;
    max-width: 180px;
    flex: 1; /* ✅ IMPORTANTE: flex uniforme per tutte le carte */
  }
  
  /* ✅ COMPATTEZZA: Riduci padding per 6+ carte */
  .compact-layout .responsive-card {
    min-width: 90px;
    max-width: 140px;
  }
  
  .compact-layout .card-body {
    padding: 0.5rem !important;
  }
  
  .compact-layout .card-header {
    padding: 0.25rem !important;
    font-size: 0.75rem !important;
  }
`;

// ============================================================================
// ✅ COMPONENTI DRAG & DROP OTTIMIZZATI CON STILE MIGLIORE
// ============================================================================
// Componente carta target draggable
function DraggableTargetCard({ card, position, isCompact }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `target-${card.id}`,
    data: { card, isTarget: true, position }
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`responsive-card ${isCompact ? 'compact-card' : ''}`}
    >
      <Card className="border-warning border-3 shadow-lg h-100">
        <Card.Header className="bg-warning text-dark text-center py-1">
          <Badge bg="dark" className={isCompact ? 'badge-sm' : ''}>
            <i className="bi bi-hand-index me-1"></i>
            Target
          </Badge>
        </Card.Header>
        <Card.Body className={`p-2 ${isCompact ? 'p-1' : ''}`}>
          <CardDisplay 
            card={card} 
            showBadLuckIndex={false}
            compact={isCompact}
          />
        </Card.Body>
        <Card.Footer className="text-center py-1">
          <small className="text-muted">
            <i className="bi bi-arrows-move"></i> Trascina
          </small>
        </Card.Footer>
      </Card>
    </div>
  );
}

// Componente carta statica (non draggable)
function StaticHandCard({ card, position, isDraggedOver, isCompact }) {
  const {
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: `static-${card.id}`,
    data: { card, isStatic: true, position }
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`responsive-card ${isCompact ? 'compact-card' : ''}`}
    >
      <Card className="border-primary h-100 shadow">
        <Card.Header className="bg-primary text-white text-center py-1">
          <small>Pos. {position + 1}</small>
        </Card.Header>
        <Card.Body className={`p-2 ${isCompact ? 'p-1' : ''}`}>
          <CardDisplay 
            card={card} 
            showBadLuckIndex={true}
            compact={isCompact}
          />
        </Card.Body>
      </Card>
    </div>
  );
}

// Componente zone invisibili per drop prima/dopo
function InvisibleDropZone({ position, label, isCompact }) {
  const {
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: position === -1 ? 'invisible-before' : 'invisible-after',
    data: { isInvisible: true, position }
  });
  
  const style = {
    ...(transform ? { transform: CSS.Transform.toString(transform) } : {}),
    transition: transition || 'all 0.2s ease',
    // ✅ FIX: Usa le stesse dimensioni delle responsive-card
    minWidth: isCompact ? '90px' : '100px',  // Same as responsive-card
    maxWidth: isCompact ? '140px' : '180px', // Same as responsive-card
    height: isCompact ? '200px' : '240px',
    border: '2px dashed #dee2e6',
    borderRadius: '8px',
    backgroundColor: 'rgba(108, 117, 125, 0.1)',
    // ✅ FIX: Usa flex: 1 come le altre carte per allineamento uniforme
    flex: '1'
  };
  
  return (
    <div ref={setNodeRef} style={style}>
      <div className="h-100 d-flex align-items-center justify-content-center">
        <div className="text-center text-muted">
          <i className="bi bi-arrow-down-up"></i>
          <br />
          <small style={{ fontSize: isCompact ? '0.6rem' : '0.75rem' }}>
            {label}
          </small>
        </div>
      </div>
    </div>
  );
}

/**
 * FullGameBoard - Gestisce partite complete per utenti autenticati con Drag & Drop
 * VERSIONE OTTIMIZZATA: Logica corretta dalla versione 1 + Layout migliorato dalla versione 2
 */
function FullGameBoard() {
   const { user, setMessage, updateCurrentGame, clearCurrentGame, isInActiveGame, setIsInActiveGame } = useContext(UserContext);
   const navigate = useNavigate();
   
   // ============================================================================
   // STATO LOCALE DEL COMPONENTE
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
   
   // Timer state
   const [timerActive, setTimerActive] = useState(false);
   const [roundStartTime, setRoundStartTime] = useState(null);
   
   // ✅ STATI PER DRAG & DROP
   const [allItems, setAllItems] = useState([]);
   const [isDragging, setIsDragging] = useState(false);
   
   // ✅ STATO PER LAYOUT COMPATTO
   const [isCompactLayout, setIsCompactLayout] = useState(false);
   
   // ✅ SENSORI PER DND-KIT
   const sensors = useSensors(
       useSensor(MouseSensor, {
           activationConstraint: {
               distance: 8,
           },
       }),
       useSensor(TouchSensor, {
           activationConstraint: {
               delay: 200,
               tolerance: 5,
           },
       }),
       useSensor(KeyboardSensor, {
           coordinateGetter: sortableKeyboardCoordinates,
       })
   );
   
   // ✅ AGGIORNA LAYOUT COMPATTO BASATO SUL NUMERO DI CARTE
   useEffect(() => {
       setIsCompactLayout(currentCards.length >= 4);
   }, [currentCards.length]);
   
   // ============================================================================
   // PROTEZIONI NAVIGAZIONE - VERSIONE MIGLIORATA CON ABANDON E RETRY
   // ============================================================================
   
   const handleProtectedNavigation = async (path) => {
       if (isInActiveGame && (gameState === 'playing' || timerActive)) {
           const confirmMessage = 'Hai una partita in corso. Vuoi abbandonarla per continuare? Tutti i progressi andranno persi.';
           const userConfirmed = window.confirm(confirmMessage);
           
           if (userConfirmed) {
               try {
                   console.log('🗑️ Auto-abandoning game before navigation to:', path);
                   
                   // ✅ ABBANDONA LA PARTITA AUTOMATICAMENTE
                   if (currentGame) {
                       await API.abandonGame(currentGame.id);
                       console.log('✅ Game auto-abandoned successfully');
                       
                       // ✅ ATTESA PER DARE TEMPO AL SERVER DI PROCESSARE
                       await new Promise(resolve => setTimeout(resolve, 500));
                   }
                   
                   // ✅ PULIZIA COMPLETA DELLO STATO
                   setIsInActiveGame(false);
                   clearCurrentGame();
                   setCurrentGame(null);
                   setCurrentCards([]);
                   setTargetCard(null);
                   setCurrentRoundCard(null);
                   setRoundResult(null);
                   setAllItems([]);
                   setAllGameCards([]);
                   setTimerActive(false);
                   setError('');
                   
                   setMessage({ type: 'info', msg: 'Partita abbandonata automaticamente' });
                   
                   // ✅ NAVIGA VERSO LA DESTINAZIONE
                   navigate(path);
                   
               } catch (err) {
                   console.error('❌ Error auto-abandoning game:', err);
                   
                   // ✅ PULIZIA FORZATA ANCHE IN CASO DI ERRORE API
                   setIsInActiveGame(false);
                   clearCurrentGame();
                   setCurrentGame(null);
                   setCurrentCards([]);
                   setTargetCard(null);
                   setCurrentRoundCard(null);
                   setRoundResult(null);
                   setAllItems([]);
                   setAllGameCards([]);
                   setTimerActive(false);
                   setError('');
                   
                   setMessage({ 
                       type: 'warning', 
                       msg: 'Partita abbandonata localmente (errore API)' 
                   });
                   
                   // ✅ NAVIGA COMUNQUE
                   navigate(path);
               }
           }
           // Se dice "Annulla", non fa nulla
       } else {
           // ✅ NESSUNA PARTITA ATTIVA - NAVIGAZIONE NORMALE
           navigate(path);
       }
   };
   
   // ============================================================================
   // INIZIALIZZAZIONE - LOGICA CORRETTA DALLA VERSIONE 1
   // ============================================================================
   
   useEffect(() => {
       checkCurrentGame();
   }, []);
   
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
                
                let allGameCardsData = [];
                
                if (gameData.allCards && gameData.allCards.length > 0) {
                    allGameCardsData = gameData.allCards;
                    console.log('📊 Using allCards from backend:', gameData.allCards);
                } else {
                    if (gameData.wonCards && gameData.wonCards.length > 0) {
                        const wonCards = gameData.wonCards;
                        const sortedByIndex = [...wonCards].sort((a, b) => a.bad_luck_index - b.bad_luck_index);
                        
                        allGameCardsData = sortedByIndex.map((card, index) => ({
                            ...card,
                            is_initial: index < 3,
                            round_number: index < 3 ? 0 : index - 2,
                            guessed_correctly: index < 3 ? null : true
                        }));
                        
                        console.log('🔄 Reconstructed allGameCards:', allGameCardsData);
                    }
                }
                
                setAllGameCards(allGameCardsData);
                
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
                
                if (gameData.game.cards_collected >= 6) {
                    setGameState('game-over');
                    return;
                } else if (gameData.game.wrong_guesses >= 3) {
                    setGameState('game-over');
                    return;
                }
                
                setGameState('playing');
                
            } catch (gameError) {
                console.log('ℹ️ No active game found');
                
                // ✅ PULIZIA STATO PER SICUREZZA
                setGameState('no-game');
                setCurrentGame(null);
                setAllGameCards([]);
                setCurrentCards([]);
                setTargetCard(null);
                setCurrentRoundCard(null);
                setRoundResult(null);
                setAllItems([]);
                setTimerActive(false);
                setIsInActiveGame(false);
                clearCurrentGame();
                
                // ✅ CREA NUOVA PARTITA DOPO PULIZIA
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
   // CREAZIONE NUOVA PARTITA - LOGICA CORRETTA DALLA VERSIONE 1
   // ============================================================================
   
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
                    // ✅ ABBANDONA LA PARTITA ESISTENTE
                    if (err.activeGameId) {
                        console.log('🗑️ Abandoning existing game:', err.activeGameId);
                        await API.abandonGame(err.activeGameId);
                        console.log('✅ Existing game abandoned');
                        
                        // ✅ ATTESA PER DARE TEMPO AL SERVER
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // ✅ RETRY CREAZIONE PARTITA
                        console.log('🔄 Retrying game creation...');
                        const retryGameData = await API.createGame('university_life');
                        console.log('✅ Game created on retry:', retryGameData);
                        
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
                        
                    } else {
                        throw new Error('No activeGameId provided');
                    }
                    
                } catch (retryErr) {
                    console.error('❌ Error in abandon+retry:', retryErr);
                    setError('Hai già una partita in corso. Completa quella prima di iniziarne una nuova.');
                    
                    // ✅ PROVA A CARICARE LA PARTITA ESISTENTE
                    setTimeout(() => {
                        checkCurrentGame();
                    }, 1000);
                }
            } else {
                setError(err.message || 'Errore nella creazione della partita');
            }
        } finally {
            setLoading(false);
        }
    };
   
   // ============================================================================
   // GESTIONE ROUND - LOGICA CORRETTA + SETUP DRAG & DROP
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
           
           // ✅ SETUP DRAG & DROP: Crea lista unificata
           const allItemsData = [
               { id: 'invisible-before', type: 'invisible', position: -1 },
               { id: `target-${roundCard.id}`, type: 'target', card: roundCard, position: 999 },
               ...currentCards.map((card, index) => ({
                   id: `static-${card.id}`, 
                   type: 'static', 
                   card, 
                   position: index
               })),
               { id: 'invisible-after', type: 'invisible', position: 1000 }
           ];
           setAllItems(allItemsData);
           
           setGameState('playing');
           setTimerActive(true);
           setRoundStartTime(Date.now());
           
       } catch (err) {
           console.error('❌ Error starting round:', err);
           
           if (err.type === 'GAME_NOT_ACTIVE') {
               setGameState('game-over');
           } else {
               setError(err.message || 'Errore nell\'avvio del round');
               setGameState('playing');
           }
       }
   };
   
   // ============================================================================
   // ✅ LOGICA DRAG & DROP CORRETTA (RIPRISTINO DALLA VERSIONE 1)
   // ============================================================================
   
   const handleDragStart = (event) => {
       const { active } = event;
       
       if (String(active.id).startsWith('target-')) {
           setIsDragging(true);
           console.log('🎯 Drag started per target card');
       }
   };
   
   const handleDragEnd = (event) => {
       const { active, over } = event;
       
       setIsDragging(false);
       
       if (!over) {
           console.log('❌ Drop su area non valida');
           return;
       }
       
       if (String(active.id).startsWith('target-')) {
           let newGamePosition;
           
           console.log('🔍 DRAG END DEBUG:');
           console.log('- Active ID:', active.id);
           console.log('- Over ID:', over.id);
           console.log('- CurrentCards length:', currentCards.length);
           
           if (over.id === 'invisible-before') {
               newGamePosition = 0;
               console.log('🎯 BEFORE ZONE → Posizione gioco: 0 (prima di tutte)');
           }
           else if (over.id === 'invisible-after') {
               newGamePosition = currentCards.length;
               console.log('🎯 AFTER ZONE → Posizione gioco:', newGamePosition, '(dopo tutte)');
           }
           else if (String(over.id).startsWith('static-')) {
               const cardId = parseInt(String(over.id).replace('static-', ''));
               const cardIndex = currentCards.findIndex(card => card.id === cardId);
               
               if (cardIndex !== -1) {
                   // ✅ RIPRISTINO LOGICA CORRETTA: DOPO la carta cliccata
                   newGamePosition = cardIndex + 1;
                   console.log('🎯 STATIC CARD', cardId, 'at index', cardIndex, '→ Posizione gioco:', newGamePosition, '(dopo questa carta)');
               } else {
                   console.log('❌ Carta static non trovata in currentCards');
                   return;
               }
           }
           else {
               console.log('❌ Drop sulla target card stessa o altro, ignorando');
               return;
           }
           
           if (newGamePosition < 0 || newGamePosition > currentCards.length) {
               console.log('❌ Posizione non valida:', newGamePosition, '(range: 0 -', currentCards.length, ')');
               return;
           }
           
           console.log('📍 FINALE: Calling handlePositionSelect con posizione:', newGamePosition);
           handlePositionSelect(newGamePosition);
       }
   };
   
   const handleDragCancel = () => {
       setIsDragging(false);
   };
   
   // ============================================================================
   // GESTIONE GUESS - LOGICA CORRETTA DALLA VERSIONE 1
   // ============================================================================
   
   const handlePositionSelect = async (position) => {
       try {
           setTimerActive(false);
           setGameState('loading');
           
           const timeElapsed = roundStartTime ? Math.floor((Date.now() - roundStartTime) / 1000) : 0;
           
           console.log('🎯 Submitting guess:', {
               gameId: currentGame.id,
               gameCardId: currentRoundCard.gameCardId,
               position,
               timeElapsed
           });
           console.log('📊 Current cards order:', currentCards.map(c => `${c.id}:${c.bad_luck_index}`));
           
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
           
       } catch (err) {
           console.error('❌ Error submitting guess:', err);
           setError('Errore nell\'invio della risposta. Riprova.');
           setGameState('playing');
           setTimerActive(true);
       }
   };
   
   // ============================================================================
   // GESTIONE TIMER - LOGICA CORRETTA DALLA VERSIONE 1
   // ============================================================================
   
   const handleTimeUp = async () => {
        if (!currentRoundCard || !timerActive || gameState !== 'playing') {
            console.log('⏰ Timer already handled, no round card, or wrong game state');
            return;
        }
        
        console.log('⏰ Time expired! Submitting timeout...');
        
        try {
            setTimerActive(false);
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
                    } else {
                        setError('Errore nella gestione del timeout. Riprova.');
                        setGameState('playing');
                        setTimerActive(true);
                    }
                } catch (reloadErr) {
                    console.error('❌ Error reloading game state:', reloadErr);
                    setError('Errore nella gestione del timeout. Riprova.');
                    setGameState('playing');
                    setTimerActive(true);
                }
            } else {
                setError('Errore nella gestione del timeout. Riprova.');
                setGameState('playing');
                setTimerActive(true);
            }
        }
    };
   
   // ============================================================================
   // NAVIGAZIONE - LOGICA CORRETTA DALLA VERSIONE 1
   // ============================================================================
   
   const handleContinueAfterResult = () => {
       if (roundResult?.gameStatus === 'playing') {
           setRoundResult(null);
           setTargetCard(null);
           setCurrentRoundCard(null);
           setAllItems([]);
           startNextRound();
       } else {
           setGameState('game-over');
       }
   };
   
   const handleNewGame = () => {
        setGameState('loading');
        setCurrentGame(null);
        setCurrentCards([]);
        setTargetCard(null);
        setCurrentRoundCard(null);
        setRoundResult(null);
        setAllItems([]);
        setAllGameCards([]);
        setTimerActive(false);
        setError('');
        clearCurrentGame();
        
        handleCreateNewGame();
    };
   
   const handleBackHome = async () => {
        await handleProtectedNavigation('/');
    };
   
   const handleViewProfile = async () => {
        await handleProtectedNavigation('/profile');
    };
   
   const handleAbandonGame = async () => {
        if (!currentGame) return;
        
        try {
            console.log('🗑️ Abandoning game:', currentGame.id);
            
            await API.abandonGame(currentGame.id);
            console.log('✅ Game abandoned successfully');
            
            // ✅ ATTESA PER DARE TEMPO AL SERVER
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (err) {
            console.error('❌ Error abandoning game:', err);
            // ✅ CONTINUA COMUNQUE CON LA PULIZIA LOCALE
        }
        
        // ✅ PULIZIA COMPLETA DELLO STATO (SEMPRE)
        setIsInActiveGame(false);
        clearCurrentGame();
        setCurrentGame(null);
        setCurrentCards([]);
        setTargetCard(null);
        setCurrentRoundCard(null);
        setRoundResult(null);
        setAllItems([]);
        setAllGameCards([]);
        setTimerActive(false);
        setError('');
        
        setMessage({ type: 'info', msg: 'Partita abbandonata' });
        
        // ✅ RITORNA ALLA HOME
        setGameState('abandoned');
        
        setTimeout(() => {
            console.log('🏠 Navigating back to home after abandon');
            navigate('/');
        }, 1500);
    };
   
   // ============================================================================
   // RENDER - LAYOUT OTTIMIZZATO DALLA VERSIONE 2
   // ============================================================================
   
   if (loading) {
       return (
           <Container className="d-flex justify-content-center align-items-center min-vh-100">
               <div className="text-center">
                   <Spinner animation="border" role="status" className="mb-3" />
                   <p className="text-muted">
                       {gameState === 'abandoned' ? 'Abbandonando partita...' : 'Caricamento partita...'}
                   </p>
               </div>
           </Container>
       );
   }
   
   if (error && gameState === 'error') {
       return (
           <Container className="d-flex justify-content-center align-items-center min-vh-100">
               <Card className="shadow-lg">
                   <Card.Body className="text-center">
                       <h3 className="text-danger mb-3">Errore</h3>
                       <p className="text-muted mb-4">{error}</p>
                       <div className="d-flex gap-2 justify-content-center">
                           <Button variant="primary" onClick={handleBackHome}>
                               Torna alla Home
                           </Button>
                           <Button variant="outline-secondary" onClick={checkCurrentGame}>
                               Ricarica
                           </Button>
                           {currentGame && (
                               <Button 
                                   variant="outline-danger" 
                                   onClick={() => {
                                       if(window.confirm('Vuoi abbandonare la partita corrente?')) {
                                           handleAbandonGame();
                                       }
                                   }}
                               >
                                   Abbandona Partita
                               </Button>
                           )}
                       </div>
                   </Card.Body>
               </Card>
           </Container>
       );
   }
   
   return (
       <Container fluid>
           {/* ✅ STILE OTTIMIZZATO */}
           <style>{hiddenScrollbarStyles}</style>
           
           <Row>
               {/* Header del gioco - LAYOUT MIGLIORATO */}
                               <Col xs={12}>
                   <Card className="mb-3 bg-dark text-white">
                       <Card.Body className="py-2">
                           <Row className="align-items-center">
                               <Col xs={12}>
                                   <div className="d-flex align-items-center justify-content-center gap-3">
                                       <div>
                                            <i className="bi bi-lightning-charge-fill me-2"></i>
                                            Partita Completa
                                        </div>
                                        <div className="vr"></div>
                                        <div>
                                            Benvenuto, {user?.username}!
                                        </div>
                                    </div>
                                </Col>
                                
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
                
                {/* Stato: Partita abbandonata */}
                {gameState === 'abandoned' && (
                    <Col xs={12}>
                        <Card className="shadow-lg border-warning">
                            <Card.Body className="text-center py-5">
                                <div className="mb-4">
                                    <i className="bi bi-check-circle-fill text-success display-4 mb-3"></i>
                                    <h3 className="text-success mb-3">Partita Abbandonata</h3>
                                    <p className="text-muted mb-4">
                                        La partita è stata abbandonata con successo. 
                                        Verrai reindirizzato alla home...
                                    </p>
                                    <Spinner animation="border" size="sm" />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                )}
                
                {/* Stato: Gioco attivo */}
                {gameState === 'playing' && currentGame && (
                    <>
                        {/* ✅ LAYOUT: Area di gioco principale in alto, Stats sotto */}
                        {!targetCard ? (
                            /* Bottone per iniziare il round */
                            <Col xs={12}>
                                <Card className="shadow-lg border-2 border-success">
                                    <Card.Body className="text-center py-5 bg-light">
                                        <div className="mb-4">
                                            <h2 className="text-success mb-3">
                                                <i className="bi bi-play-circle-fill me-2"></i>
                                                Round {currentGame.current_round}
                                            </h2>
                                            <p className="lead text-muted mb-4">
                                                Clicca per ricevere la prossima carta da posizionare
                                            </p>
                                            <Button 
                                                variant="success" 
                                                size="lg" 
                                                onClick={startNextRound}
                                                className="px-5"
                                            >
                                                <i className="bi bi-play-fill me-2"></i>
                                                Inizia Round
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ) : (
                            /* ✅ AREA DRAG & DROP OTTIMIZZATA PER 6 CARTE */
                            <Col xs={12}>
                                
                                
                                {/* ✅ LAYOUT OTTIMIZZATO PER 6 CARTE - NO SCROLL */}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onDragCancel={handleDragCancel}
                                >
                                    <SortableContext
                                        items={allItems.map(item => item.id)}
                                        strategy={horizontalListSortingStrategy}
                                    >
                                        <div 
                                            className={`cards-container d-flex gap-1 p-3 bg-light rounded ${isCompactLayout ? 'compact-layout' : ''}`}
                                            style={{
                                                overflowX: 'hidden', // ✅ NESSUN SCROLL
                                                overflowY: 'hidden',
                                                minHeight: isCompactLayout ? '220px' : '290px',
                                                justifyContent: 'center', // ✅ CENTRA LE CARTE
                                                alignItems: 'flex-start',
                                                // ✅ FIX: Assicura che tutti gli elementi abbiano lo stesso spazio
                                                display: 'flex',
                                                flexWrap: 'nowrap'
                                            }}
                                        >
                                            {allItems.map((item, visualIndex) => {
                                                return (
                                                    // ✅ FIX: Rimuovi la classe responsive-card dal wrapper
                                                    // per evitare doppio controllo flex
                                                    <React.Fragment key={item.id}>
                                                        {item.type === 'target' ? (
                                                            <div className="responsive-card">
                                                                <DraggableTargetCard 
                                                                    card={item.card} 
                                                                    position={item.position}
                                                                    isCompact={isCompactLayout}
                                                                />
                                                            </div>
                                                        ) : item.type === 'static' ? (
                                                            <div className="responsive-card">
                                                                <StaticHandCard 
                                                                    card={item.card} 
                                                                    position={item.position} 
                                                                    isDraggedOver={false}
                                                                    isCompact={isCompactLayout}
                                                                />
                                                            </div>
                                                        ) : item.type === 'invisible' ? (
                                                            // ✅ FIX: NO wrapper div con responsive-card, 
                                                            // la InvisibleDropZone gestisce il proprio flex
                                                            <InvisibleDropZone 
                                                                position={item.position} 
                                                                label={item.position === -1 ? "Prima" : "Dopo"} 
                                                                isCompact={isCompactLayout}
                                                            />
                                                        ) : null}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                                {/* Istruzioni */}
                                <Row className="mb-3 mt-4">
                                    <Col xs={12}>
                                        <Alert variant="info" className="mb-2 text-center">
                                            <i className="bi bi-info-circle-fill me-2"></i>
                                            Trascina la carta Target nella posizione corretta
                                        </Alert>
                                        <Alert variant="warning" className="mb-0 text-center">
                                            <i className="bi bi-clock me-2"></i>
                                            Posizionala in base al Bad Luck Index delle altre carte
                                        </Alert>
                                    </Col>
                                </Row>
                                {/* Info aggiuntive */}
                                <Row className="mt-3">
                                    <Col xs={12}>
                                        <Card className="bg-body-secondary">
                                            <Card.Body className="py-2">
                                                <small className="text-muted d-flex align-items-center justify-content-center">
                                                    <i className="bi bi-lightbulb me-2"></i>
                                                    {isCompactLayout ? 
                                                        "Posizioni: Prima (0) • Tra carte (1,2,3...) • Dopo tutte" :
                                                        "Posizioni valide: Prima di tutte (0) • Dopo ogni carta (1, 2, 3...) • Dopo tutte"
                                                    }
                                                </small>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                                
                            </Col>
                        )}
                        
                        {/* ✅ STATS E TIMER SOTTO - VERSIONE COMPATTA */}
                        <Col xs={12} className="mt-3">
                            <Row>
                                <Col md={8}>
                                    <Card className="h-100">
                                        <Card.Body className="py-2">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <h6 className="mb-0 d-flex align-items-center">
                                                    <i className="bi bi-info-circle me-2"></i>
                                                    Stato Partita
                                                </h6>
                                                <div className="d-flex gap-2">
                                                    <span className="badge bg-primary">
                                                        Round: {currentGame.current_round}
                                                    </span>
                                                    <span className="badge bg-success">
                                                        Carte: {currentGame.cards_collected}/6
                                                    </span>
                                                    <span className="badge bg-warning text-dark">
                                                        Errori: {currentGame.wrong_guesses}/3
                                                    </span>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                
                                <Col md={4}>
                                    {/* Timer compatto */}
                                    {targetCard && (
                                        <Card className="h-100">
                                            <Card.Body className="py-2 d-flex align-items-center justify-content-between">
                                                <h6 className="mb-0 d-flex align-items-center">
                                                    <i className="bi bi-stopwatch me-2"></i>
                                                    Timer
                                                </h6>
                                                <Timer
                                                    isActive={timerActive}
                                                    duration={30}
                                                    onTimeUp={handleTimeUp}
                                                />
                                            </Card.Body>
                                        </Card>
                                    )}
                                </Col>
                            </Row>
                            
                            {/* Bottone abbandona partita */}
                            <Row className="mt-2">
                                <Col xs={12}>
                                    {gameState === 'playing' && currentGame && (
                                        <div className="text-center">
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm"
                                                onClick={() => {
                                                    if(window.confirm('Sei sicuro di voler abbandonare la partita? Tutti i progressi andranno persi.')) {
                                                        handleAbandonGame();
                                                    }
                                                }}
                                                className="d-flex align-items-center mx-auto"
                                                title="Abbandona la partita corrente"
                                            >
                                                <i className="bi bi-flag me-2"></i>
                                                Abbandona
                                            </Button>
                                        </div>
                                    )}           
                                </Col>
                            </Row>
                        </Col>
                    </>
                )}
                
                {/* Stato: Risultato round */}
                {gameState === 'result' && roundResult && (
                    <Col xs={12}>
                        <RoundResult 
                            isCorrect={roundResult.isCorrect}
                            isTimeout={roundResult.isTimeout}
                            targetCard={targetCard}
                            correctPosition={roundResult.correctPosition}
                            guessedPosition={roundResult.guessedPosition}
                            allCards={currentCards}
                            onContinue={handleContinueAfterResult}
                            onNewGame={handleNewGame}
                            isDemo={false}
                            gameCompleted={roundResult.gameStatus !== 'playing'}
                            gameWon={roundResult.gameStatus === 'won'}
                        />
                    </Col>
                )}
                
                {/* Stato: Partita terminata */}
                {gameState === 'game-over' && currentGame && (
                    <Col xs={12}>
                        <GameSummary
                            gameWon={currentGame.cards_collected >= 6 && currentGame.wrong_guesses < 3}
                            finalCards={currentCards}
                            allGameCards={allGameCards}
                            totalRounds={currentGame.cards_collected - 3 + currentGame.wrong_guesses}
                            cardsCollected={currentGame.cards_collected}
                            wrongGuesses={currentGame.wrong_guesses}
                            onNewGame={handleNewGame}
                            onBackHome={handleBackHome}
                            isDemo={false}
                        />
                    </Col>
                )}
            </Row>
        </Container>
    );
}

export default FullGameBoard;