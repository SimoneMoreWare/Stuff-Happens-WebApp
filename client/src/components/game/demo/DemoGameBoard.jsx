// DemoGameBoard.jsx - Demo game mode for anonymous users
import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

// Context and API
import UserContext from '../../../context/UserContext.jsx';
import API from '../../../API/API.mjs';
import { Card as CardModel } from '../../../models/Card.mjs';

// Shared components
import { DraggableTargetCard, StaticHandCard, InvisibleDropZone } from '../dragdrop/DragDrop.jsx';
import { GameHeader } from '../shared/GameHeader.jsx';
import { GameInstructions } from '../shared/GameInstructions.jsx';
import { GameLoading, GameError } from '../shared/GameUI.jsx';
import Timer from '../shared/Timer.jsx';
import RoundResult from '../shared/RoundResult.jsx';

// Shared hooks
import { useGameTimer } from '../hooks/useGameTimer.jsx';
import { useDragDrop } from '../hooks/useDragDrop.jsx';

// Shared styles
import { gameStyles } from '../shared/GameStyles.jsx';

/**
 * DemoGameBoard - Demo game mode component
 * 
 * Provides a single-round demo game for anonymous users to try the game
 * without registration. Includes drag & drop functionality, timer, and
 * result display. Simplified version of the full game experience.
 */
function DemoGameBoard() {
    const { setMessage } = useContext(UserContext);
    const navigate = useNavigate();
    
    // ============================================================================
    // LOCAL STATE MANAGEMENT
    // ============================================================================
    
    const [gameState, setGameState] = useState('loading');
    const [currentCards, setCurrentCards] = useState([]);
    const [targetCard, setTargetCard] = useState(null);
    const [gameResult, setGameResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // ============================================================================
    // SHARED HOOKS INTEGRATION
    // ============================================================================
    
    // Timer functionality
    const {
        timerActive,
        timeRemaining,
        startTimer,
        stopTimer,
        getElapsedTime,
        isTimeUp
    } = useGameTimer(30, null);
    
    // Drag & drop functionality
    const {
        sensors,
        allItems,
        handleDragStart,
        handleDragEnd,
        handleDragCancel
    } = useDragDrop(currentCards, targetCard, handlePositionSelect);
    
    // ============================================================================
    // GAME INITIALIZATION AND LOGIC
    // ============================================================================
    
    // Initialize demo game on component mount
    useEffect(() => {
        startDemoGame();
    }, []);

    // Handle timer timeout
    useEffect(() => {
        const handleTimeout = async () => {
            if (isTimeUp && gameState === 'playing' && !loading) {
                try {
                    setGameState('loading');
                    
                    const timeElapsed = getElapsedTime();
                    const result = await API.submitDemoGuess(
                        targetCard.id,
                        currentCards.map(c => c.id),
                        0,
                        Math.max(timeElapsed, 31)
                    );
                    
                    // Reveal card with timeout result
                    const revealedCard = new CardModel(
                        targetCard.id,
                        targetCard.name,
                        targetCard.image_url,
                        result.correct ? result.targetCard.bad_luck_index : null,
                        targetCard.theme
                    );
                    setTargetCard(revealedCard);
                    
                    setGameResult({
                        isCorrect: result.correct,
                        isTimeout: result.timeUp || true,
                        correctPosition: result.correctPosition,
                        guessedPosition: undefined,
                        explanation: result.message
                    });
                    setGameState('result');
                    
                } catch (err) {
                    setError('Errore nella gestione del timeout. Riprova.');
                    setGameState('playing');
                    startTimer();
                }
            }
        };
        handleTimeout();
    }, [isTimeUp, gameState, loading]);
    
    /**
     * Initialize demo game session
     * Loads initial cards and target card from server
     */
    const startDemoGame = async () => {
        try {
            setLoading(true);
            setError('');
            
            const demoData = await API.startDemoGame();
            
            // Create initial cards with bad luck index visible
            const initialCards = demoData.initialCards.map(c => 
                new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
            );
            
            // Create target card without bad luck index (hidden from player)
            const target = new CardModel(
                demoData.targetCard.id, 
                demoData.targetCard.name, 
                demoData.targetCard.image_url, 
                null, // Hidden bad luck index
                demoData.targetCard.theme
            );
            
            setCurrentCards(initialCards);
            setTargetCard(target);
            setGameState('playing');
            startTimer();
            
        } catch (err) {
            setError(err.message || 'Errore nel caricamento della demo');
            setGameState('finished');
        } finally {
            setLoading(false);
        }
    };
    
    /**
     * Handle player's position selection
     * Processes the guess and shows result
     * 
     * @param {number} position - Selected position for target card
     */
    async function handlePositionSelect(position) {
        try {
            stopTimer();
            setGameState('loading');
            
            const timeElapsed = getElapsedTime();
            const result = await API.submitDemoGuess(
                targetCard.id,
                currentCards.map(c => c.id),
                position,
                timeElapsed
            );
            
            // Reveal bad luck index only if guess was correct
            const revealedCard = new CardModel(
                targetCard.id,
                targetCard.name,
                targetCard.image_url,
                result.correct ? result.targetCard.bad_luck_index : null,
                targetCard.theme
            );
            setTargetCard(revealedCard);
            
            // Add card to collection if guess was correct
            if (result.correct && result.targetCard.bad_luck_index) {
                const wonCard = new CardModel(
                    targetCard.id,
                    targetCard.name,
                    targetCard.image_url,
                    result.targetCard.bad_luck_index,
                    targetCard.theme
                );
                
                setCurrentCards(prev => {
                    const newCards = [...prev, wonCard];
                    newCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
                    return newCards;
                });
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
            setError('Errore nell\'invio della risposta. Riprova.');
            setGameState('playing');
            startTimer();
        }
    }
    
    // ============================================================================
    // NAVIGATION HANDLERS
    // ============================================================================
    
    /**
     * Start a new demo game
     * Resets state and initializes new game session
     */
    const handleNewGame = async () => {
        setGameState('loading');
        setCurrentCards([]);
        setTargetCard(null);
        setGameResult(null);
        setError('');
        await startDemoGame();
    };
    
    /**
     * Navigate back to home page
     */
    const handleBackHome = () => {
        navigate('/');
    };
    
    // ============================================================================
    // RENDER LOGIC
    // ============================================================================
    
    // Loading state
    if (loading) {
        return <GameLoading gameState={gameState} />;
    }
    
    // Error state
    if (error) {
        return (
            <GameError 
                error={error}
                onBackHome={handleBackHome}
                onReload={handleNewGame}
                currentGame={null}
                onAbandonGame={null}
            />
        );
    }
    
    // Main game interface
    return (
        <Container className="py-4">
            <style>{gameStyles}</style>
            
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                {/* Game header */}
                {(gameState === 'playing' || gameState === 'result') && (
                    <GameHeader
                        title="Modalità Demo"
                        subtitle="Trascina la carta nella posizione corretta"
                        onBackHome={handleBackHome}
                        variant="info"
                    />
                )}
                
                {/* Playing state */}
                {gameState === 'playing' && (
                    <>
                        {/* Timer display */}
                        {targetCard && (
                            <Col xs={12} className="mt-2">
                                <div className="d-flex justify-content-center">
                                    <Timer
                                        timeRemaining={timeRemaining}
                                        duration={30}
                                        isActive={timerActive}
                                    />
                                </div>
                            </Col>
                        )}
                        
                        {/* Horizontal card layout with drag & drop */}
                        <Row className="justify-content-center mt-4">
                            <Col md={12}>
                                <SortableContext 
                                    items={allItems.map(item => item.id)}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    <div className="d-flex justify-content-center align-items-start gap-2">
                                        {allItems.map((item) => (
                                            <React.Fragment key={item.id}>
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
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </SortableContext>
                            </Col>
                        </Row>
                        
                        {/* Game instructions */}
                        <GameInstructions isDemo={true} />
                    </>
                )}
                
                {/* Round result display */}
                {gameState === 'result' && gameResult && (
                    <RoundResult 
                        isCorrect={gameResult.isCorrect}
                        isTimeout={gameResult.isTimeout}
                        targetCard={targetCard}
                        correctPosition={gameResult.correctPosition}
                        guessedPosition={gameResult.guessedPosition}
                        allCards={currentCards}
                        onContinue={handleNewGame}
                        onNewGame={handleNewGame}
                        onBackHome={handleBackHome}
                        isDemo={true}
                        gameCompleted={true}
                        gameWon={gameResult.isCorrect}
                        showSummaryOption={false}
                    />
                )}
                
            </DndContext>
        </Container>
    );
}

export default DemoGameBoard;