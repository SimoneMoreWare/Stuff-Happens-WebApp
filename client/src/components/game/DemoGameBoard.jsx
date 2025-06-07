import React, { useState, useEffect, useContext, useRef } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
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

// ============================================================================
// COMPONENTE CARTA TARGET DRAGGABLE
// ============================================================================
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
      <div className="text-center mb-2">
        <Badge bg="primary" className="d-flex align-items-center justify-content-center gap-1">
          <i className="bi bi-hand-index"></i>
          Target
        </Badge>
      </div>
      <div className={`card shadow-sm ${isDragging ? 'border-primary border-3' : ''}`} 
           style={{ cursor: 'grab', minHeight: '200px', width: '150px' }}>
        <CardDisplay 
          card={card} 
          showBadLuckIndex={false}
          isTarget={true}
        />
      </div>
      <div className="text-center mt-2">
        <small className="text-muted">
          Trascina per posizionare
        </small>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE CARTA STATICA (NON DRAGGABLE)
// ============================================================================
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
      <div className="text-center mb-2">
        <Badge bg="secondary">
          Pos. {position + 1}
        </Badge>
      </div>
      <div className="card shadow-sm" style={{ minHeight: '200px', width: '150px' }}>
        <CardDisplay 
          card={card} 
          showBadLuckIndex={true}
        />
      </div>
      <div className="text-center mt-2">
        <small className="text-muted">
          Bad Luck: <strong>{card.bad_luck_index}</strong>
        </small>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE ZONA INVISIBILE PER DROP PRIMA/DOPO (MIGLIORATA)
// ============================================================================
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
    minWidth: '50px', 
    minHeight: '200px',
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
        <i className="bi bi-plus-circle text-muted fs-4"></i>
        <small className="d-block text-muted fw-bold" style={{ fontSize: '10px' }}>
          {label}
        </small>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================
function DemoGameBoard() {
    const { setMessage } = useContext(UserContext);
    const navigate = useNavigate();
    
    // Stati esistenti
    const [gameState, setGameState] = useState('loading');
    const [currentCards, setCurrentCards] = useState([]);
    const [targetCard, setTargetCard] = useState(null);
    const [gameResult, setGameResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [finalCards, setFinalCards] = useState([]);
    const [gameStats, setGameStats] = useState({
        totalRounds: 1,
        cardsCollected: 0,
        wrongGuesses: 0
    });
    
    // Timer state
    const [timerActive, setTimerActive] = useState(false);
    const [gameStartTime, setGameStartTime] = useState(null);
    const timeoutHandledRef = useRef(false);
    
    // ✅ NUOVI STATI PER DRAG & DROP
    const [allItems, setAllItems] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    
    // ✅ SENSORI PER DND-KIT
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8, // Previene attivazione accidentale
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
    // LOGICA ESISTENTE (invariata)
    // ============================================================================
    useEffect(() => {
        startDemoGame();
    }, []);
    
    const startDemoGame = async () => {
        try {
            setLoading(true);
            setError('');
            timeoutHandledRef.current = false;
            
            setFinalCards([]);
            setGameStats({
                totalRounds: 1,
                cardsCollected: 0,
                wrongGuesses: 0
            });
            
            console.log('🎮 Avviando partita demo...');
            
            const demoData = await API.startDemoGame();
            
            const initialCards = demoData.initialCards.map(c => 
                new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
            );
            const target = new CardModel(
                demoData.targetCard.id, 
                demoData.targetCard.name, 
                demoData.targetCard.image_url, 
                null,
                demoData.targetCard.theme
            );
            
            setCurrentCards(initialCards);
            setTargetCard(target);
            
            // ✅ Crea lista unificata per sortable con zone invisibili
            const allItemsData = [
                { id: 'invisible-before', type: 'invisible', position: -1 }, // Prima di tutto
                { id: `target-${target.id}`, type: 'target', card: target, position: 999 }, // Posizione temporanea
                ...initialCards.map((card, index) => ({
                    id: `static-${card.id}`, 
                    type: 'static', 
                    card, 
                    position: index // Posizione reale del gioco (0-based)
                })),
                { id: 'invisible-after', type: 'invisible', position: 1000 } // Dopo tutto
            ];
            setAllItems(allItemsData);
            
            setGameState('playing');
            setTimerActive(true);
            setGameStartTime(Date.now());
            
        } catch (err) {
            console.error('Errore demo:', err);
            setError(err.message || 'Errore nel caricamento della demo');
            setGameState('finished');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================================
    // ✅ NUOVA LOGICA DRAG & DROP (SORTABLE)
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
        
        // Solo se è la target card che viene droppata
        if (String(active.id).startsWith('target-')) {
            let newGamePosition; // Posizione nel gioco (0-based)
            
            console.log('🔍 DRAG END DEBUG:');
            console.log('- Active ID:', active.id);
            console.log('- Over ID:', over.id);
            console.log('- CurrentCards length:', currentCards.length);
            
            // Se droppata su zona invisibile "before" = posizione 0 (prima di tutte)
            if (over.id === 'invisible-before') {
                newGamePosition = 0;
                console.log('🎯 BEFORE ZONE → Posizione gioco: 0 (prima di tutte)');
            }
            // Se droppata su zona invisibile "after" = ultima posizione (dopo tutte)
            else if (over.id === 'invisible-after') {
                newGamePosition = currentCards.length;
                console.log('🎯 AFTER ZONE → Posizione gioco:', newGamePosition, '(dopo tutte)');
            }
            // Se droppata su una carta statica - CAMBIATA LOGICA
            else if (String(over.id).startsWith('static-')) {
                // Trova l'indice della carta statica nella lista currentCards
                const cardId = parseInt(String(over.id).replace('static-', ''));
                const cardIndex = currentCards.findIndex(card => card.id === cardId);
                
                if (cardIndex !== -1) {
                    // Se droppo su una carta, voglio andare DOPO quella carta
                    // ossia nella posizione successiva
                    newGamePosition = cardIndex + 1;
                    console.log('🎯 STATIC CARD', cardId, 'at index', cardIndex, '→ Posizione gioco:', newGamePosition, '(dopo questa carta)');
                } else {
                    console.log('❌ Carta static non trovata in currentCards');
                    return;
                }
            }
            // Se droppata su se stessa, ignora
            else {
                console.log('❌ Drop sulla target card stessa o altro, ignorando');
                return;
            }
            
            // Valida che la posizione sia corretta
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
    // RESTO DELLA LOGICA ESISTENTE
    // ============================================================================
    
    const handlePositionSelect = async (position) => {
        try {
            setTimerActive(false);
            setGameState('loading');
            
            const timeElapsed = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
            
            console.log('🎯 Demo position selected:', position);
            console.log('📊 Current cards order:', currentCards.map(c => `${c.id}:${c.bad_luck_index}`));
            console.log('⏰ Time elapsed:', timeElapsed);
            
            const result = await API.submitDemoGuess(
                targetCard.id,
                currentCards.map(c => c.id),
                position,
                timeElapsed
            );
            
            console.log('📊 Demo API Response:', result);
            
            const revealedCard = new CardModel(
                targetCard.id,
                targetCard.name,
                targetCard.image_url,
                result.targetCard.bad_luck_index,
                targetCard.theme
            );
            setTargetCard(revealedCard);
            
            const isCorrect = result.correct;
            const newStats = {
                totalRounds: 1,
                cardsCollected: isCorrect ? 1 : 0,
                wrongGuesses: isCorrect ? 0 : 1
            };
            setGameStats(newStats);
            
            if (isCorrect) {
                setFinalCards([revealedCard]);
            } else {
                setFinalCards([]);
            }
            
            setGameResult({
                isCorrect: result.correct,
                isTimeout: result.timeUp,
                correctPosition: result.correctPosition,
                guessedPosition: result.timeUp ? undefined : position,
                explanation: result.message
            });
            setGameState('result');
            
        } catch (err) {
            console.error('Errore submit demo guess:', err);
            setError('Errore nell\'invio della risposta. Riprova.');
            setGameState('playing');
            setTimerActive(true);
        }
    };
    
    const handleTimeUp = async () => {
        if (timeoutHandledRef.current || !timerActive || gameState !== 'playing') {
            console.log('⏰ Timer already handled or game not active');
            return;
        }
        
        timeoutHandledRef.current = true;
        console.log('⏰ Tempo scaduto in demo!');
        
        try {
            setTimerActive(false);
            setGameState('loading');
            
            const timeElapsed = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
            
            const result = await API.submitDemoGuess(
                targetCard.id,
                currentCards.map(c => c.id),
                0,
                Math.max(timeElapsed, 31)
            );
            
            const revealedCard = new CardModel(
                targetCard.id,
                targetCard.name,
                targetCard.image_url,
                result.targetCard.bad_luck_index,
                targetCard.theme
            );
            setTargetCard(revealedCard);
            
            setGameStats({
                totalRounds: 1,
                cardsCollected: 0,
                wrongGuesses: 1
            });
            setFinalCards([]);
            
            setGameResult({
                isCorrect: result.correct,
                isTimeout: result.timeUp,
                correctPosition: result.correctPosition,
                guessedPosition: undefined,
                explanation: result.message
            });
            setGameState('result');
            
        } catch (err) {
            console.error('Errore demo timeout:', err);
            setError('Errore nella gestione del timeout. Riprova.');
            setGameState('playing');
            setTimerActive(true);
            timeoutHandledRef.current = false;
        }
    };
    
    // Altre funzioni esistenti...
    const handleShowSummary = () => {
        console.log('🏁 Mostrando riepilogo demo con carte:', finalCards.length);
        setGameState('summary');
    };
    
    const handleNewGameFromSummary = () => {
        setGameState('loading');
        setCurrentCards([]);
        setTargetCard(null);
        setGameResult(null);
        setFinalCards([]);
        setTimerActive(false);
        setError('');
        timeoutHandledRef.current = false;
        
        startDemoGame();
    };
    
    const handleBackHomeFromSummary = () => {
        navigate('/');
    };
    
    const handleNewGame = () => {
        handleNewGameFromSummary();
    };
    
    const handleBackHome = () => {
        navigate('/');
    };

    // ============================================================================
    // RENDER
    // ============================================================================
    
    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center min-vh-75">
                <div className="text-center">
                    <Spinner animation="border" className="mb-3" />
                    <p>Caricamento demo...</p>
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
                        <Button variant="secondary" onClick={handleNewGame}>
                            Riprova Demo
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
            <Container className="py-4">
                {/* Header del gioco */}
                {(gameState === 'playing' || gameState === 'result') && (
                    <Row className="mb-4">
                        <Col className="text-center">
                            <div className="d-flex justify-content-between align-items-center">
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={handleBackHome}
                                    className="d-flex align-items-center"
                                >
                                    <i className="bi bi-arrow-left me-2"></i>
                                    Torna alla Home
                                </Button>
                                
                                <div className="text-center">
                                    <h2 className="mb-1">
                                        <i className="bi bi-controller me-2"></i>
                                        Modalità Demo
                                    </h2>
                                    <p className="text-muted mb-0">
                                        Trascina la carta nella posizione corretta
                                    </p>
                                </div>
                                
                                <div style={{ width: '120px' }}></div>
                            </div>
                        </Col>
                    </Row>
                )}
                
                {/* ✅ NUOVO LAYOUT ORIZZONTALE UNICO */}
                {gameState === 'playing' && (
                    <>
                        {/* Timer */}
                        <Row className="mb-4">
                            <Col md={6} className="mx-auto">
                                <Timer 
                                    duration={30}
                                    isActive={timerActive}
                                    onTimeUp={handleTimeUp}
                                />
                            </Col>
                        </Row>
                        
                        {/* Istruzioni */}
                        <Row className="mb-4">
                            <Col className="text-center">
                                <h5>
                                    <i className="bi bi-cursor me-2"></i>
                                    Trascina la carta Target nella posizione corretta
                                </h5>
                                <small className="text-muted">
                                    Posizionala in base al Bad Luck Index delle altre carte
                                </small>
                            </Col>
                        </Row>
                        
                        {/* Layout orizzontale con tutte le carte */}
                        <Row className="justify-content-center">
                            <Col md={12}>
                                <SortableContext 
                                    items={allItems.map(item => item.id)}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    <div className="d-flex justify-content-center align-items-start gap-2">
                                        {allItems.map((item, visualIndex) => {
                                            // Non renderizzare la zona "after" se è subito dopo l'ultima carta
                                            // Per evitare confusione tra "drop su ultima carta" e "drop su zona after"
                                            if (item.id === 'invisible-after' && visualIndex === allItems.length - 1) {
                                                return (
                                                    <div key={item.id}>
                                                        <InvisibleDropZone 
                                                            position={item.position}
                                                            label="Ultima"
                                                        />
                                                    </div>
                                                );
                                            }
                                            
                                            return (
                                                <div key={item.id}>
                                                    {item.type === 'target' ? (
                                                        <DraggableTargetCard 
                                                            card={item.card}
                                                            position={item.position}
                                                        />
                                                    ) : item.type === 'static' ? (
                                                        <StaticHandCard 
                                                            card={item.card}
                                                            position={item.position} // Usa posizione reale
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
                            </Col>
                        </Row>
                        
                        {/* Info aggiuntive */}
                        <Row className="mt-4">
                            <Col md={10} className="mx-auto">
                                <Card className="border-info shadow-sm">
                                    <Card.Body className="p-3 text-center">
                                        <small className="text-muted">
                                            <i className="bi bi-lightbulb text-warning me-2"></i>
                                            <strong>Posizioni valide:</strong> Prima di tutte (0) • Dopo 1ª carta (1) • Dopo 2ª carta (2) • Dopo 3ª carta (3)
                                        </small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}
                
                {/* Stati result e summary rimangono invariati */}
                {gameState === 'result' && gameResult && (
                    <RoundResult 
                        isCorrect={gameResult.isCorrect}
                        isTimeout={gameResult.isTimeout}
                        targetCard={targetCard}
                        correctPosition={gameResult.correctPosition}
                        guessedPosition={gameResult.guessedPosition}
                        allCards={currentCards}
                        onContinue={handleShowSummary}
                        onNewGame={handleNewGame}
                        isDemo={true}
                        gameCompleted={true}
                        gameWon={gameResult.isCorrect}
                    />
                )}
                
                {gameState === 'summary' && (
                    <GameSummary 
                        gameWon={gameStats.cardsCollected > 0}
                        finalCards={finalCards}
                        allInvolvedCards={[...currentCards, ...(gameResult?.isCorrect && targetCard ? [targetCard] : [])]}
                        totalRounds={gameStats.totalRounds}
                        cardsCollected={gameStats.cardsCollected}
                        wrongGuesses={gameStats.wrongGuesses}
                        onNewGame={handleNewGameFromSummary}
                        onBackHome={handleBackHomeFromSummary}
                        isDemo={true}
                    />
                )}
            </Container>
            
            {/* ✅ DRAG OVERLAY RIMOSSO - usaDragOverlay={false} */}
        </DndContext>
    );
}

export default DemoGameBoard;