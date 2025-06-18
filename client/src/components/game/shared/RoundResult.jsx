import { Container, Row, Col, Card, Alert, Button, Badge } from 'react-bootstrap';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import UserContext from '../../../context/UserContext.jsx';
import API from '../../../API/API.mjs';
import CardDisplay from './CardDisplay.jsx';

/**
 * RoundResult - Round completion feedback component
 * 
 * Displays the outcome of a player's guess with contextual feedback and navigation options.
 * Handles different game states (demo, active, completed) with appropriate UI adaptations.
 * 
 * Architecture Features:
 * - Context integration for game state management
 * - Conditional rendering based on game phase and outcome
 * - Game abandonment flow with confirmation dialog
 * - Responsive design with outcome-based visual themes
 * - Navigation management with proper state cleanup
 * 
 * Design Patterns:
 * - State Machine: Different UI states based on game phase
 * - Observer: Watches UserContext for game state changes
 * - Command: Action buttons encapsulate navigation commands
 */
function RoundResult({ 
    isCorrect, 
    isTimeout, 
    targetCard, 
    correctPosition, 
    guessedPosition, 
    allCards,
    onContinue, 
    onNewGame, 
    onBackHome,
    isDemo = false,
    gameCompleted = false,
    gameWon = false 
}) {
    
    // Context integration for centralized game state management
    const { 
        currentGame, 
        isInActiveGame,
        setIsInActiveGame,
        clearCurrentGame,
        setMessage 
    } = useContext(UserContext);
    const navigate = useNavigate();
    
    // Local state for abandonment confirmation flow
    const [showConfirmAbandon, setShowConfirmAbandon] = useState(false);
    
    // Game abandonment handler with proper cleanup
    // Replicates navbar logic for consistent behavior across components
    const handleNewGameWithAutoAbandon = async () => {
        if (isInActiveGame) {
            try {
                // Attempt to abandon current game via API
                if (currentGame) {
                    await API.abandonGame(currentGame.id);
                }
                
                // Clean up local state
                setIsInActiveGame(false);
                clearCurrentGame();
                setMessage({ type: 'info', msg: 'Partita abbandonata - Torna al gioco per iniziarne una nuova' });
                
                // Navigate to safe home state
                navigate('/');
                
            } catch (err) {
                // Fallback: local cleanup even if API fails
                setIsInActiveGame(false);
                clearCurrentGame();
                setMessage({ type: 'warning', msg: 'Partita abbandonata localmente' });
                
                // Navigate to home as fallback
                navigate('/');
            }
        } else {
            // No active game - direct navigation
            navigate('/');
        }
    };
    
    // New game request handler with conditional confirmation
    const handleRequestNewGame = () => {
        if (gameCompleted) {
            // Completed game - direct new game creation
            if (onNewGame) {
                onNewGame();
            }
        } else {
            // Active game - requires confirmation to abandon
            setShowConfirmAbandon(true);
        }
    };
    
    // Confirmation dialog handlers
    const handleConfirmAbandon = () => {
        setShowConfirmAbandon(false);
        handleNewGameWithAutoAbandon();
    };
    
    const handleCancelAbandon = () => {
        setShowConfirmAbandon(false);
    };
    
    // Dynamic content generation based on round outcome
    const getMainIcon = () => {
        if (isTimeout) return '⏰';
        return isCorrect ? '🎉' : '💔';
    };
    
    const getMainTitle = () => {
        if (isTimeout) return 'Tempo Scaduto!';
        return isCorrect ? 'Fantastico!' : 'Peccato!';
    };
    
    const getMainMessage = () => {
        if (isTimeout) {
            return isDemo ? 
                'Il tempo è scaduto, ma ora sai come funziona!' :
                'Il tempo è scaduto. Riprova nel prossimo round!';
        }
        
        if (isCorrect) {
            return isDemo ?
                'Hai capito perfettamente il meccanismo del gioco!' :
                'Ottimo! Hai vinto questa carta.';
        } else {
            return isDemo ?
                'Non preoccuparti, ora hai capito come funziona il gioco e sei pronto per le partite complete!' :
                'Prossima volta andrà meglio!';
        }
    };
    
    // Theme color selection based on outcome
    const getThemeColor = () => {
        if (isTimeout) return 'warning';
        return isCorrect ? 'success' : 'primary'; // Blue instead of red for less aggressive feedback
    };
    
    const themeColor = getThemeColor();
    
    return (
        <Container className="py-4" style={{ maxWidth: '800px' }}>
            
            {/* Confirmation dialog for game abandonment - React-style modal */}
            {showConfirmAbandon && (
                <Row className="mb-4">
                    <Col>
                        <Alert variant="warning" className="shadow border-0">
                            <Alert.Heading className="h5">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                Abbandonare la Partita?
                            </Alert.Heading>
                            <p className="mb-3">
                                Sei sicuro di voler abbandonare la partita in corso e iniziarne una nuova? 
                                Perderai tutti i progressi attuali.
                            </p>
                            <div className="d-flex gap-2 justify-content-end">
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={handleCancelAbandon}
                                >
                                    <i className="bi bi-x-circle me-1"></i>
                                    Annulla
                                </Button>
                                <Button 
                                    variant="danger" 
                                    onClick={handleConfirmAbandon}
                                >
                                    <i className="bi bi-check-circle me-1"></i>
                                    Sì, Abbandona
                                </Button>
                            </div>
                        </Alert>
                    </Col>
                </Row>
            )}
            
            {/* Primary action button - immediately visible for better UX */}
            {!isDemo && !gameCompleted && (
                <Row className="mb-4">
                    <Col className="text-center">
                        <Button 
                            variant={themeColor}
                            size="lg"
                            onClick={onContinue}
                            className="px-5 py-3 shadow"
                            style={{ fontSize: '1.2rem' }}
                        >
                            <i className="bi bi-arrow-right me-2"></i>
                            Prossimo Round
                        </Button>
                    </Col>
                </Row>
            )}
            
            {/* Game completion notification - victory or defeat */}
            {!isDemo && gameCompleted && (
                <Row className="mb-4">
                    <Col className="text-center">
                        <Alert 
                            variant={gameWon ? 'success' : 'danger'} 
                            className="shadow-lg border-0 p-4"
                        >
                            <div className="display-1 mb-3">
                                {gameWon ? '🏆' : '😔'}
                            </div>
                            <Alert.Heading as="h1" className="mb-3">
                                {gameWon ? 'VITTORIA!' : 'PARTITA FINITA'}
                            </Alert.Heading>
                            <p className="lead mb-0">
                                {gameWon ? 
                                    'Complimenti! Hai raccolto tutte le 6 carte e completato il gioco!' :
                                    'Hai commesso 3 errori. La partita è terminata, ma hai fatto del tuo meglio!'
                                }
                            </p>
                        </Alert>
                    </Col>
                </Row>
            )}
            
            {/* Main result display - clear and simple feedback */}
            <Row className="mb-4">
                <Col className="text-center">
                    <Card className={`border-${themeColor} shadow-lg`}>
                        <Card.Body className="py-4">
                            <div className="display-2 mb-3">
                                {getMainIcon()}
                            </div>
                            <h2 className={`text-${themeColor} mb-3`}>
                                {getMainTitle()}
                            </h2>
                            <p className="lead text-muted mb-3">
                                {getMainMessage()}
                            </p>
                            
                            {/* Essential information only when relevant */}
                            {!isTimeout && !gameCompleted && (
                                <div className={`p-3 bg-${themeColor === 'warning' ? 'light' : themeColor}-subtle rounded`}>
                                    <small className="text-muted">
                                        <strong>La tua scelta:</strong> Posizione {guessedPosition}
                                        {isCorrect && targetCard && (
                                            <span> • <strong>Bad Luck Index:</strong> {targetCard.bad_luck_index}</span>
                                        )}
                                    </small>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            {/* Won card display - only when relevant */}
            {isCorrect && targetCard && (
                <Row className="mb-4">
                    <Col className="text-center">
                        <h4 className="text-muted mb-3">Carta Aggiunta alla Collezione</h4>
                        <div className="d-inline-block position-relative">
                            <CardDisplay 
                                card={targetCard}
                                showBadLuckIndex={true}
                                className="shadow"
                                style={{ width: '250px', maxWidth: '100%' }}
                            />
                            <Badge 
                                bg="success" 
                                className="position-absolute top-0 start-100 translate-middle"
                                style={{ fontSize: '0.8rem' }}
                            >
                                ✓ Vinta
                            </Badge>
                        </div>
                    </Col>
                </Row>
            )}
            
            {/* Demo mode: final collection display */}
            {isDemo && allCards && allCards.length > 0 && (
                <Row className="mb-4">
                    <Col>
                        <Card className="bg-light border-0">
                            <Card.Body>
                                <h5 className="text-center text-muted mb-4">
                                    {isCorrect ? "La Tua Collezione Aggiornata" : "Le Tue Carte"}
                                </h5>
                                <div className="d-flex justify-content-center flex-wrap gap-2">
                                    {allCards
                                        .sort((a, b) => a.bad_luck_index - b.bad_luck_index)
                                        .map((card, index) => {
                                            const isNewCard = isCorrect && card.id === targetCard?.id;
                                            return (
                                                <div key={card.id} className="text-center">
                                                    <div style={{ width: '120px' }}>
                                                        <CardDisplay 
                                                            card={card}
                                                            showBadLuckIndex={true}
                                                            className={`${isNewCard ? 'border-success border-2' : 'border-light'} mb-1`}
                                                            style={{ height: '140px' }}
                                                        />
                                                        {isNewCard && (
                                                            <small className="text-success fw-bold">
                                                                ★ Nuova
                                                            </small>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
            
            {/* Secondary actions - more discrete placement */}
            <Row>
                <Col className="text-center">
                    <Card className="border-0 bg-transparent">
                        <Card.Body>
                            
                            {/* Primary actions for demo and completed games */}
                            <div className="mb-3">
                                {!isDemo && gameCompleted && (
                                    <Button 
                                        variant={gameWon ? 'success' : 'primary'}
                                        size="lg"
                                        onClick={onContinue}
                                        className="px-5 py-3 shadow"
                                        style={{ fontSize: '1.2rem' }}
                                    >
                                        <i className={`bi ${gameWon ? 'bi-trophy' : 'bi-chart-bar'} me-2`}></i>
                                        {gameWon ? 'Celebra la Vittoria!' : 'Vedi il Tuo Punteggio'}
                                    </Button>
                                )}
                                
                                {isDemo && (
                                    <Button 
                                        variant={themeColor}
                                        size="lg"
                                        onClick={onNewGame}
                                        className="px-5 py-3 shadow"
                                        style={{ fontSize: '1.2rem' }}
                                    >
                                        <i className="bi bi-arrow-repeat me-2"></i>
                                        Prova Ancora
                                    </Button>
                                )}
                            </div>
                            
                            {/* Secondary actions - more discrete styling */}
                            <div className="d-flex gap-2 justify-content-center flex-wrap">
                                {!isDemo && (
                                    <Button 
                                        variant="outline-secondary"
                                        onClick={handleRequestNewGame}
                                    >
                                        <i className="bi bi-plus-circle me-1"></i>
                                        Nuova Partita
                                    </Button>
                                )}
                                
                                <Button 
                                    variant="outline-secondary"
                                    onClick={onBackHome}
                                >
                                    <i className="bi bi-house me-1"></i>
                                    Home
                                </Button>
                                
                                {isDemo && (
                                    <Button 
                                        variant="outline-primary"
                                        href="/login"
                                    >
                                        <i className="bi bi-person-plus me-1"></i>
                                        Registrati
                                    </Button>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            {/* Promotional message - only for demo mode and very discrete */}
            {isDemo && (
                <Row className="mt-4">
                    <Col>
                        <div className="text-center p-3 bg-light rounded">
                            <small className="text-muted">
                                <i className="bi bi-info-circle me-1"></i>
                                {isCorrect ? 
                                    'Ti è piaciuto? Registrati per giocare partite complete!' :
                                    'Vuoi allenarti di più? Registrati per partite complete!'
                                }
                            </small>
                        </div>
                    </Col>
                </Row>
            )}
        </Container>
    );
}

export default RoundResult;