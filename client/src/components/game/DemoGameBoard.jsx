import { useState, useEffect, useContext, useRef } from 'react';
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

function DemoGameBoard() {
    const { setMessage } = useContext(UserContext);
    const navigate = useNavigate();
    
    // Stati locali per la demo
    const [gameState, setGameState] = useState('loading');
    const [currentCards, setCurrentCards] = useState([]);
    const [targetCard, setTargetCard] = useState(null);
    const [gameResult, setGameResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // ✅ NUOVO: Stati per il riepilogo finale
    const [finalCards, setFinalCards] = useState([]);
    const [gameStats, setGameStats] = useState({
        totalRounds: 1, // Demo ha sempre 1 round
        cardsCollected: 0,
        wrongGuesses: 0
    });
    
    // Timer state
    const [timerActive, setTimerActive] = useState(false);
    const [gameStartTime, setGameStartTime] = useState(null);
    
    // Protezione per Strict Mode
    const timeoutHandledRef = useRef(false);
    
    // ============================================================================
    // INIZIALIZZAZIONE DEMO
    // ============================================================================
    
    useEffect(() => {
        startDemoGame();
    }, []);
    
    const startDemoGame = async () => {
        try {
            setLoading(true);
            setError('');
            timeoutHandledRef.current = false;
            
            // ✅ Reset completo stati
            setFinalCards([]);
            setGameStats({
                totalRounds: 1,
                cardsCollected: 0,
                wrongGuesses: 0
            });
            
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
            
            // ✅ AGGIORNA STATISTICHE
            const isCorrect = result.correct;
            const newStats = {
                totalRounds: 1,
                cardsCollected: isCorrect ? 1 : 0,
                wrongGuesses: isCorrect ? 0 : 1
            };
            setGameStats(newStats);
            
            // ✅ SE VINTA: aggiungi carta alle finalCards
            if (isCorrect) {
                setFinalCards([revealedCard]);
            } else {
                setFinalCards([]);
            }
            
            // Usa i dati dal server
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
            setTimerActive(true);
        }
    };
    
    // ============================================================================
    // GESTIONE TIMER
    // ============================================================================
    
    const handleTimeUp = async () => {
        if (timeoutHandledRef.current || !timerActive || gameState !== 'playing') {
            console.log('⏰ Timer already handled or game not active');
            return;
        }
        
        timeoutHandledRef.current = true;
        console.log('⏰ Tempo scaduto in demo!');
        
        try {
            setTimerActive(false);
            setGameState('loading');
            
            const timeElapsed = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
            
            console.log('🎯 Demo timeout - submitting with timeElapsed:', timeElapsed);
            
            // Invia timeout con timeElapsed che triggerà isTimeUp nel server
            const result = await API.submitDemoGuess(
                targetCard.id,
                currentCards.map(c => c.id),
                0, // Posizione fittizia
                Math.max(timeElapsed, 31) // Assicurati che sia > 30 per timeout
            );
            
            console.log('📊 Demo Timeout Response:', result);
            
            // Aggiorna targetCard con bad_luck_index rivelato
            const revealedCard = new CardModel(
                targetCard.id,
                targetCard.name,
                targetCard.image_url,
                result.targetCard.bad_luck_index,
                targetCard.theme
            );
            setTargetCard(revealedCard);
            
            // ✅ AGGIORNA STATISTICHE (timeout = errore)
            setGameStats({
                totalRounds: 1,
                cardsCollected: 0,
                wrongGuesses: 1
            });
            setFinalCards([]); // Nessuna carta vinta
            
            // Usa i dati dal server
            setGameResult({
                isCorrect: result.correct, // false
                isTimeout: result.timeUp, // true
                correctPosition: result.correctPosition,
                guessedPosition: undefined,
                explanation: result.message
            });
            setGameState('result');
            
        } catch (err) {
            console.error('Errore demo timeout:', err);
            setError('Errore nella gestione del timeout. Riprova.');
            setGameState('playing');
            setTimerActive(true);
            timeoutHandledRef.current = false;
        }
    };
    
    // ============================================================================
    // ✅ NUOVE FUNZIONI PER GESTIRE IL FLUSSO
    // ============================================================================
    
    // Vai dal risultato del round al summary finale
    const handleShowSummary = () => {
        console.log('🏁 Mostrando riepilogo demo con carte:', finalCards.length);
        setGameState('summary');
    };
    
    // Inizia nuova demo dal summary
    const handleNewGameFromSummary = () => {
        setGameState('loading');
        setCurrentCards([]);
        setTargetCard(null);
        setGameResult(null);
        setFinalCards([]);
        setTimerActive(false);
        setError('');
        timeoutHandledRef.current = false;
        
        startDemoGame();
    };
    
    // Torna alla home dal summary
    const handleBackHomeFromSummary = () => {
        navigate('/');
    };
    
    // ============================================================================
    // NAVIGAZIONE (per compatibilità)
    // ============================================================================
    
    const handleNewGame = () => {
        handleNewGameFromSummary();
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
            {/* Header del gioco - Solo per playing e result */}
            {(gameState === 'playing' || gameState === 'result') && (
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
                            
                            <div style={{ width: '120px' }}></div>
                        </div>
                    </Col>
                </Row>
            )}
            
            {/* Stato Playing */}
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
                    
                    {/* Layout a due colonne */}
                    <Row className="mb-4">
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
            
            {/* ✅ Stato Result - MODIFICATO per andare al summary */}
            {gameState === 'result' && gameResult && (
                <RoundResult 
                    isCorrect={gameResult.isCorrect}
                    isTimeout={gameResult.isTimeout}
                    targetCard={targetCard}
                    correctPosition={gameResult.correctPosition}
                    guessedPosition={gameResult.guessedPosition}
                    allCards={currentCards}
                    onContinue={handleShowSummary} // ✅ IMPORTANTE: va al summary
                    onNewGame={handleNewGame}
                    isDemo={true}
                    gameCompleted={true} // ✅ Demo è sempre "completata" dopo 1 round
                    gameWon={gameResult.isCorrect}
                />
            )}
            
            {/* ✅ NUOVO: Stato Summary */}
            {gameState === 'summary' && (
                <GameSummary 
                    gameWon={gameStats.cardsCollected > 0}
                    finalCards={finalCards} // Array delle carte vinte (0 o 1 per demo)
                    allInvolvedCards={[...currentCards, ...(targetCard ? [targetCard] : [])]} // ✅ TUTTE le carte coinvolte nella demo
                    totalRounds={gameStats.totalRounds}
                    cardsCollected={gameStats.cardsCollected}
                    wrongGuesses={gameStats.wrongGuesses}
                    onNewGame={handleNewGameFromSummary}
                    onBackHome={handleBackHomeFromSummary}
                    isDemo={true}
                />
            )}
        </Container>
    );
}

export default DemoGameBoard;