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
// STILE PER NASCONDERE SCROLLBAR
// ============================================================================
const hiddenScrollbarStyles = `
  .cards-container::-webkit-scrollbar {
    display: none;
  }
`;

// ============================================================================
// COMPONENTI DRAG & DROP OTTIMIZZATI
// ============================================================================

// Componente carta target draggable
function DraggableTargetCard({ card, position }) {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="text-center mb-1">
        <Badge bg="warning" className="d-flex align-items-center justify-content-center gap-1" style={{ fontSize: '10px' }}>
          <i className="bi bi-hand-index"></i>
          Target
        </Badge>
      </div>
      <div 
        className={`card shadow-sm ${isDragging ? 'border-warning border-3' : ''}`} 
        style={{ 
          cursor: 'grab', 
          height: '320px', 
          width: '160px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <CardDisplay 
            card={card} 
            showBadLuckIndex={false}
            isTarget={true}
          />
        </div>
      </div>
      <div className="text-center mt-1">
        <small className="text-muted" style={{ fontSize: '10px' }}>
          Trascina per posizionare
        </small>
      </div>
    </div>
  );
}

// Componente carta statica (non draggable)
function StaticHandCard({ card, position, isDraggedOver }) {
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
      className={`transition-all ${isDraggedOver ? 'ms-4 me-4' : ''}`}
    >
      <div className="text-center mb-1">
        <Badge bg="secondary" style={{ fontSize: '10px' }}>
          Pos. {position + 1}
        </Badge>
      </div>
      <div 
        className="card shadow-sm" 
        style={{ 
          height: '240px', 
          width: '160px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <CardDisplay 
            card={card} 
            showBadLuckIndex={true}
          />
        </div>
      </div>
      <div className="text-center mt-1">
        <small className="text-muted" style={{ fontSize: '10px' }}>
          Bad Luck: <strong>{card.bad_luck_index}</strong>
        </small>
      </div>
    </div>
  );
}

// Componente zone invisibili per drop prima/dopo
function InvisibleDropZone({ position, label }) {
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
    minWidth: '40px', 
    height: '240px',
    border: '2px dashed #dee2e6',
    borderRadius: '8px',
    backgroundColor: 'rgba(108, 117, 125, 0.1)'
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="d-flex align-items-center justify-content-center"
    >
      <div className="text-center">
        <i className="bi bi-plus-circle text-muted fs-6"></i>
        <small className="d-block text-muted fw-bold" style={{ fontSize: '8px' }}>
          {label}
        </small>
      </div>
    </div>
  );
}

/**
 * FullGameBoard - Gestisce partite complete per utenti autenticati con Drag & Drop
 */
function FullGameBoard() {
   const { user, setMessage, updateCurrentGame, clearCurrentGame } = useContext(UserContext);
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
   
   // Timer state
   const [timerActive, setTimerActive] = useState(false);
   const [roundStartTime, setRoundStartTime] = useState(null);
   
   // ✅ NUOVI STATI PER DRAG & DROP
   const [allItems, setAllItems] = useState([]);
   const [isDragging, setIsDragging] = useState(false);
   
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

   // ============================================================================
   // INIZIALIZZAZIONE
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
               setGameState('no-game');
               setCurrentGame(null);
               clearCurrentGame();
           }
           
       } catch (err) {
           console.error('❌ Error checking current game:', err);
           setError('Errore nel caricamento della partita');
           setGameState('no-game');
       } finally {
           setLoading(false);
       }
   };
   
   // ============================================================================
   // CREAZIONE NUOVA PARTITA
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
           
           setGameState('playing');
           setMessage({ type: 'success', msg: 'Nuova partita creata!' });
           
       } catch (err) {
           console.error('❌ Error creating game:', err);
           
           if (err.type === 'ACTIVE_GAME_EXISTS') {
               setError('Hai già una partita in corso. Completa quella prima di iniziarne una nuova.');
               checkCurrentGame();
           } else {
               setError(err.message || 'Errore nella creazione della partita');
           }
       } finally {
           setLoading(false);
       }
   };
   
   // ============================================================================
   // GESTIONE ROUND - Con setup drag & drop
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
   // ✅ LOGICA DRAG & DROP (IDENTICA ALLA DEMO)
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
   // GESTIONE GUESS
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
   // GESTIONE TIMER
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
   // NAVIGAZIONE
   // ============================================================================
   
   const handleContinueAfterResult = () => {
       if (roundResult?.gameStatus === 'playing') {
           setRoundResult(null);
           setTargetCard(null);
           setCurrentRoundCard(null);
           setAllItems([]); // Reset drag & drop
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
       setAllItems([]); // Reset drag & drop
       setTimerActive(false);
       setError('');
       clearCurrentGame();
       
       handleCreateNewGame();
   };
   
   const handleBackHome = () => {
       navigate('/');
   };
   
   const handleViewProfile = () => {
       navigate('/profile');
   };
   
   const handleAbandonGame = async () => {
       if (!currentGame || !window.confirm('Sei sicuro di voler abbandonare questa partita?')) {
           return;
       }
       
       try {
           await API.abandonGame(currentGame.id);
           clearCurrentGame();
           setMessage({ type: 'info', msg: 'Partita abbandonata' });
           setGameState('no-game');
       } catch (err) {
           console.error('❌ Error abandoning game:', err);
           setError('Errore nell\'abbandono della partita');
       }
   };
   
   // ============================================================================
   // RENDER
   // ============================================================================
   
   if (loading) {
       return (
           <Container className="d-flex justify-content-center align-items-center min-vh-75">
               <div className="text-center">
                   <Spinner animation="border" className="mb-3" />
                   <p>Caricamento partita...</p>
               </div>
           </Container>
       );
   }
   
   if (error) {
       return (
           <Container>
               <Alert variant="danger" className="text-center">
                   <h4>Errore</h4>
                   <p>{error}</p>
                   <div className="d-flex gap-2 justify-content-center">
                       <Button variant="primary" onClick={handleBackHome}>
                           Torna alla Home
                       </Button>
                       <Button variant="secondary" onClick={checkCurrentGame}>
                           Ricarica
                       </Button>
                   </div>
               </Alert>
           </Container>
       );
   }
   
   return (
       <DndContext
           sensors={sensors}
           collisionDetection={closestCenter}
           onDragStart={handleDragStart}
           onDragEnd={handleDragEnd}
           onDragCancel={handleDragCancel}
       >
           {/* Stile per nascondere scrollbar */}
           <style>{hiddenScrollbarStyles}</style>
           
           <Container className="py-4">
               {/* Header del gioco */}
               <Row className="mb-4">
                   <Col className="text-center">
                       <div className="d-flex justify-content-between align-items-center">
                           <Button 
                               variant="outline-secondary" 
                               onClick={handleBackHome}
                               className="d-flex align-items-center"
                           >
                               <i className="bi bi-arrow-left me-2"></i>
                               Home
                           </Button>
                           
                           <div className="text-center">
                               <h2 className="mb-1">
                                   <i className="bi bi-trophy me-2"></i>
                                   Partita Completa
                               </h2>
                               <p className="text-muted mb-0">
                                   Benvenuto, {user?.username}!
                               </p>
                           </div>
                           
                           <div className="d-flex gap-2">
                               {/* Bottone abbandona partita - solo se in gioco */}
                               {gameState === 'playing' && currentGame && (
                                   <Button 
                                       variant="outline-danger" 
                                       size="sm"
                                       onClick={handleAbandonGame}
                                       className="d-flex align-items-center"
                                   >
                                       <i className="bi bi-x-circle me-2"></i>
                                       Abbandona
                                   </Button>
                               )}
                               
                               <Button 
                                   variant="outline-primary" 
                                   onClick={handleViewProfile}
                                   className="d-flex align-items-center"
                               >
                                   <i className="bi bi-person-lines-fill me-2"></i>
                                   Profilo
                               </Button>
                           </div>
                       </div>
                   </Col>
               </Row>
               
               {/* Stato: Nessuna partita */}
               {gameState === 'no-game' && (
                   <Row className="justify-content-center">
                       <Col md={8}>
                           <Card className="text-center shadow">
                               <Card.Body className="p-5">
                                   <div className="mb-4">
                                       <i className="bi bi-controller display-1 text-primary"></i>
                                   </div>
                                   <h3 className="mb-3">Nessuna Partita Attiva</h3>
                                   <p className="text-muted mb-4">
                                       Non hai partite in corso. Creane una nuova per iniziare a giocare!
                                   </p>
                                   <Button 
                                       variant="primary" 
                                       size="lg" 
                                       onClick={handleCreateNewGame}
                                       className="d-flex align-items-center mx-auto"
                                   >
                                       <i className="bi bi-plus-circle me-2"></i>
                                       Nuova Partita
                                   </Button>
                               </Card.Body>
                           </Card>
                       </Col>
                   </Row>
               )}
               
               {/* Stato: Gioco attivo */}
               {gameState === 'playing' && currentGame && (
                   <>
                       {/* ✅ NUOVO LAYOUT: Area di gioco principale in alto, Stats sotto */}
                       {!targetCard ? (
                           /* Bottone per iniziare il round */
                           <Row className="justify-content-center mb-4">
                               <Col md={8}>
                                   <Card className="border-primary h-100 d-flex align-items-center">
                                       <Card.Body className="text-center p-4">
                                           <h4 className="mb-3">
                                               Round {currentGame.current_round}
                                           </h4>
                                           <p className="text-muted mb-4">
                                               Clicca per ricevere la prossima carta da posizionare
                                           </p>
                                           <Button 
                                               variant="primary" 
                                               size="lg" 
                                               onClick={startNextRound}
                                               className="d-flex align-items-center mx-auto"
                                           >
                                               <i className="bi bi-play-circle me-2"></i>
                                               Inizia Round
                                           </Button>
                                       </Card.Body>
                                   </Card>
                               </Col>
                           </Row>
                       ) : (
                           /* ✅ AREA DRAG & DROP PRINCIPALE - CONTAINER ALLARGATO */
                           <div className="px-3">
                               {/* Istruzioni */}
                               <div className="text-center mb-4">
                                   <h5>
                                       <i className="bi bi-cursor me-2"></i>
                                       Trascina la carta Target nella posizione corretta
                                   </h5>
                                   <small className="text-muted">
                                       Posizionala in base al Bad Luck Index delle altre carte
                                   </small>
                               </div>
                               
                               {/* Layout orizzontale con drag & drop - UNA RIGA SEMPRE ALLARGATA */}
                               <SortableContext 
                                   items={allItems.map(item => item.id)}
                                   strategy={horizontalListSortingStrategy}
                               >
                                   <div 
                                       className="d-flex align-items-start gap-3 p-5" 
                                       style={{ 
                                           minHeight: '400px',
                                           width: '100%',
                                           background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                           borderRadius: '25px',
                                           border: '3px solid #dee2e6',
                                           boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.1)',
                                           overflowX: 'hidden',
                                           overflowY: 'hidden'
                                       }}
                                   >
                                       {allItems.map((item, visualIndex) => {
                                           if (item.id === 'invisible-after' && visualIndex === allItems.length - 1) {
                                               return (
                                                   <div key={item.id} style={{ flexShrink: 0 }}>
                                                       <InvisibleDropZone 
                                                           position={item.position}
                                                           label="Ultima"
                                                       />
                                                   </div>
                                               );
                                           }
                                           
                                           return (
                                               <div key={item.id} style={{ flexShrink: 0 }}>
                                                   {item.type === 'target' ? (
                                                       <DraggableTargetCard 
                                                           card={item.card}
                                                           position={item.position}
                                                       />
                                                   ) : item.type === 'static' ? (
                                                       <StaticHandCard 
                                                           card={item.card}
                                                           position={item.position}
                                                           isDraggedOver={false}
                                                       />
                                                   ) : item.type === 'invisible' ? (
                                                       <InvisibleDropZone 
                                                           position={item.position}
                                                           label={item.position === -1 ? "Prima" : "Ultima"}
                                                       />
                                                   ) : null}
                                               </div>
                                           );
                                       })}
                                   </div>
                               </SortableContext>
                               
                               {/* Info aggiuntive */}
                               <div className="text-center mt-3">
                                   <Card className="border-info shadow-sm d-inline-block">
                                       <Card.Body className="p-2">
                                           <small className="text-muted">
                                               <i className="bi bi-lightbulb text-warning me-2"></i>
                                               <strong>Posizioni valide:</strong> Prima di tutte (0) • Dopo ogni carta (1, 2, 3...) • Dopo tutte
                                           </small>
                                       </Card.Body>
                                   </Card>
                               </div>
                           </div>
                       )}
                       
                       {/* ✅ STATS E TIMER SOTTO - VERSIONE MINIMALE */}
                       <Row className="justify-content-center mt-4">
                           <Col md={8}>
                               <Row>
                                   <Col md={6}>
                                       {/* GameStatus minimale */}
                                       <Card className="border-primary shadow-sm mb-3">
                                           <Card.Body className="p-3">
                                               <h6 className="text-primary mb-2">
                                                   <i className="bi bi-trophy me-2"></i>
                                                   Stato Partita
                                               </h6>
                                               <div className="small">
                                                   <div className="d-flex justify-content-between mb-1">
                                                       <span>Round:</span>
                                                       <strong>{currentGame.current_round}</strong>
                                                   </div>
                                                   <div className="d-flex justify-content-between mb-1">
                                                       <span>Carte:</span>
                                                       <strong>{currentGame.cards_collected}/6</strong>
                                                   </div>
                                                   <div className="d-flex justify-content-between">
                                                       <span>Errori:</span>
                                                       <strong>{currentGame.wrong_guesses}/3</strong>
                                                   </div>
                                               </div>
                                           </Card.Body>
                                       </Card>
                                   </Col>
                                   
                                   <Col md={6}>
                                       {/* Timer minimale */}
                                       {targetCard && (
                                           <Card className="border-warning shadow-sm mb-3">
                                               <Card.Body className="p-3">
                                                   <h6 className="text-warning mb-2">
                                                       <i className="bi bi-stopwatch me-2"></i>
                                                       Timer
                                                   </h6>
                                                   <Timer 
                                                       duration={30}
                                                       isActive={timerActive}
                                                       onTimeUp={handleTimeUp}
                                                   />
                                               </Card.Body>
                                           </Card>
                                       )}
                                   </Col>
                               </Row>
                           </Col>
                       </Row>
                   </>
               )}
               
               {/* Stato: Risultato round */}
               {gameState === 'result' && roundResult && (
                   <>
                       {console.log('🔧 About to render RoundResult with:', {
                           isCorrect: roundResult.isCorrect,
                           isTimeout: roundResult.isTimeout,
                           correctPosition: roundResult.correctPosition,
                           guessedPosition: roundResult.guessedPosition
                       })}
                       
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
                   </>
               )}
               
               {/* Stato: Partita terminata */}
               {gameState === 'game-over' && currentGame && (
                   <GameSummary 
                       gameWon={currentGame.cards_collected >= 6 && currentGame.wrong_guesses < 3}
                       finalCards={currentCards}
                       totalRounds={currentGame.current_round}
                       cardsCollected={currentGame.cards_collected}
                       wrongGuesses={currentGame.wrong_guesses}
                       onNewGame={handleNewGame}
                       onBackHome={handleBackHome}
                       isDemo={false}
                   />
               )}
           </Container>
       </DndContext>
   );
}

export default FullGameBoard;