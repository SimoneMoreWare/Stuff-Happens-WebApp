import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import UserContext from '../../context/UserContext.jsx';
import API from '../../API/API.mjs';
import { Card as CardModel } from '../../models/Card.mjs';
import CardDisplay from './CardDisplay.jsx';
import Timer from './Timer.jsx';
import PositionSelector from './PositionSelector.jsx';
import RoundResult from './RoundResult.jsx';
import GameSummary from './GameSummary.jsx';

/**
 * Componente separato per gestire SOLO le partite demo per utenti anonimi
 * 
 * Questa separazione migliora:
 * - Leggibilità del codice
 * - Manutenibilità 
 * - Debug
 * - Performance (meno re-render)
 */
function DemoGameBoard() {
    const { setMessage } = useContext(UserContext);
    const navigate = useNavigate();
    
    // Stati locali per la demo
    const [gameState, setGameState] = useState('loading'); // loading, playing, result, finished
    const [currentCards, setCurrentCards] = useState([]);
    const [targetCard, setTargetCard] = useState(null);
    const [gameResult, setGameResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Timer state
    const [timerActive, setTimerActive] = useState(false);
    const [gameStartTime, setGameStartTime] = useState(null);
    
    // ============================================================================
    // INIZIALIZZAZIONE DEMO - SEMPLIFICATA
    // ============================================================================
    
    useEffect(() => {
        startDemoGame();
    }, []); // 👈 DEPENDENCY VUOTA - si esegue solo una volta
    
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
                null, // Nascosto in demo
                demoData.targetCard.theme
            );
            
            setCurrentCards(initialCards);
            setTargetCard(target);
            setGameState('playing');
            setTimerActive(true);
            setGameStartTime(Date.now());
            
        } catch (err) {
            console.error('Errore demo:', err);
            setError(err.message || 'Errore nel caricamento della demo');
            setGameState('finished');
        } finally {
            setLoading(false);
        }
    };
    
    // ============================================================================
    // GESTIONE DEMO GUESS
    // ============================================================================
    
    const handlePositionSelect = async (position) => {
        try {
            setTimerActive(false);
            setGameState('loading');
            
            const timeElapsed = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
            
            console.log('🎯 Demo position selected:', position);
            console.log('⏰ Time elapsed:', timeElapsed);
            
            const result = await API.submitDemoGuess(
                targetCard.id,
                currentCards.map(c => c.id),
                position,
                timeElapsed
            );
            
            console.log('📊 Demo API Response:', result);
            
            // Aggiorna targetCard con il bad_luck_index rivelato
            const revealedCard = new CardModel(
                targetCard.id,
                targetCard.name,
                targetCard.image_url,
                result.targetCard.bad_luck_index,
                targetCard.theme
            );
            setTargetCard(revealedCard);
            
            setGameResult({
                isCorrect: result.correct,
                correctPosition: result.correctPosition,
                guessedPosition: position,
                explanation: result.explanation
            });
            setGameState('result');
            
        } catch (err) {
            console.error('Errore submit demo guess:', err);
            setError('Errore nell\'invio della risposta. Riprova.');
            setGameState('playing');
            setTimerActive(true);
        }
    };
    
    // ============================================================================
    // GESTIONE TIMER
    // ============================================================================
    
    const handleTimeUp = () => {
        console.log('⏰ Tempo scaduto in demo!');
        // Simula selezione posizione random come penalità
        const randomPosition = Math.floor(Math.random() * (currentCards.length + 1));
        handlePositionSelect(randomPosition);
    };
    
    // ============================================================================
    // NAVIGAZIONE
    // ============================================================================
    
    const handleNewGame = () => {
        // Reset dello stato per nuova demo
        setGameState('loading');
        setCurrentCards([]);
        setTargetCard(null);
        setGameResult(null);
        setTimerActive(false);
        setError('');
        
        // Avvia nuova demo
        startDemoGame();
    };
    
    const handleBackHome = () => {
        navigate('/');
    };
    
    // ============================================================================
    // RENDER
    // ============================================================================
    
    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center min-vh-75">
                <div className="text-center">
                    <Spinner animation="border" className="mb-3" />
                    <p>Caricamento demo...</p>
                </div>
            </Container>
        );
    }
    
    if (error) {
        return (
            <Container>
                <Alert variant="danger" className="text-center">
                    <h4>Errore</h4>
                    <p>{error}</p>
                    <div className="d-flex gap-2 justify-content-center">
                        <Button variant="primary" onClick={handleBackHome}>
                            Torna alla Home
                        </Button>
                        <Button variant="secondary" onClick={handleNewGame}>
                            Riprova Demo
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }
    
    return (
        <Container className="py-4">
            {/* Header del gioco */}
            <Row className="mb-4">
                <Col className="text-center">
                    <div className="d-flex justify-content-between align-items-center">
                        <Button 
                            variant="outline-secondary" 
                            onClick={handleBackHome}
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-arrow-left me-2"></i>
                            Torna alla Home
                        </Button>
                        
                        <div className="text-center">
                            <h2 className="mb-1">
                                <i className="bi bi-controller me-2"></i>
                                Modalità Demo
                            </h2>
                            <p className="text-muted mb-0">
                                Prova il gioco senza registrarti
                            </p>
                        </div>
                        
                        <div style={{ width: '120px' }}></div> {/* Spacer */}
                    </div>
                </Col>
            </Row>
            
            {/* Stato Playing - Gioco attivo */}
            {gameState === 'playing' && (
                <>
                    {/* Timer */}
                    <Row className="mb-4">
                        <Col md={6} className="mx-auto">
                            <Timer 
                                duration={30}
                                isActive={timerActive}
                                onTimeUp={handleTimeUp}
                            />
                        </Col>
                    </Row>
                    
                    {/* Layout a due colonne: Carta target + Carte attuali */}
                    <Row className="mb-4">
                        {/* Colonna sinistra: Carta da posizionare */}
                        <Col md={4}>
                            <div className="text-center mb-3">
                                <h4>Carta da Posizionare:</h4>
                            </div>
                            <CardDisplay 
                                card={targetCard} 
                                showBadLuckIndex={false}
                                isTarget={true}
                            />
                        </Col>
                        
                        {/* Colonna destra: Le tue carte attuali */}
                        <Col md={8}>
                            <div className="text-center mb-3">
                                <h5>Le Tue Carte (ordinate per Bad Luck Index):</h5>
                            </div>
                            <Row className="g-3">
                                {currentCards.map((card, index) => (
                                    <Col key={card.id} md={4}>
                                        <div className="text-center mb-2">
                                            <Badge bg="secondary">Posizione {index + 1}</Badge>
                                        </div>
                                        <CardDisplay 
                                            card={card} 
                                            showBadLuckIndex={true}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </Col>
                    </Row>
                    
                    {/* Selettore posizione */}
                    <Row className="mt-5 mb-4">
                        <Col md={10} className="mx-auto">
                            <div style={{ marginTop: '3rem' }}>
                                <Card className="border-primary shadow">
                                    <Card.Header className="bg-primary text-white text-center">
                                        <h5 className="mb-0">
                                            <i className="bi bi-cursor me-2"></i>
                                            Dove vuoi posizionare la carta?
                                        </h5>
                                    </Card.Header>
                                    <Card.Body className="p-4">
                                        <PositionSelector 
                                            cards={currentCards}
                                            onPositionSelect={handlePositionSelect}
                                            disabled={!timerActive}
                                        />
                                    </Card.Body>
                                </Card>
                            </div>
                        </Col>
                    </Row>
                </>
            )}
            
            {/* Stato Result - Mostra risultato */}
            {gameState === 'result' && gameResult && (
                <RoundResult 
                    isCorrect={gameResult.isCorrect}
                    targetCard={targetCard}
                    correctPosition={gameResult.correctPosition}
                    guessedPosition={gameResult.guessedPosition}
                    allCards={currentCards}
                    onContinue={handleNewGame} // In demo, "continua" = nuova demo
                    onNewGame={handleNewGame}
                    isDemo={true}
                    gameCompleted={false} // Demo è sempre single-round
                    gameWon={gameResult.isCorrect}
                />
            )}
        </Container>
    );
}

export default DemoGameBoard;