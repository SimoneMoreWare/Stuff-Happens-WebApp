import { Card, Row, Col, Badge, ProgressBar, Alert } from 'react-bootstrap';

function GameStatus({ 
    currentRound = 1,
    cardsCollected = 0,
    wrongGuesses = 0,
    isDemo = false,
    targetCards = 6,
    maxErrors = 3
}) {
    
    // Calcola percentuali per le progress bar
    const cardsProgress = (cardsCollected / targetCards) * 100;
    const errorsProgress = (wrongGuesses / maxErrors) * 100;
    
    // Determina colori basati sui progressi
    const getCardsVariant = () => {
        if (cardsProgress >= 100) return 'success';
        if (cardsProgress >= 66) return 'primary';
        if (cardsProgress >= 33) return 'info';
        return 'secondary';
    };
    
    const getErrorsVariant = () => {
        if (errorsProgress >= 100) return 'danger';
        if (errorsProgress >= 66) return 'warning';
        return 'success';
    };
    
    // Stato critico se vicino alla sconfitta
    const isCritical = wrongGuesses >= maxErrors - 1;
    const isNearVictory = cardsCollected >= targetCards - 1;
    
    return (
        <Card className={`shadow-sm ${isCritical ? 'border-danger' : isNearVictory ? 'border-success' : ''}`}>
            <Card.Header className={`${isDemo ? 'bg-warning text-dark' : 'bg-primary text-white'} text-center`}>
                <h5 className="mb-0">
                    <i className="bi bi-speedometer me-2"></i>
                    {isDemo ? 'Demo Game' : 'Stato Partita'}
                </h5>
            </Card.Header>
            
            <Card.Body className="p-3">
                {/* Alert per stati critici */}
                {isCritical && !isDemo && (
                    <Alert variant="danger" className="mb-3 py-2">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        <strong>Attenzione!</strong> Un altro errore e perderai la partita!
                    </Alert>
                )}
                
                {isNearVictory && !isDemo && (
                    <Alert variant="success" className="mb-3 py-2">
                        <i className="bi bi-star-fill me-2"></i>
                        <strong>Ci sei quasi!</strong> Solo una carta per la vittoria!
                    </Alert>
                )}
                
                {/* Statistiche principali */}
                <Row className="text-center mb-3">
                    <Col xs={4}>
                        <div className="d-flex flex-column align-items-center">
                            <Badge bg="primary" className="mb-1 fs-6">
                                Round {currentRound}
                            </Badge>
                            <small className="text-muted">Round Corrente</small>
                        </div>
                    </Col>
                    
                    <Col xs={4}>
                        <div className="d-flex flex-column align-items-center">
                            <Badge bg={getCardsVariant()} className="mb-1 fs-6">
                                {cardsCollected}/{isDemo ? 1 : targetCards}
                            </Badge>
                            <small className="text-muted">Carte</small>
                        </div>
                    </Col>
                    
                    <Col xs={4}>
                        <div className="d-flex flex-column align-items-center">
                            <Badge bg={getErrorsVariant()} className="mb-1 fs-6">
                                {wrongGuesses}/{isDemo ? '∞' : maxErrors}
                            </Badge>
                            <small className="text-muted">Errori</small>
                        </div>
                    </Col>
                </Row>
                
                {/* Progress bars per partite complete */}
                {!isDemo && (
                    <>
                        {/* Progresso carte */}
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <small className="text-muted">
                                    <i className="bi bi-collection me-1"></i>
                                    Progresso Carte
                                </small>
                                <small className="text-muted">{cardsProgress.toFixed(0)}%</small>
                            </div>
                            <ProgressBar 
                                now={cardsProgress} 
                                variant={getCardsVariant()}
                                style={{ height: '6px' }}
                            />
                        </div>
                        
                        {/* Contatore errori (inverso) */}
                        <div className="mb-0">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <small className="text-muted">
                                    <i className="bi bi-shield-check me-1"></i>
                                    Margine di Errore
                                </small>
                                <small className="text-muted">
                                    {maxErrors - wrongGuesses} rimanenti
                                </small>
                            </div>
                            <ProgressBar 
                                now={100 - errorsProgress} 
                                variant={getErrorsVariant()}
                                style={{ height: '6px' }}
                            />
                        </div>
                    </>
                )}
                
                {/* Informazioni demo */}
                {isDemo && (
                    <div className="text-center mt-2">
                        <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            Partita di prova - Nessun limite di errori
                        </small>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

/**
 * MiniGameStatus - Versione compatta per navbar o sidebar
 */
function MiniGameStatus({ cardsCollected = 0, wrongGuesses = 0, isDemo = false }) {
    if (isDemo) {
        return (
            <Badge bg="warning" text="dark" className="d-flex align-items-center">
                <i className="bi bi-controller me-1"></i>
                Demo
            </Badge>
        );
    }
    
    return (
        <div className="d-flex gap-2">
            <Badge bg="success" className="d-flex align-items-center">
                <i className="bi bi-collection me-1"></i>
                {cardsCollected}/6
            </Badge>
            <Badge bg="danger" className="d-flex align-items-center">
                <i className="bi bi-x-circle me-1"></i>
                {wrongGuesses}/3
            </Badge>
        </div>
    );
}

/**
 * GameStatusBar - Barra orizzontale per header di pagina
 */
function GameStatusBar({ 
    currentRound, 
    cardsCollected, 
    wrongGuesses, 
    isDemo,
    className = ""
}) {
    return (
        <div className={`d-flex justify-content-center gap-3 ${className}`}>
            <Badge bg="primary" className="d-flex align-items-center px-3 py-2">
                <i className="bi bi-arrow-clockwise me-2"></i>
                Round {currentRound}
            </Badge>
            
            <Badge bg="success" className="d-flex align-items-center px-3 py-2">
                <i className="bi bi-collection me-2"></i>
                Carte: {cardsCollected}/{isDemo ? 1 : 6}
            </Badge>
            
            <Badge bg="danger" className="d-flex align-items-center px-3 py-2">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Errori: {wrongGuesses}/{isDemo ? '∞' : 3}
            </Badge>
        </div>
    );
}

// Esporta tutti i componenti
export default GameStatus;
export { MiniGameStatus, GameStatusBar };