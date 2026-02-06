import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import UserContext from '../../../context/UserContext.jsx';
import API from '../../../API/API.mjs';

/**
 * ConfirmModal - Reusable confirmation dialog component
 * 
 * Replaces browser's window.confirm with a more accessible and styled modal.
 * Provides consistent confirmation flow across different game actions.
 */
export function ConfirmModal({ show, title, message, onConfirm, onCancel, confirmVariant = "danger" }) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Annulla
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          Conferma
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/**
 * GameLoading - Loading state indicator component
 * 
 * Displays spinner and contextual message during async operations.
 * Provides user feedback during game state transitions.
 */
export function GameLoading({ gameState }) {
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

/**
 * GameError - Error state component with recovery options
 * 
 * Displays error information and provides multiple recovery paths.
 * Integrates with game abandonment flow for proper state cleanup.
 */
export function GameError({ error, onBackHome, onReload, currentGame, onAbandonGame }) {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleAbandonClick = () => {
    setShowConfirm(true);
  };
  
  const handleConfirmAbandon = () => {
    setShowConfirm(false);
    onAbandonGame();
  };
  
  const handleCancelAbandon = () => {
    setShowConfirm(false);
  };
  
  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Card className="shadow-lg">
        <Card.Body className="text-center">
          <h3 className="text-danger mb-3">Errore</h3>
          <p className="text-muted mb-4">{error}</p>
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="primary" onClick={onBackHome}>
              Torna alla Home
            </Button>
            <Button variant="outline-secondary" onClick={onReload}>
              Ricarica
            </Button>
            {currentGame && (
              <Button 
                variant="outline-danger" 
                onClick={handleAbandonClick}
              >
                Abbandona Partita
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
      
      <ConfirmModal
        show={showConfirm}
        title="Abbandona Partita"
        message="Vuoi abbandonare la partita corrente? Tutti i progressi andranno persi."
        onConfirm={handleConfirmAbandon}
        onCancel={handleCancelAbandon}
        confirmVariant="danger"
      />
    </Container>
  );
}

/**
 * GameAbandoned - Game abandonment success feedback
 * 
 * Displays confirmation when game abandonment is completed.
 * Provides visual feedback during navigation transition.
 */
export function GameAbandoned() {
  return (
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
  );
}

/**
 * RoundStartButton - Round initiation interface
 * 
 * Provides clear call-to-action for starting new rounds.
 * Displays current round information and engaging start button.
 */
export function RoundStartButton({ currentGame, onStartRound }) {
  return (
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
              onClick={onStartRound}
              className="px-5"
            >
              <i className="bi bi-play-fill me-2"></i>
              Inizia Round
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}

/**
 * GameStats - Game progress statistics display
 * 
 * Modern, compact display with color-coded statistics.
 */
export function GameStats({ currentGame, targetCard, timerActive, onTimeUp }) {
  return (
    <Col xs={12} className="mt-3 mb-2">
      <Card className="border-0 shadow-sm">
        <Card.Body className="py-2 px-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            {/* Section title */}
            <div className="d-flex align-items-center">
              <i className="bi bi-bar-chart-fill text-primary me-2"></i>
              <strong className="text-muted">Progresso</strong>
            </div>
            
            {/* Stats badges - Modern chip style */}
            <div className="d-flex gap-2 flex-wrap">
              <span className="badge rounded-pill" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '0.9rem',
                padding: '0.4rem 0.8rem'
              }}>
                <i className="bi bi-play-circle me-1"></i>
                Round {currentGame.current_round}
              </span>
              
              <span className="badge rounded-pill bg-success" style={{
                fontSize: '0.9rem',
                padding: '0.4rem 0.8rem'
              }}>
                <i className="bi bi-collection me-1"></i>
                {currentGame.cards_collected}/6 Carte
              </span>
              
              <span className={`badge rounded-pill ${
                currentGame.wrong_guesses === 0 ? 'bg-success' :
                currentGame.wrong_guesses === 1 ? 'bg-warning' :
                currentGame.wrong_guesses === 2 ? 'bg-danger bg-opacity-75' :
                'bg-danger'
              }`} style={{
                fontSize: '0.9rem',
                padding: '0.4rem 0.8rem'
              }}>
                <i className="bi bi-x-circle me-1"></i>
                {currentGame.wrong_guesses}/3 Errori
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}

/**
 * AbandonGameButton - Game abandonment control
 * 
 * Provides game abandonment functionality with proper state management.
 * Integrates with UserContext for consistent navigation behavior.
 */
export function AbandonGameButton({ gameState, currentGame }) {
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Context integration for centralized state management
  const { 
    isInActiveGame,
    setIsInActiveGame,
    clearCurrentGame,
    setMessage 
  } = useContext(UserContext);
  
  const navigate = useNavigate();
  
  // Only show button during active gameplay
  if (gameState !== 'playing' || !currentGame) return null;
  
  const handleAbandonClick = () => {
    setShowConfirm(true);
  };
  
  /**
   * Game abandonment handler - mirrors navbar implementation
   * Ensures consistent behavior across different interface elements
   */
  const handleConfirmAbandon = async () => {
    setShowConfirm(false);
    
    if (isInActiveGame) {
      try {
        // Attempt API abandonment
        if (currentGame) {
          await API.abandonGame(currentGame.id);
        }
        
        // Clean up application state
        setIsInActiveGame(false);
        clearCurrentGame();
        setMessage({ type: 'info', msg: 'Partita abbandonata automaticamente' });
        
        navigate('/');
        
      } catch (err) {
        // Fallback: local cleanup if API fails
        setIsInActiveGame(false);
        clearCurrentGame();
        setMessage({ type: 'warning', msg: 'Partita abbandonata localmente (errore API)' });
        
        navigate('/');
      }
    } else {
      // No active game - direct navigation
      navigate('/');
    }
  };
  
  const handleCancelAbandon = () => {
    setShowConfirm(false);
  };
  
  return (
    <>
      <Row className="mt-2">
        <Col xs={12}>
          <div className="text-center">
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={handleAbandonClick}
              className="d-flex align-items-center mx-auto"
              title="Abbandona la partita corrente e torna alla home"
            >
              <i className="bi bi-flag me-2"></i>
              Abbandona Partita
            </Button>
          </div>
        </Col>
      </Row>
      
      <ConfirmModal
        show={showConfirm}
        title="Abbandona Partita"
        message="Sei sicuro di voler abbandonare la partita? Verrai riportato alla home e tutti i progressi andranno persi."
        onConfirm={handleConfirmAbandon}
        onCancel={handleCancelAbandon}
        confirmVariant="danger"
      />
    </>
  );
}