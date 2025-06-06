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
import GameStatus from './GameStatus.jsx';

/**
 * FullGameBoard - Gestisce partite complete per utenti autenticati
 * 
 * FLUSSO DI GIOCO:
 * 1. Verifica se utente ha partita in corso, altrimenti chiede di crearne una
 * 2. Mostra 3 carte iniziali + stato partita
 * 3. Per ogni round: mostra carta target, avvia timer, raccoglie guess
 * 4. Aggiorna stato in base al risultato (carta vinta/persa)
 * 5. Continua fino a vittoria (6 carte) o sconfitta (3 errori)
 * 6. Mostra riassunto finale con statistiche
 * 
 * GESTIONE STATO:
 * - gameState: 'loading' | 'no-game' | 'playing' | 'result' | 'game-over'
 * - currentGame: oggetto partita dal server
 * - currentCards: carte attualmente possedute
 * - targetCard: carta del round corrente
 * - roundResult: risultato ultimo round
 */
function FullGameBoard() {
    const { user, setMessage, updateCurrentGame, clearCurrentGame } = useContext(UserContext);
    const navigate = useNavigate();
    
    // ============================================================================
    // STATO LOCALE DEL COMPONENTE
    // ============================================================================
    
    const [gameState, setGameState] = useState('loading'); // loading, no-game, playing, result, game-over
    const [currentGame, setCurrentGame] = useState(null);
    const [currentCards, setCurrentCards] = useState([]);
    const [targetCard, setTargetCard] = useState(null);
    const [currentRoundCard, setCurrentRoundCard] = useState(null); // Per il gameCardId
    const [roundResult, setRoundResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Timer state
    const [timerActive, setTimerActive] = useState(false);
    const [roundStartTime, setRoundStartTime] = useState(null);
    
    // ============================================================================
    // INIZIALIZZAZIONE - Verifica partita esistente
    // ============================================================================
    
    useEffect(() => {
        checkCurrentGame();
    }, []); // Solo al mount
    
    const checkCurrentGame = async () => {
        try {
            setLoading(true);
            setError('');
            
            console.log('🎮 Checking for existing game...');
            
            try {
                // Controlla se c'è una partita in corso
                const gameData = await API.getCurrentGame();
                console.log('📋 Found existing game:', gameData);
                
                setCurrentGame(gameData.game);
                updateCurrentGame(gameData.game);
                
                // Carica le carte attualmente possedute
                if (gameData.wonCards && gameData.wonCards.length > 0) {
                    const wonCards = gameData.wonCards.map(c => 
                        new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
                    );
                    wonCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
                    setCurrentCards(wonCards);
                }
                
                // Controlla se la partita è già terminata
                if (gameData.game.status !== 'playing') {
                    setGameState('game-over');
                    return;
                }
                
                // Partita attiva - controlla se è da concludere
                if (gameData.game.cards_collected >= 6) {
                    // Vittoria!
                    setGameState('game-over');
                    return;
                } else if (gameData.game.wrong_guesses >= 3) {
                    // Sconfitta!
                    setGameState('game-over');
                    return;
                }
                
                // Partita attiva - vai al prossimo round
                setGameState('playing');
                
            } catch (gameError) {
                // Nessuna partita in corso
                console.log('ℹ️ No active game found');
                setGameState('no-game');
                setCurrentGame(null);
                clearCurrentGame();
            }
            
        } catch (err) {
            console.error('❌ Error checking current game:', err);
            setError('Errore nel caricamento della partita');
            setGameState('no-game');
        } finally {
            setLoading(false);
        }
    };
    
    // ============================================================================
    // CREAZIONE NUOVA PARTITA
    // ============================================================================
    
    const handleCreateNewGame = async () => {
        try {
            setLoading(true);
            setError('');
            
            console.log('🆕 Creating new game...');
            
            const gameData = await API.createGame('university_life');
            console.log('✅ Game created:', gameData);
            
            setCurrentGame(gameData.game);
            updateCurrentGame(gameData.game);
            
            // Converti le carte iniziali
            const initialCards = gameData.initialCards.map(c =>
                new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
            );
            initialCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
            setCurrentCards(initialCards);
            
            setGameState('playing');
            setMessage({ type: 'success', msg: 'Nuova partita creata!' });
            
        } catch (err) {
            console.error('❌ Error creating game:', err);
            
            if (err.type === 'ACTIVE_GAME_EXISTS') {
                // L'utente ha già una partita attiva
                setError('Hai già una partita in corso. Completa quella prima di iniziarne una nuova.');
                // Ricarica la partita esistente
                checkCurrentGame();
            } else {
                setError(err.message || 'Errore nella creazione della partita');
            }
        } finally {
            setLoading(false);
        }
    };
    
    // ============================================================================
    // GESTIONE ROUND - Avvio del prossimo round
    // ============================================================================
    
    const startNextRound = async () => {
        try {
            setError('');
            setGameState('loading');
            
            console.log('🎯 Starting next round for game:', currentGame.id);
            
            const roundData = await API.getNextRoundCard(currentGame.id);
            console.log('🃏 Got round card:', roundData);
            
            // Imposta la carta del round (senza bad_luck_index)
            const roundCard = {
                id: roundData.roundCard.id,
                name: roundData.roundCard.name,
                image_url: roundData.roundCard.image_url,
                theme: roundData.roundCard.theme
            };
            
            setTargetCard(roundCard);
            setCurrentRoundCard(roundData.roundCard); // Mantieni gameCardId per il submit
            setGameState('playing');
            setTimerActive(true);
            setRoundStartTime(Date.now());
            
        } catch (err) {
            console.error('❌ Error starting round:', err);
            
            if (err.type === 'GAME_NOT_ACTIVE') {
                // La partita è terminata
                setGameState('game-over');
            } else {
                setError(err.message || 'Errore nell\'avvio del round');
                setGameState('playing');
            }
        }
    };
    
    // ============================================================================
    // GESTIONE GUESS - Invio della posizione scelta
    // ============================================================================
    
    const handlePositionSelect = async (position) => {
        try {
            setTimerActive(false);
            setGameState('loading');
            
            const timeElapsed = roundStartTime ? Math.floor((Date.now() - roundStartTime) / 1000) : 0;
            
            console.log('🎯 Submitting guess:', {
                gameId: currentGame.id,
                gameCardId: currentRoundCard.gameCardId,
                position,
                timeElapsed
            });
            
            const result = await API.submitGameGuess(
                currentGame.id,
                currentRoundCard.gameCardId,
                position,
                timeElapsed
            );
            
            console.log('📊 Guess result:', result);
            
            // Aggiorna stato locale partita
            if (result.game) {
                setCurrentGame(result.game);
                updateCurrentGame(result.game);
            }
            
            // Aggiorna la carta target con bad_luck_index rivelato
            if (result.revealed_card) {
                const revealedCard = Array.isArray(result.revealed_card) ? result.revealed_card[0] : result.revealed_card;
                const revealedCardModel = new CardModel(
                    revealedCard.id,
                    revealedCard.name,
                    revealedCard.image_url,
                    revealedCard.bad_luck_index,
                    revealedCard.theme
                );
                setTargetCard(revealedCardModel);
                
                // Se la risposta è corretta, aggiungi la carta alla collezione
                if (result.correct) {
                    setCurrentCards(prev => {
                        const newCards = [...prev, revealedCardModel];
                        newCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
                        return newCards;
                    });
                }
            }
            
            // Imposta il risultato del round
            setRoundResult({
                isCorrect: result.correct,
                correctPosition: result.correctPosition,
                guessedPosition: position,
                explanation: result.message,
                gameStatus: result.gameStatus
            });
            
            setGameState('result');
            
        } catch (err) {
            console.error('❌ Error submitting guess:', err);
            setError('Errore nell\'invio della risposta. Riprova.');
            setGameState('playing');
            setTimerActive(true);
        }
    };
    
    // ============================================================================
    // GESTIONE TIMER - Tempo scaduto
    // ============================================================================
    
    const handleTimeUp = () => {
        console.log('⏰ Time up! Auto-submitting random position...');
        // Simula selezione posizione random come penalità
        const randomPosition = Math.floor(Math.random() * (currentCards.length + 1));
        handlePositionSelect(randomPosition);
    };
    
    // ============================================================================
    // NAVIGAZIONE TRA STATI DEL GIOCO
    // ============================================================================
    
    const handleContinueAfterResult = () => {
        if (roundResult?.gameStatus === 'playing') {
            // Continua al prossimo round
            setRoundResult(null);
            setTargetCard(null);
            setCurrentRoundCard(null);
            startNextRound();
        } else {
            // Partita terminata
            setGameState('game-over');
        }
    };
    
    const handleNewGame = () => {
        // Reset completo dello stato
        setGameState('loading');
        setCurrentGame(null);
        setCurrentCards([]);
        setTargetCard(null);
        setCurrentRoundCard(null);
        setRoundResult(null);
        setTimerActive(false);
        setError('');
        clearCurrentGame();
        
        // Crea nuova partita
        handleCreateNewGame();
    };
    
    const handleBackHome = () => {
        navigate('/');
    };
    
    const handleViewProfile = () => {
        navigate('/profile');
    };
    
    // ============================================================================
    // ABBANDONA PARTITA
    // ============================================================================
    
    const handleAbandonGame = async () => {
        if (!currentGame || !window.confirm('Sei sicuro di voler abbandonare questa partita?')) {
            return;
        }
        
        try {
            await API.abandonGame(currentGame.id);
            clearCurrentGame();
            setMessage({ type: 'info', msg: 'Partita abbandonata' });
            setGameState('no-game');
        } catch (err) {
            console.error('❌ Error abandoning game:', err);
            setError('Errore nell\'abbandono della partita');
        }
    };
    
    // ============================================================================
    // RENDER
    // ============================================================================
    
    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center min-vh-75">
                <div className="text-center">
                    <Spinner animation="border" className="mb-3" />
                    <p>Caricamento partita...</p>
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
                        <Button variant="secondary" onClick={checkCurrentGame}>
                            Ricarica
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
                            Home
                        </Button>
                        
                        <div className="text-center">
                            <h2 className="mb-1">
                                <i className="bi bi-trophy me-2"></i>
                                Partita Completa
                            </h2>
                            <p className="text-muted mb-0">
                                Benvenuto, {user?.username}!
                            </p>
                        </div>
                        
                        <Button 
                            variant="outline-primary" 
                            onClick={handleViewProfile}
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-person-lines-fill me-2"></i>
                            Profilo
                        </Button>
                    </div>
                </Col>
            </Row>
            
            {/* Stato: Nessuna partita */}
            {gameState === 'no-game' && (
                <Row className="justify-content-center">
                    <Col md={8}>
                        <Card className="text-center shadow">
                            <Card.Body className="p-5">
                                <div className="mb-4">
                                    <i className="bi bi-controller display-1 text-primary"></i>
                                </div>
                                <h3 className="mb-3">Nessuna Partita Attiva</h3>
                                <p className="text-muted mb-4">
                                    Non hai partite in corso. Creane una nuova per iniziare a giocare!
                                </p>
                                <Button 
                                    variant="primary" 
                                    size="lg" 
                                    onClick={handleCreateNewGame}
                                    className="d-flex align-items-center mx-auto"
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Nuova Partita
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
            
            {/* Stato: Gioco attivo */}
            {gameState === 'playing' && currentGame && (
                <>
                    {/* Stato partita */}
                    <Row className="mb-4">
                        <Col md={4}>
                            <GameStatus 
                                currentRound={currentGame.current_round}
                                cardsCollected={currentGame.cards_collected}
                                wrongGuesses={currentGame.wrong_guesses}
                                isDemo={false}
                            />
                        </Col>
                        <Col md={8}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="mb-3">Le Tue Carte ({currentCards.length})</h5>
                                    {currentCards.length > 0 ? (
                                        <Row className="g-2">
                                            {currentCards.map((card, index) => (
                                                <Col key={card.id} md={4}>
                                                    <div className="text-center mb-2">
                                                        <Badge bg="secondary">#{index + 1}</Badge>
                                                    </div>
                                                    <CardDisplay 
                                                        card={card} 
                                                        showBadLuckIndex={true}
                                                        className="h-100"
                                                    />
                                                </Col>
                                            ))}
                                        </Row>
                                    ) : (
                                        <p className="text-muted">Nessuna carta ancora raccolta</p>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    
                    {/* Bottone per iniziare il round */}
                    {!targetCard && (
                        <Row className="mb-4">
                            <Col className="text-center">
                                <Card className="border-primary">
                                    <Card.Body className="p-4">
                                        <h4 className="mb-3">
                                            Round {currentGame.current_round}
                                        </h4>
                                        <p className="text-muted mb-4">
                                            Clicca per ricevere la prossima carta da posizionare
                                        </p>
                                        <Button 
                                            variant="primary" 
                                            size="lg" 
                                            onClick={startNextRound}
                                            className="d-flex align-items-center mx-auto"
                                        >
                                            <i className="bi bi-play-circle me-2"></i>
                                            Inizia Round
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
                    
                    {/* Round attivo con timer */}
                    {targetCard && (
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
                            
                            {/* Layout: Carta target + Selettore posizione */}
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
                                    <Card className="border-primary shadow">
                                        <Card.Header className="bg-primary text-white text-center">
                                            <h5 className="mb-0">
                                                <i className="bi bi-cursor me-2"></i>
                                                Dove vuoi posizionare questa carta?
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
                                </Col>
                            </Row>
                            
                            {/* Bottone abbandona partita */}
                            <Row>
                                <Col className="text-center">
                                    <Button 
                                        variant="outline-danger" 
                                        onClick={handleAbandonGame}
                                        className="d-flex align-items-center mx-auto"
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Abbandona Partita
                                    </Button>
                                </Col>
                            </Row>
                        </>
                    )}
                </>
            )}
            
            {/* Stato: Risultato round */}
            {gameState === 'result' && roundResult && (
                <RoundResult 
                    isCorrect={roundResult.isCorrect}
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
            )}
            
            {/* Stato: Partita terminata */}
            {gameState === 'game-over' && currentGame && (
                <GameSummary 
                    gameWon={currentGame.status === 'won'}
                    finalCards={currentCards}
                    totalRounds={currentGame.current_round}
                    cardsCollected={currentGame.cards_collected}
                    wrongGuesses={currentGame.wrong_guesses}
                    onNewGame={handleNewGame}
                    onBackHome={handleBackHome}
                    isDemo={false}
                />
            )}
        </Container>
    );
}

export default FullGameBoard;