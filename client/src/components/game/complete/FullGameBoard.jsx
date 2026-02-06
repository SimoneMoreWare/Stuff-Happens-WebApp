import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

// Custom drag & drop components - external library integration for card positioning
import { DraggableTargetCard, StaticHandCard, InvisibleDropZone } from '../dragdrop/DragDrop.jsx';

// Shared UI components - modular design for code reusability
import { GameHeader } from '../shared/GameHeader.jsx';
import { GameInstructions } from '../shared/GameInstructions.jsx';
import { 
  GameLoading, 
  GameError, 
  GameAbandoned, 
  RoundStartButton
} from '../shared/GameUI.jsx';

// Specialized components for game phases
import Timer from '../shared/Timer.jsx';
import RoundResult from '../shared/RoundResult.jsx';
import GameSummary from './GameSummary.jsx';

// Custom hooks - separation of concerns for maintainability
import { useGameTimer } from '../hooks/useGameTimer.jsx';
import { useDragDrop } from '../hooks/useDragDrop.jsx';
import { useGameManagement } from '../hooks/useGameManagement.jsx';

// Shared styling - consistent appearance across components
import { gameStyles } from '../shared/GameStyles.jsx';

/**
 * FullGameBoard - Main component for complete game functionality
 * 
 * This is the primary game component that orchestrates all game phases:
 * - Initial game setup and creation
 * - Round-based gameplay with timer integration
 * - Drag & drop card positioning mechanics
 * - Result handling and game completion
 * 
 * Architecture decisions:
 * - Custom hooks separate concerns (timer, drag&drop, game management)
 * - State is lifted up to this component for centralized control
 * - External drag&drop library (@dnd-kit) chosen for robust touch/mouse support
 * - Timer integration ensures consistent 30-second rounds
 */
function FullGameBoard() {
  
  // ============================================================================
  // LOCAL STATE MANAGEMENT
  // ============================================================================
  
  // Controls initial game setup flow - prevents automatic game creation
  const [gameInitialized, setGameInitialized] = useState(false);
  
  // ============================================================================
  // CUSTOM HOOKS INTEGRATION
  // ============================================================================
  
  // Main game state and API operations - centralized game logic
  const {
    gameState,
    currentGame,
    currentCards,
    targetCard,
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
    handleContinueAfterResult,
    handleNewGame,
    handleBackHome,
    handleAbandonGame,
    cleanupGameState
  } = useGameManagement();
  
  // Timer functionality with 30-second rounds - game rule implementation
  const {
    timerActive,
    timeRemaining,
    startTimer,
    stopTimer,
    getElapsedTime,
    isTimeUp 
  } = useGameTimer(30, handleTimeUp);
  
  // Drag & drop functionality - external library integration
  const {
    sensors,
    allItems,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  } = useDragDrop(currentCards, targetCard, handlePositionSelect);
  
  // Prevents double-clicks during game creation - UX improvement
  const [isCreating, setIsCreating] = useState(false);
  
  // ============================================================================
  // TIMEOUT HANDLING - CRITICAL GAME LOGIC
  // ============================================================================
  
  // Watches for timer expiration and triggers timeout logic
  // Uses effect to handle async timeout processing without blocking render
  useEffect(() => {
    const handleTimeout = async () => {
      // Only process timeout in active game state to prevent duplicate calls
      if (isTimeUp && gameState === 'playing' && !loading) {
        await processTimeUp();
      }
    };
    handleTimeout();
  }, [isTimeUp, gameState, loading]); // Minimal dependencies to prevent excessive calls
  
  // ============================================================================
  // EVENT HANDLERS - USER INTERACTION PROCESSING
  // ============================================================================
  
  /**
   * Handle player's card position selection
   * Stops timer and processes the guess with elapsed time tracking
   */
  async function handlePositionSelect(position) {
    try {
      // Stop timer immediately to capture accurate elapsed time
      stopTimer();
      const timeElapsed = getElapsedTime();
      
      // Process the guess through API
      await processGameResult(position, timeElapsed);
    } catch (error) {
      // Error handling
      setError('Errore nell\'invio della risposta');
    }
  }
  
  /**
   * Handle timeout when player doesn't make a selection
   * Safety check prevents duplicate timeout processing
   */
  async function handleTimeUp() {
    // Guard clause prevents multiple timeout calls
    if (!timerActive || gameState !== 'playing') return;
    await processTimeUp();
  }
  
  /**
   * Start new round and activate timer
   * Combines round start with timer activation for seamless gameplay
   */
  const handleStartRound = async () => {
    const success = await startNextRound();
    // Only start timer if round creation was successful
    if (success) {
      startTimer();
    }
  };
  
  /**
   * Continue button handler that manages timer for next round
   * Differentiates between continuing game vs. game over scenarios
   */
  const handleContinueWithTimer = async () => {
    if (roundResult?.gameStatus === 'playing') {
      // Game continues - start next round with timer
      const success = await startNextRound();
      
      // Critical: restart timer for new round
      if (success) {
        startTimer();
      }
    } else {
      // Game over - use standard continuation flow
      await handleContinueAfterResult();
    }
  };
  
  /**
   * Initialize game on user request
   * Handles creation state to prevent duplicate game creation
   */
  const handleInitializeGame = async () => {
    // Prevent double-clicks during creation
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      setGameInitialized(true);
      await handleCreateNewGame();
    } finally {
      setIsCreating(false);
    }
  };
  
  // ============================================================================
  // RENDER: INITIAL SETUP SCREEN
  // ============================================================================
  
  // Show setup screen before game initialization
  // This design choice gives users explicit control over game creation
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
  // RENDER: LOADING AND ERROR STATES
  // ============================================================================
  
  // Loading state with user feedback
  if (loading) {
    return <GameLoading gameState={gameState} />;
  }
  
  // Error state with recovery options
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
  // RENDER: MAIN GAME INTERFACE
  // ============================================================================
  
  return (
    <Container fluid>
      <style>{gameStyles}</style>
      
      <Row>
        {/* Game header with user info and navigation */}
        <Col xs={12}>
          <GameHeader
            title="Partita Completa"
            subtitle={`Benvenuto, ${user?.username}!`}
            onBackHome={handleBackHome}
            variant="dark"
          />
        </Col>
        
        {/* Game abandoned state - allows recovery */}
        {gameState === 'abandoned' && <GameAbandoned />}
        
        {/* Active game state - MINIMAL UI */}
        {gameState === 'playing' && currentGame && (
          <>
            {!targetCard ? (
              /* Round start */
              <Col xs={12} className="mt-4">
                <div className="text-center">
                  <Button 
                    variant="success" 
                    size="lg" 
                    onClick={handleStartRound}
                  >
                    <i className="bi bi-play-fill me-2"></i>
                    Inizia Round {currentGame.current_round}
                  </Button>
                </div>
              </Col>
            ) : (
              /* Main game - TUTTO MINIMAL */
              <Col xs={12}>
                
                {/* BARRA INFO MINIMAL */}
                <div className="info-bar-minimal mb-3 mt-3">
                  {/* Timer */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Timer
                      timeRemaining={timeRemaining}
                      duration={30}
                      isActive={timerActive}
                    />
                  </div>
                  
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge bg-primary">R{currentGame.current_round}</span>
                    <span className="badge bg-success">{currentGame.cards_collected}/6</span>
                    <span className={`badge ${
                      currentGame.wrong_guesses === 0 ? 'bg-success' :
                      currentGame.wrong_guesses === 1 ? 'bg-warning text-dark' :
                      'bg-danger'
                    }`}>
                      ❌ {currentGame.wrong_guesses}/3
                    </span>
                  </div>
                  
                  {/* Abbandona */}
                  <button 
                    className="btn-minimal text-danger"
                    onClick={() => {
                      if (window.confirm('Abbandonare la partita?')) {
                        handleAbandonGame();
                      }
                    }}
                    title="Abbandona partita"
                  >
                    <i className="bi bi-x-lg fs-5"></i>
                  </button>
                </div>
                
                {/* Istruzione minimal */}
                <div className="text-center mb-2">
                  <small className="text-minimal">
                    Trascina <strong>Target</strong> nella posizione corretta
                  </small>
                </div>
                
                {/* CARTE */}
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
                        minHeight: isCompactLayout ? '220px' : '290px',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
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
              </Col>
            )}
          </>
        )}
        
        {/* Round result state - shows outcome of player's guess */}
        {gameState === 'result' && roundResult && (
          <Col xs={12}>
            <RoundResult 
              isCorrect={roundResult.isCorrect}
              isTimeout={roundResult.isTimeout}
              targetCard={targetCard}
              correctPosition={roundResult.correctPosition}
              guessedPosition={roundResult.guessedPosition}
              allCards={currentCards}
              onContinue={handleContinueWithTimer} // Uses timer-aware handler
              onNewGame={handleNewGame}
              onBackHome={handleBackHome} 
              isDemo={false}
              gameCompleted={roundResult.gameStatus !== 'playing'}
              gameWon={roundResult.gameStatus === 'won'}
            />
          </Col>
        )}
        
        {/* Game completion state - final summary and options */}
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