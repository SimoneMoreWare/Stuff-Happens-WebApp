import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
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
import { GameLoading, GameError } from './shared/GameUI.jsx';
import Timer from './Timer.jsx';
import RoundResult from './RoundResult.jsx';

// Hooks condivisi
import { useGameTimer } from './hooks/useGameTimer.jsx';
import { useDragDrop } from './hooks/useDragDrop.jsx';

// Stili condivisi
import { gameStyles } from './shared/GameStyles.jsx';

/**
 * DemoGameBoard - Final Refactored Version
 * Gestisce la modalità demo per utenti anonimi
 * 
 * Versione finale ottimizzata: ~120 righe (da 300!)
 * Logica semplificata per demo, mantenendo solo l'essenziale
 */
function DemoGameBoard() {
    const { setMessage } = useContext(UserContext);
    const navigate = useNavigate();
    
    // ============================================================================
    // STATO LOCALE SEMPLIFICATO
    // ============================================================================
    const [gameState, setGameState] = useState('loading');
    const [currentCards, setCurrentCards] = useState([]);
    const [targetCard, setTargetCard] = useState(null);
    const [gameResult, setGameResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // ============================================================================
    // HOOKS CONDIVISI
    // ============================================================================
    
    // Timer hook
    const {
        timerActive,
        timeRemaining,
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
    // INIZIALIZZAZIONE E GAME LOGIC
    // ============================================================================
    
    useEffect(() => {
        startDemoGame();
    }, []);
    
    const startDemoGame = async () => {
        try {
            setLoading(true);
            setError('');
            
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
            setGameState('playing');
            startTimer();
            
        } catch (err) {
            console.error('Errore demo:', err);
            setError(err.message || 'Errore nel caricamento della demo');
            setGameState('finished');
        } finally {
            setLoading(false);
        }
    };
    
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
            
            // Rivela bad_luck_index SOLO se ha vinto
            const revealedCard = new CardModel(
                targetCard.id,
                targetCard.name,
                targetCard.image_url,
                result.correct ? result.targetCard.bad_luck_index : null,
                targetCard.theme
            );
            setTargetCard(revealedCard);
            
            // Se vinto, aggiorna currentCards
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
            console.error('Errore submit demo guess:', err);
            setError('Errore nell\'invio della risposta. Riprova.');
            setGameState('playing');
            startTimer();
        }
    }
    
    async function handleTimeUp() {
        if (!timerActive || gameState !== 'playing') return;
        
        console.log('⏰ Tempo scaduto in demo!');
        
        try {
            setGameState('loading');
            
            const timeElapsed = getElapsedTime();
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
                result.correct ? result.targetCard.bad_luck_index : null,
                targetCard.theme
            );
            setTargetCard(revealedCard);
            
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
            startTimer();
        }
    }
    
    // ============================================================================
    // NAVIGATION HANDLERS
    // ============================================================================
    
    const handleNewGame = () => {
        setGameState('loading');
        setCurrentCards([]);
        setTargetCard(null);
        setGameResult(null);
        setError('');
        startDemoGame();
    };
    
    const handleBackHome = () => {
        navigate('/');
    };
    
    // ============================================================================
    // RENDER
    // ============================================================================
    
    if (loading) {
        return <GameLoading gameState={gameState} />;
    }
    
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
                {/* Header del gioco */}
                {(gameState === 'playing' || gameState === 'result') && (
                    <GameHeader
                        title="Modalità Demo"
                        subtitle="Trascina la carta nella posizione corretta"
                        onBackHome={handleBackHome}
                        variant="info"
                    />
                )}
                
                {/* GAMEPLAY */}
                {gameState === 'playing' && (
                    <>
                        {/* Timer integrato nelle stats - VERSIONE CORRETTA */}
                        {targetCard && (
                        <Col xs={12} className="mt-2">
                            <div className="d-flex justify-content-center">
                            <Timer
                                timeRemaining={timeRemaining}  // ← PASSA IL VALORE DAL HOOK useGameTimer
                                duration={30}
                                isActive={timerActive}
                            />
                            </div>
                        </Col>
                        )}
                        
                        {/* Layout orizzontale con tutte le carte */}
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

                         {/* Istruzioni di gioco */}
                        <GameInstructions isDemo={true} />
                    </>
                )}
                
                {/* Risultato round */}
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