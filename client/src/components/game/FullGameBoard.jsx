import React, { useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
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
 * FullGameBoard - VERSIONE CORRETTA CON TIMER FUNZIONANTE
 */
function FullGameBoard() {
  // ============================================================================
  // STATO SEMPLICE
  // ============================================================================
  
  const [gameInitialized, setGameInitialized] = useState(false);
  
  // ============================================================================
  // HOOKS PRINCIPALI
  // ============================================================================
  
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
    handleCreateNewGame,
    startNextRound,
    processGameResult,
    processTimeUp,
    handleContinueAfterResult,  // ← USA QUESTA DAL HOOK
    handleNewGame,
    handleBackHome,
    handleAbandonGame
  } = useGameManagement();
  
  // Hook per timer
  const {
    timerActive,
    timeRemaining,
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
  // EVENT HANDLERS
  // ============================================================================
  
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
    console.log('🎮 BEFORE startNextRound');
    const success = await startNextRound();
    console.log('🎮 AFTER startNextRound, success:', success);
    if (success) {
      console.log('🎮 CALLING startTimer...');
      startTimer();
      console.log('🎮 startTimer CALLED');
    }
  };

  // ✅ CUSTOM HANDLER che chiama il timer + quello del hook
  const handleContinueWithTimer = async () => {
    if (roundResult?.gameStatus === 'playing') {
      console.log('🎮 Continue with timer - starting next round...');
      
      // Avvia il prossimo round
      const success = await startNextRound();
      
      // IMPORTANTE: Avvia il timer
      if (success) {
        console.log('🎮 CALLING startTimer from continue...');
        startTimer();
        console.log('🎮 startTimer CALLED from continue');
      }
    } else {
      // Usa la funzione originale del hook per il game-over
      await handleContinueAfterResult();
    }
  };
  
  // EVENT HANDLER: Inizializza gioco (SEMPRE nuova partita)
  const handleInitializeGame = async () => {
    setGameInitialized(true);
    await handleCreateNewGame();
  };
  
  // ============================================================================
  // RENDER SCHERMATA INIZIALE
  // ============================================================================
  
  // Se il gioco non è ancora stato inizializzato, mostra solo un pulsante
  if (!gameInitialized) {
    return (
      <Container fluid>
        <style>{gameStyles}</style>
        
        <Row className="justify-content-center">
          <Col xs={12}>
            <GameHeader
              title="Stuff Happens - Partita Completa"
              subtitle={`Benvenuto, ${user?.username}!`}
              onBackHome={handleBackHome}
              variant="dark"
            />
          </Col>
          
          <Col md={8} lg={6} className="mt-4">
            <div className="text-center p-4 bg-light rounded shadow">
              <h4 className="text-primary mb-3">
                <i className="bi bi-plus-circle-fill me-2"></i>
                Pronto per una nuova partita?
              </h4>
              <p className="text-muted mb-4">
                Clicca il pulsante per iniziare una nuova partita completa. 
                Eventuali partite precedenti verranno automaticamente abbandonate.
              </p>
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleInitializeGame}
                  className="d-flex align-items-center justify-content-center"
                >
                  <i className="bi bi-rocket-takeoff me-2"></i>
                  Inizia Nuova Partita
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={handleBackHome}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Torna alla Home
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
  
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
        onReload={() => setGameInitialized(false)}
        currentGame={currentGame}
        onAbandonGame={handleAbandonGame}
      />
    );
  }
  
  // ============================================================================
  // RENDER PRINCIPALE DEL GIOCO
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
                {/* Timer integrato nelle stats - VERSIONE CORRETTA */}
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
              onContinue={handleContinueWithTimer}  // ← USA LA FUNZIONE CUSTOM
              onNewGame={handleNewGame}
              onBackHome={handleBackHome} 
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