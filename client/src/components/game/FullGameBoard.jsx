import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

// Componenti condivisi
import { DraggableTargetCard, StaticHandCard, InvisibleDropZone } from './dragdrop/DragDrop.jsx';
import { GameHeader } from './shared/GameHeader.jsx';
import { GameInstructions } from './shared/GameInstructions.jsx';
import { 
  GameLoading, 
  GameError, 
  GameAbandoned, 
  RoundStartButton, 
  GameStats, 
  AbandonGameButton 
} from './shared/GameUI.jsx';
import Timer from './Timer.jsx';
import RoundResult from './RoundResult.jsx';
import GameSummary from './GameSummary.jsx';

// Hooks condivisi
import { useGameTimer } from './hooks/useGameTimer.jsx';
import { useDragDrop } from './hooks/useDragDrop.jsx';
import { useGameManagement } from './hooks/useGameManagement.jsx';

// Stili condivisi
import { gameStyles } from './shared/GameStyles.jsx';

/**
 * FullGameBoard - Final Refactored Version
 * Gestisce partite complete per utenti autenticati
 * 
 * Versione finale ottimizzata: ~180 righe (da 851!)
 * Tutta la logica complessa è stata estratta in hooks e componenti
 */
function FullGameBoard() {
  // ============================================================================
  // HOOKS PRINCIPALI
  // ============================================================================
  
  // Hook per gestione completa del gioco (stato, API, navigazione)
  const {
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
    checkCurrentGame,
    startNextRound,
    processGameResult,
    processTimeUp,
    handleContinueAfterResult,
    handleNewGame,
    handleBackHome,
    handleAbandonGame
  } = useGameManagement();
  
  // Hook per timer
  const {
    timerActive,
    startTimer,
    stopTimer,
    getElapsedTime
  } = useGameTimer(30, handleTimeUp);
  
  // Hook per drag & drop
  const {
    sensors,
    allItems,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  } = useDragDrop(currentCards, targetCard, handlePositionSelect);
  
  // ============================================================================
  // EFFECTS E HANDLERS
  // ============================================================================
  
  // Inizializzazione
  useEffect(() => {
    checkCurrentGame();
  }, []);
  
  // Handler per selezione posizione
  async function handlePositionSelect(position) {
    stopTimer();
    const timeElapsed = getElapsedTime();
    await processGameResult(position, timeElapsed);
  }
  
  // Handler per timeout
  async function handleTimeUp() {
    if (!timerActive || gameState !== 'playing') return;
    await processTimeUp();
  }
  
  // Handler per avvio round che avvia anche il timer
  const handleStartRound = async () => {
    const success = await startNextRound();
    if (success) {
      startTimer();
    }
  };
  
  // ============================================================================
  // RENDER CONDIZIONALE DEGLI STATI
  // ============================================================================
  
  // Loading state
  if (loading) {
    return <GameLoading gameState={gameState} />;
  }
  
  // Error state
  if (error && gameState === 'error') {
    return (
      <GameError 
        error={error}
        onBackHome={handleBackHome}
        onReload={checkCurrentGame}
        currentGame={currentGame}
        onAbandonGame={handleAbandonGame}
      />
    );
  }
  
  // ============================================================================
  // RENDER PRINCIPALE
  // ============================================================================
  
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
        {/* Timer integrato nelle stats */}
            {targetCard && (
              <Col xs={12} className="mt-2">
                <div className="d-flex justify-content-center">
                  <Timer
                    isActive={timerActive}
                    duration={30}
                    onTimeUp={handleTimeUp}
                  />
                </div>
              </Col>
            )}
        {/* Stato: Partita abbandonata */}
        {gameState === 'abandoned' && <GameAbandoned />}
        
        {/* Stato: Gioco attivo */}
        {gameState === 'playing' && currentGame && (
          <>
            {!targetCard ? (
              /* Bottone per iniziare il round */
              <RoundStartButton 
                currentGame={currentGame}
                onStartRound={handleStartRound}
              />
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
            <GameStats currentGame={currentGame} targetCard={targetCard} />
            
            
            
            {/* Bottone abbandona partita */}
            <AbandonGameButton 
              gameState={gameState}
              currentGame={currentGame}
              onAbandonGame={handleAbandonGame}
            />
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