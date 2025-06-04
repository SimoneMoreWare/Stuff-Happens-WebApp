import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import UserContext from '../../context/UserContext.jsx';
import API from '../../API/API.mjs';
import { Card as CardModel } from '../../models/Card.mjs';
import CardDisplay from './CardDisplay.jsx';
import Timer from './Timer.jsx';
import PositionSelector from './PositionSelector.jsx';
import RoundResult from './RoundResult.jsx';
import GameSummary from './GameSummary.jsx';

function GameBoard() {
    const { loggedIn, user, setMessage, currentGame, updateCurrentGame, clearCurrentGame } = useContext(UserContext);
    const navigate = useNavigate();
    
    // ============================================================================
    // STATI DEL GIOCO
    // ============================================================================
    
    const [gameState, setGameState] = useState('loading'); // loading, playing, result, finished
    const [isDemo, setIsDemo] = useState(!loggedIn);
    const [currentCards, setCurrentCards] = useState([]);
    const [targetCard, setTargetCard] = useState(null);
    const [gameResult, setGameResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [initialized, setInitialized] = useState(false); // ✨ NUOVO: Previene inizializzazioni multiple
    
    // Stati partita completa
    const [gameData, setGameData] = useState(null);
    const [currentRound, setCurrentRound] = useState(1);
    const [cardsCollected, setCardsCollected] = useState(0);
    const [wrongGuesses, setWrongGuesses] = useState(0);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    
    // Timer state
    const [timerActive, setTimerActive] = useState(false);
    const [gameStartTime, setGameStartTime] = useState(null);
    
    // Modal per conferme
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [activeGameId, setActiveGameId] = useState(null);

    // ============================================================================
    // INIZIALIZZAZIONE GIOCO - ✨ VERSIONE CORRETTA
    // ============================================================================
    
    useEffect(() => {
        // Evita inizializzazioni multiple (importante per React Strict Mode)
        if (!initialized) {
            initializeGame();
        }
    }, [loggedIn, initialized]);

    const initializeGame = async () => {
        try {
            setLoading(true);
            setError('');
            setInitialized(true); // ✨ Marca come inizializzato per evitare loop
            
            console.log('🔍 Debug currentGame:', currentGame);
            
            if (!loggedIn) {
                // Modalità Demo
                await startDemoGame();
            } else {
                // Modalità Completa - ✨ STRATEGIA CORRETTA: prima controlla, poi crea
                try {
                    // PRIMA: tenta di recuperare partita esistente
                    const existingGame = await API.getCurrentGame();
                    console.log('🎮 Partita esistente trovata:', existingGame);
                    await loadExistingGame(existingGame.game || existingGame);
                } catch (err) {
                    if (err.type === 'NO_ACTIVE_GAME') {
                        // Nessuna partita attiva, creane una nuova
                        console.log('🆕 Nessuna partita attiva, creando nuova...');
                        await createNewGame();
                    } else {
                        throw err; // Altri errori
                    }
                }
            }
        } catch (err) {
            console.error('Errore inizializzazione gioco:', err);
            handleInitializationError(err);
        } finally {
            setLoading(false);
        }
    };

    // ✨ NUOVO: Gestione errori separata per maggiore chiarezza
    const handleInitializationError = (err) => {
        if (err.type === 'ACTIVE_GAME_EXISTS') {
            setError(`Hai già una partita in corso (ID: ${err.activeGameId}). Vuoi continuarla o abbandonarla per iniziarne una nuova?`);
            setActiveGameId(err.activeGameId);
            setConfirmAction(() => () => loadExistingGameById(err.activeGameId));
            setShowConfirmModal(true);
        } else if (err.message && err.message.includes('ID partita non trovato')) {
            // Problema con la struttura dati - resetta e prova di nuovo
            console.warn('Problema con currentGame, resettando...');
            clearCurrentGame();
            setInitialized(false); // Permetti nuova inizializzazione
        } else {
            setError(err.message || 'Errore nel caricamento del gioco. Riprova.');
            setGameState('finished');
        }
    };

    // ============================================================================
    // DEMO GAME LOGIC
    // ============================================================================
    
    const startDemoGame = async () => {
        setIsDemo(true);
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
    };

    // ============================================================================
    // FULL GAME LOGIC
    // ============================================================================
    
    const createNewGame = async () => {
        try {
            const newGameData = await API.createGame();
            console.log('🎮 Nuova partita creata:', newGameData);
            
            setGameData(newGameData);
            setIsDemo(false);
            setCurrentRound(newGameData.current_round || 1);
            setCardsCollected(newGameData.cards_collected || 0);
            setWrongGuesses(newGameData.wrong_guesses || 0);
            
            // Aggiorna il context globale - usa la struttura corretta
            updateCurrentGame(newGameData);
            
            // Carica le carte iniziali - gestisci diversi formati possibili
            const wonCards = newGameData.won_cards || newGameData.wonCards || newGameData.initialCards || [];
            const initialCards = wonCards.map(c => 
                new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
            );
            setCurrentCards(initialCards);
            
            console.log('📋 Carte iniziali caricate:', initialCards.length, 'carte');
            
            // Se ha già 3+ carte, inizia il prossimo round
            if (initialCards.length >= 3) {
                await startNewRound(newGameData.id);
            } else {
                // Caso strano - dovrebbe sempre avere 3 carte iniziali
                console.warn('⚠️ Partita senza carte iniziali sufficienti, inizializzando comunque...');
                setGameState('playing');
            }
            
        } catch (err) {
            throw err; // Rilancia per gestione in handleInitializationError
        }
    };
    
    const loadExistingGame = async (gameInfo) => {
        try {
            // Assicurati che gameInfo abbia la struttura corretta
            const gameId = gameInfo.id || gameInfo.game?.id;
            if (!gameId) {
                throw new Error('ID partita non trovato nella struttura dati');
            }
            
            const fullGameData = await API.getGameById(gameId);
            console.log('🔄 Caricando partita esistente:', fullGameData);
            
            setGameData(fullGameData);
            setIsDemo(false);
            setCurrentRound(fullGameData.current_round || 1);
            setCardsCollected(fullGameData.cards_collected || 0);
            setWrongGuesses(fullGameData.wrong_guesses || 0);
            
            // Carica le carte già vinte - gestisci diversi formati
            const wonCards = fullGameData.won_cards || fullGameData.wonCards || fullGameData.initialCards || [];
            const currentCardsArray = wonCards.map(c => 
                new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
            );
            setCurrentCards(currentCardsArray);
            
            console.log('📋 Carte caricate:', currentCardsArray.length, 'carte');
            
            // Controlla se la partita è completata
            if (fullGameData.status !== 'playing') {
                setGameCompleted(true);
                setGameWon(fullGameData.status === 'won');
                setGameState('finished');
                clearCurrentGame(); // Rimuovi dal context se completata
                return;
            }
            
            // Se in corso, carica il round corrente
            await startNewRound(fullGameData.id);
            
        } catch (err) {
            throw err;
        }
    };
    
    const loadExistingGameById = async (gameId) => {
        try {
            const gameInfo = { id: gameId };
            await loadExistingGame(gameInfo);
            setShowConfirmModal(false);
        } catch (err) {
            setError('Errore nel caricamento della partita esistente');
            setGameState('finished');
        }
    };
    
    const abandonExistingGameAndCreateNew = async (gameId) => {
        try {
            setShowConfirmModal(false);
            setLoading(true);
            
            // Abbandona la partita esistente
            await API.abandonGame(gameId);
            console.log('🗑️ Partita abbandonata, creando nuova...');
            
            // Pulisci il context
            clearCurrentGame();
            
            // Crea nuova partita
            await createNewGame();
            
        } catch (err) {
            console.error('Errore abbandono e creazione:', err);
            setError('Errore nell\'abbandonare la partita esistente');
            setGameState('finished');
        } finally {
            setLoading(false);
        }
    };
    
    const startNewRound = async (gameId) => {
        try {
            console.log(`🎯 Iniziando round ${currentRound} per partita ${gameId}`);
            
            const roundData = await API.getNextRoundCard(gameId);
            console.log('🎴 Carta round ricevuta:', roundData);
            
            // Crea la carta target (senza bad_luck_index)
            const target = {
                id: roundData.card.id,
                name: roundData.card.name,
                image_url: roundData.card.image_url,
                theme: roundData.card.theme,
                gameCardId: roundData.game_card_id // Importante per submit!
            };
            
            setTargetCard(target);
            setGameState('playing');
            setTimerActive(true);
            setGameStartTime(Date.now());
            
        } catch (err) {
            if (err.type === 'GAME_NOT_ACTIVE') {
                // Partita completata, ricarica stato
                const updatedGame = await API.getGameById(gameId);
                setGameCompleted(true);
                setGameWon(updatedGame.status === 'won');
                setGameState('finished');
                clearCurrentGame();
            } else {
                throw err;
            }
        }
    };

    // ============================================================================
    // GESTIONE SELEZIONE POSIZIONE
    // ============================================================================
    
    const handlePositionSelect = async (position) => {
        try {
            setTimerActive(false);
            setGameState('loading');
            
            const timeElapsed = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
            
            console.log('🎯 Position selected:', position);
            console.log('⏰ Time elapsed:', timeElapsed);
            
            if (isDemo) {
                await handleDemoGuess(position, timeElapsed);
            } else {
                await handleFullGameGuess(position, timeElapsed);
            }
            
        } catch (err) {
            console.error('Errore submit guess:', err);
            setError('Errore nell\'invio della risposta. Riprova.');
            setGameState('playing');
            setTimerActive(true);
        }
    };
    
    const handleDemoGuess = async (position, timeElapsed) => {
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
    };
    
    const handleFullGameGuess = async (position, timeElapsed) => {
        const result = await API.submitGameGuess(
            gameData.id,
            targetCard.gameCardId, // Usa gameCardId dal round data
            position,
            timeElapsed
        );
        
        console.log('📊 Full Game API Response:', result);
        
        // Aggiorna stato partita
        setCardsCollected(result.game.cards_collected);
        setWrongGuesses(result.game.wrong_guesses);
        setCurrentRound(result.game.current_round);
        
        // Aggiorna carte possedute se ha indovinato
        if (result.correct) {
            const newCard = new CardModel(
                result.revealed_card.id,
                result.revealed_card.name,
                result.revealed_card.image_url,
                result.revealed_card.bad_luck_index,
                result.revealed_card.theme
            );
            
            // Ricostruisci l'array ordinato delle carte
            const updatedCards = [...currentCards, newCard].sort((a, b) => a.bad_luck_index - b.bad_luck_index);
            setCurrentCards(updatedCards);
        }
        
        // Aggiorna targetCard con il bad_luck_index rivelato
        const revealedCard = new CardModel(
            targetCard.id,
            targetCard.name,
            targetCard.image_url,
            result.revealed_card.bad_luck_index,
            targetCard.theme
        );
        setTargetCard(revealedCard);
        
        setGameResult({
            isCorrect: result.correct,
            correctPosition: result.correct_position,
            guessedPosition: position,
            explanation: result.explanation || `${result.correct ? 'Corretto!' : 'Sbagliato!'}`
        });
        
        // Controlla se partita completata
        if (result.game.status !== 'playing') {
            setGameCompleted(true);
            setGameWon(result.game.status === 'won');
            clearCurrentGame(); // Rimuovi dal context globale
        } else {
            // Aggiorna il context con i nuovi dati
            updateCurrentGame(result.game);
        }
        
        setGameState('result');
    };

    // ============================================================================
    // GESTIONE TIMER
    // ============================================================================
    
    const handleTimeUp = () => {
        console.log('⏰ Tempo scaduto!');
        // Simula selezione posizione random come penalità
        const randomPosition = Math.floor(Math.random() * (currentCards.length + 1));
        handlePositionSelect(randomPosition);
    };

    // ============================================================================
    // GESTIONE RISULTATO E NAVIGAZIONE - ✨ VERSIONE CORRETTA
    // ============================================================================
    
    const handleContinue = async () => {
        if (gameCompleted) {
            // Partita finita - vai al riassunto
            setGameState('finished');
        } else {
            // Continua al prossimo round
            setGameState('loading');
            setTargetCard(null);
            setGameResult(null);
            setTimerActive(false);
            
            try {
                await startNewRound(gameData.id);
            } catch (err) {
                console.error('Errore prossimo round:', err);
                setError('Errore nel caricamento del prossimo round');
                setGameState('finished');
            }
        }
    };
    
    const handleNewGame = () => {
        // Prima di creare una nuova partita, pulisci lo stato corrente
        clearCurrentGame(); // Rimuovi dal context globale
        setInitialized(false); // ✨ NUOVO: Permetti nuova inizializzazione
        
        // Reset completo dello stato
        setGameState('loading');
        setCurrentCards([]);
        setTargetCard(null);
        setGameResult(null);
        setGameData(null);
        setCurrentRound(1);
        setCardsCollected(0);
        setWrongGuesses(0);
        setGameCompleted(false);
        setGameWon(false);
        setTimerActive(false);
        
        // L'effect si riattiva automaticamente per initialized = false
    };
    
    const handleBackHome = () => {
        navigate('/');
    };
    
    const handleAbandonGame = async () => {
        if (!isDemo && gameData?.id) {
            try {
                await API.abandonGame(gameData.id);
                clearCurrentGame();
                setMessage({ type: 'info', msg: 'Partita abbandonata' });
            } catch (err) {
                console.error('Errore abbandono partita:', err);
            }
        }
        handleBackHome();
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
                        {showConfirmModal && (
                            <Button variant="success" onClick={confirmAction}>
                                Carica Partita Esistente
                            </Button>
                        )}
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
                            onClick={handleAbandonGame}
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-arrow-left me-2"></i>
                            {isDemo ? 'Torna alla Home' : 'Abbandona Partita'}
                        </Button>
                        
                        <div className="text-center">
                            <h2 className="mb-1">
                                <i className="bi bi-controller me-2"></i>
                                {isDemo ? 'Modalità Demo' : 'Partita Completa'}
                            </h2>
                            {!isDemo && (
                                <div className="d-flex gap-3 justify-content-center">
                                    <Badge bg="primary">Round {currentRound}</Badge>
                                    <Badge bg="success">Carte: {cardsCollected}/6</Badge>
                                    <Badge bg="danger">Errori: {wrongGuesses}/3</Badge>
                                </div>
                            )}
                        </div>
                        
                        <div style={{ width: '120px' }}></div> {/* Spacer per bilanciamento */}
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
                    onContinue={handleContinue}
                    onNewGame={handleNewGame}
                    isDemo={isDemo}
                    gameCompleted={gameCompleted}
                    gameWon={gameWon}
                />
            )}

            {/* Stato Finished - Partita completata */}
            {gameState === 'finished' && gameCompleted && (
                <GameSummary 
                    gameWon={gameWon}
                    finalCards={currentCards}
                    totalRounds={currentRound}
                    cardsCollected={cardsCollected}
                    wrongGuesses={wrongGuesses}
                    onNewGame={handleNewGame}
                    onBackHome={handleBackHome}
                    isDemo={isDemo}
                />
            )}

            {/* Modal di conferma per azioni critiche */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Partita Esistente Trovata</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Hai già una partita in corso. Cosa vuoi fare?</p>
                    <ul>
                        <li><strong>Continua:</strong> Riprendi la partita esistente</li>
                        <li><strong>Abbandona:</strong> Elimina la partita attuale e iniziane una nuova</li>
                    </ul>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                        Annulla
                    </Button>
                    <Button variant="success" onClick={confirmAction}>
                        <i className="bi bi-play-circle me-2"></i>
                        Continua Partita
                    </Button>
                    <Button 
                        variant="warning" 
                        onClick={() => {
                            if (activeGameId) {
                                abandonExistingGameAndCreateNew(activeGameId);
                            }
                        }}
                    >
                        <i className="bi bi-trash me-2"></i>
                        Abbandona e Crea Nuova
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default GameBoard;