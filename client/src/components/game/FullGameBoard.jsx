import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

import UserContext from '../../context/UserContext.jsx';
import API from '../../API/API.mjs';
import { Card as CardModel } from '../../models/Card.mjs';

// Componenti condivisi
import { DraggableTargetCard, StaticHandCard, InvisibleDropZone } from './dragdrop/DragDrop.jsx';
import { GameHeader } from './shared/GameHeader.jsx';
import { GameInstructions } from './shared/GameInstructions.jsx';
import Timer from './Timer.jsx';
import RoundResult from './RoundResult.jsx';
import GameSummary from './GameSummary.jsx';

// Hooks condivisi
import { useGameTimer } from './hooks/useGameTimer.jsx';
import { useDragDrop } from './hooks/useDragDrop.jsx';

// Stili condivisi
import { gameStyles } from './shared/GameStyles.jsx';

/**
 * FullGameBoard - Refactored
 * Gestisce partite complete per utenti autenticati
 * Versione ottimizzata con logica condivisa estratta
 */
function FullGameBoard() {
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
   
   // Layout compatto per 4+ carte
   const [isCompactLayout, setIsCompactLayout] = useState(false);
   
   // ============================================================================
   // HOOKS CONDIVISI
   // ============================================================================
   
   // Timer hook
   const {
       timerActive,
       startTimer,
       stopTimer,
       getElapsedTime
   } = useGameTimer(30, handleTimeUp);
   
   // Drag & Drop hook
   const {
       sensors,
       allItems,
       handleDragStart,
       handleDragEnd,
       handleDragCancel
   } = useDragDrop(currentCards, targetCard, handlePositionSelect);
   
   // ============================================================================
   // EFFECTS
   // ============================================================================
   
   // Inizializzazione
   useEffect(() => {
       checkCurrentGame();
   }, []);
   
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
   // NAVIGAZIONE PROTETTA
   // ============================================================================
   
   const handleProtectedNavigation = async (path) => {
       if (isInActiveGame && (gameState === 'playing' || timerActive)) {
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
   
   const cleanupGameState = () => {
       setIsInActiveGame(false);
       clearCurrentGame();
       setCurrentGame(null);
       setCurrentCards([]);
       setTargetCard(null);
       setCurrentRoundCard(null);
       setRoundResult(null);
       setAllGameCards([]);
       stopTimer();
       setError('');
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
   // GESTIONE ROUND
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
           
           // Avvia timer usando hook
           startTimer();
           
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
   // GAME LOGIC
   // ============================================================================
   
   async function handlePositionSelect(position) {
       try {
           stopTimer();
           setGameState('loading');
           
           const timeElapsed = getElapsedTime();
           
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
           
       } catch (err) {
           console.error('❌ Error submitting guess:', err);
           setError('Errore nell\'invio della risposta. Riprova.');
           setGameState('playing');
           startTimer();
       }
   }
   
   async function handleTimeUp() {
        if (!currentRoundCard || !timerActive || gameState !== 'playing') {
            console.log('⏰ Timer already handled, no round card, or wrong game state');
            return;
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
                        startTimer();
                    }
                } catch (reloadErr) {
                    console.error('❌ Error reloading game state:', reloadErr);
                    setError('Errore nella gestione del timeout. Riprova.');
                    setGameState('playing');
                    startTimer();
                }
            } else {
                setError('Errore nella gestione del timeout. Riprova.');
                setGameState('playing');
                startTimer();
            }
        }
    }
   
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
   
   const handleViewProfile = async () => {
        await handleProtectedNavigation('/profile');
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
   // RENDER
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
           <style>{gameStyles}</style>
           
           <Row>
               {/* Header del gioco */}
               <Col xs={12}>
                   <GameHeader
                       title="Partita Completa"
                       subtitle={`Benvenuto, ${user?.username}!`}
                       onBackHome={handleBackHome}
                       variant="dark"
                   />
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
                           /* Area Drag & Drop */
                           <Col xs={12}>
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
                                               overflowX: 'hidden',
                                               overflowY: 'hidden',
                                               minHeight: isCompactLayout ? '220px' : '290px',
                                               justifyContent: 'center',
                                               alignItems: 'flex-start',
                                               display: 'flex',
                                               flexWrap: 'nowrap'
                                           }}
                                       >
                                           {allItems.map((item) => (
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
                                                       <InvisibleDropZone 
                                                           position={item.position} 
                                                           label={item.position === -1 ? "Prima" : "Dopo"} 
                                                           isCompact={isCompactLayout}
                                                       />
                                                   ) : null}
                                               </React.Fragment>
                                           ))}
                                       </div>
                                   </SortableContext>
                               </DndContext>
                               
                               {/* Istruzioni di gioco */}
                               <GameInstructions isCompact={isCompactLayout} />
                               
                           </Col>
                       )}
                       
                       {/* Stats e Timer */}
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