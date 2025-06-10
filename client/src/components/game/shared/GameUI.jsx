import React from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';

/**
 * Componenti UI riutilizzabili per gli stati del gioco
 * Raggruppa tutti i componenti di stato/loading/errori per funzionalità logica
 */

// Loading component
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

// Error state component
export function GameError({ error, onBackHome, onReload, currentGame, onAbandonGame }) {
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
                onClick={() => {
                  if(window.confirm('Vuoi abbandonare la partita corrente?')) {
                    onAbandonGame();
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

// Abandoned game state component
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

// Round start button component
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

// Game stats component
export function GameStats({ currentGame, targetCard, timerActive, onTimeUp }) {
  return (
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
                {/* Timer component importato */}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Col>
  );
}

// Abandon game button component
export function AbandonGameButton({ gameState, currentGame, onAbandonGame }) {
  if (gameState !== 'playing' || !currentGame) return null;
  
  return (
    <Row className="mt-2">
      <Col xs={12}>
        <div className="text-center">
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={() => {
              if(window.confirm('Sei sicuro di voler abbandonare la partita? Tutti i progressi andranno persi.')) {
                onAbandonGame();
              }
            }}
            className="d-flex align-items-center mx-auto"
            title="Abbandona la partita corrente"
          >
            <i className="bi bi-flag me-2"></i>
            Abbandona
          </Button>
        </div>
      </Col>
    </Row>
  );
}