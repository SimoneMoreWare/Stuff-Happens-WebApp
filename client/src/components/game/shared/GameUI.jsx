// GameUI.jsx - VERSIONE CORRETTA con abbandono automatico

import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import UserContext from '../../../context/UserContext.jsx';
import API from '../../../API/API.mjs';

/**
 * ✅ NUOVO: Componente Modal per conferme invece di window.confirm
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

// Loading component (invariato)
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

// ✅ CORRETTO: Error state component senza window.confirm
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
      
      {/* ✅ CORRETTO: Modal invece di window.confirm */}
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

// Abandoned game state component (invariato)
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

// Round start button component (invariato)
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

// Game stats component (invariato)
export function GameStats({ currentGame, targetCard, timerActive, onTimeUp }) {
  return (
    <Col xs={12} className="mt-3">
      <Row>
        <Col md={3}>
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
      </Row>
    </Col>
  );
}

// ✅ PULSANTE IDENTICO AL NAVBAR - COPIA/INCOLLA ESATTA
export function AbandonGameButton({ gameState, currentGame }) {
  const [showConfirm, setShowConfirm] = useState(false);
  
  // ✅ STESSI IDENTICI IMPORT DEL NAVBAR
  const { 
    isInActiveGame,
    setIsInActiveGame,
    clearCurrentGame,
    setMessage 
  } = useContext(UserContext);
  
  const navigate = useNavigate();
  
  if (gameState !== 'playing' || !currentGame) return null;
  
  const handleAbandonClick = () => {
    setShowConfirm(true);
  };
  
  // ✅ FUNZIONE IDENTICA AL NAVBAR - handleNavigationWithAutoAbandon
  const handleConfirmAbandon = async () => {
    setShowConfirm(false);
    
    // ✅ COPIA/INCOLLA ESATTA DAL NAVBAR
    if (isInActiveGame) {
      try {
        if (currentGame) {
          await API.abandonGame(currentGame.id);
        }
        
        setIsInActiveGame(false);
        clearCurrentGame();
        setMessage({ type: 'info', msg: 'Partita abbandonata automaticamente' });
        
        navigate('/');
        
      } catch (err) {
        setIsInActiveGame(false);
        clearCurrentGame();
        setMessage({ type: 'warning', msg: 'Partita abbandonata localmente (errore API)' });
        
        navigate('/');
      }
    } else {
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