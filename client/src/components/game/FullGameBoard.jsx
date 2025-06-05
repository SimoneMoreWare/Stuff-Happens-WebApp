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

/**
 * FullGameBoard - Versione completamente riscritta
 * 
 * PRINCIPI CHIAVE:
 * 1. ✅ UN SOLO useEffect con dependency array VUOTO
 * 2. ✅ Stati semplici senza oggetti complessi nelle dependencies
 * 3. ✅ Gestione errori chiara e lineare
 * 4. ✅ Flusso di gioco predicibile
 * 5. ✅ Reset pulito dello stato quando necessario
 */
function FullGameBoard() {
    const { user, setMessage, currentGame, updateCurrentGame, clearCurrentGame } = useContext(UserContext);
    const navigate = useNavigate();
    
    // ============================================================================
    // STATI PRINCIPALI - SEMPLIFICATI
    // ============================================================================
    
    // Stati del gioco
    const [gameState, setGameState] = useState('loading'); // loading, playing, result, finished, error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Dati di gioco
    const [gameId, setGameId] = useState(null);
    const [currentCards, setCurrentCards] = useState([]);
    const [targetCard, setTargetCard] = useState(null);
    const [gameResult, setGameResult] = useState(null);
    
    // Stats di gioco
    const [currentRound, setCurrentRound] = useState(1);
    const [cardsCollected, setCardsCollected] = useState(0);
    const [wrongGuesses, setWrongGuesses] = useState(0);
    
    // Timer
    const [timerActive, setTimerActive] = useState(false);
    const [gameStartTime, setGameStartTime] = useState(null);
    
    // Modal partita esistente
    const [showExistingGameModal, setShowExistingGameModal] = useState(false);
    const [existingGameId, setExistingGameId] = useState(null);
    
    // ============================================================================
    // INIZIALIZZAZIONE - UNA VOLTA SOLA
    // ============================================================================
    
    useEffect(() => {
        console.log('🚀 FullGameBoard: Inizializzazione UNICA');
        initializeFullGame();
    }, []); // 👈 DEPENDENCY ARRAY VUOTO - si esegue solo una volta
    
    // ============================================================================
    // FUNZIONE DI INIZIALIZZAZIONE
    // ============================================================================
    
    const initializeFullGame = async () => {
        try {
            setLoading(true);
            setError('');
            
            console.log('🎮 Inizializzando partita completa...');
            
            // STEP 1: Controlla se l'utente ha già una partita attiva
            await checkForActiveGame();
            
        } catch (err) {
            console.error('❌ Errore inizializzazione:', err);
            handleError(err);
        } finally {
            setLoading(false);
        }
    };
    
    // ============================================================================
    // CONTROLLO PARTITA ATTIVA
    // ============================================================================
    
    const checkForActiveGame = async () => {
        try {
            // Prova a ottenere la partita corrente
            const activeGameData = await API.getCurrentGame();
            console.log('📂 Partita attiva trovata:', activeGameData);
            
            // Carica la partita esistente
            await loadExistingGame(activeGameData);
            
        } catch (apiError) {
            if (apiError.type === 'NO_ACTIVE_GAME') {
                console.log('🆕 Nessuna partita attiva, creando nuova...');
                await createAndStartNewGame();
            } else {
                throw apiError;
            }
        }
    };
    
    // ============================================================================
    // CARICAMENTO PARTITA ESISTENTE
    // ============================================================================
    
    const loadExistingGame = async (gameData) => {
        try {
            console.log('📂 Caricando partita esistente...');
            
            // Estrai informazioni base
            const game = gameData.game || gameData;
            
            setGameId(game.id);
            setCurrentRound(game.current_round || 1);
            setCardsCollected(game.cards_collected || 0);
            setWrongGuesses(game.wrong_guesses || 0);
            
            // Controlla se la partita è completata
            if (game.status !== 'playing') {
                console.log('🏁 Partita completata:', game.status);
                await handleCompletedGame(game, gameData);
                return;
            }
            
            // Carica le carte vinte finora
            const wonCards = gameData.wonCards || gameData.initialCards || [];
            const cardsArray = wonCards.map(c => 
                new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
            ).sort((a, b) => a.bad_luck_index - b.bad_luck_index);
            
            setCurrentCards(cardsArray);
            console.log('📋 Carte caricate:', cardsArray.length);
            
            // Avvia il prossimo round
            await startNextRound(game.id);
            
        } catch (err) {
            console.error('❌ Errore caricamento partita esistente:', err);
            throw err;
        }
    };
    
    // ============================================================================
    // CREAZIONE NUOVA PARTITA
    // ============================================================================
    
    const createAndStartNewGame = async () => {
        try {
            console.log('🎮 Creando nuova partita...');
            
            const newGameData = await API.createGame();
            console.log('✅ Nuova partita creata:', newGameData);
            
            // Aggiorna context
            updateCurrentGame(newGameData);
            
            // Estrai dati base
            const game = newGameData.game || newGameData;
            
            setGameId(game.id);
            setCurrentRound(game.current_round || 1);
            setCardsCollected(game.cards_collected || 0);
            setWrongGuesses(game.wrong_guesses || 0);
            
            // Carica carte iniziali
            const initialCards = newGameData.initialCards || [];
            const cardsArray = initialCards.map(c => 
                new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
            ).sort((a, b) => a.bad_luck_index - b.bad_luck_index);
            
            setCurrentCards(cardsArray);
            console.log('📋 Carte iniziali caricate:', cardsArray.length);
            
            // Avvia primo round
            await startNextRound(game.id);
            
        } catch (err) {
            console.error('❌ Errore creazione partita:', err);
            
            if (err.type === 'ACTIVE_GAME_EXISTS') {
                // Mostra modal per partita esistente
                setExistingGameId(err.activeGameId);
                setShowExistingGameModal(true);
                setError(`Hai già una partita in corso (ID: ${err.activeGameId})`);
            } else {
                throw err;
            }
        }
    };
    
    // ============================================================================
    // AVVIA PROSSIMO ROUND
    // ============================================================================
    
    const startNextRound = async (currentGameId) => {
        try {
            console.log(`🎯 Avviando round per partita ${currentGameId}`);
            
            // DELAY PER EVITARE RACE CONDITIONS
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const roundData = await API.getNextRoundCard(currentGameId);
            console.log('🎴 Dati round ricevuti:', roundData);
            
            // Estrai carta del round con debug più dettagliato
            const roundCard = roundData.roundCard || roundData;
            
            const extractedGameCardId = roundCard.gameCardId || roundCard.game_card_id || roundData.gameCardId;
            console.log('🔍 GameCardId estratto:', extractedGameCardId);
            console.log('🔍 Struttura roundCard completa:', JSON.stringify(roundCard, null, 2));
            
            if (!extractedGameCardId) {
                console.error('❌ Nessun gameCardId trovato nei dati del round!');
                throw new Error('GameCardId mancante nei dati del round');
            }
            
            setTargetCard({
                id: roundCard.id,
                name: roundCard.name,
                image_url: roundCard.image_url,
                theme: roundCard.theme,
                gameCardId: extractedGameCardId
            });
            
            console.log('🎯 TargetCard configurata con gameCardId:', extractedGameCardId);
            
            // Avvia il gioco
            setGameState('playing');
            setTimerActive(true);
            setGameStartTime(Date.now());
            
        } catch (err) {
            console.error('❌ Errore avvio round:', err);
            
            if (err.type === 'GAME_NOT_ACTIVE') {
                // Partita completata - ricarica dati aggiornati
                const updatedGameData = await API.getGameById(currentGameId);
                await handleCompletedGame(updatedGameData.game, updatedGameData);
            } else {
                throw err;
            }
        }
    };
    
    // ============================================================================
    // GESTIONE PARTITA COMPLETATA
    // ============================================================================
    
    const handleCompletedGame = async (game, gameData) => {
        console.log('🏁 Gestendo partita completata:', game.status);
        
        // Carica tutte le carte finali
        const finalCards = gameData.wonCards || gameData.initialCards || [];
        const cardsArray = finalCards.map(c => 
            new CardModel(c.id, c.name, c.image_url, c.bad_luck_index, c.theme)
        ).sort((a, b) => a.bad_luck_index - b.bad_luck_index);
        
        setCurrentCards(cardsArray);
        setCurrentRound(game.current_round || 1);
        setCardsCollected(game.cards_collected || 0);
        setWrongGuesses(game.wrong_guesses || 0);
        
        // Imposta stato finale
        setGameState('finished');
        clearCurrentGame();
    };
    
    // ============================================================================
    // GESTIONE SELEZIONE POSIZIONE
    // ============================================================================
    
    const handlePositionSelect = async (position) => {
        try {
            setTimerActive(false);
            setGameState('loading');
            
            const timeElapsed = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
            
            console.log('🎯 Posizione selezionata:', position, 'Tempo:', timeElapsed);
            
            // Verifica gameCardId e aggiungi debug
            console.log('🎯 DEBUG targetCard completo:', JSON.stringify(targetCard, null, 2));
            console.log('🎯 gameId utilizzato:', gameId);
            console.log('🎯 gameCardId inviato:', targetCard.gameCardId);
            
            if (!targetCard?.gameCardId) {
                console.error('❌ GameCardId mancante!');
                throw new Error('Errore: ID carta mancante. Riavviando round...');
            }
            
            // Invia guess al server
            const result = await API.submitGameGuess(
                gameId,
                targetCard.gameCardId,
                position,
                timeElapsed
            );
            
            console.log('📊 Risultato guess:', result);
            console.log('🔍 STRUTTURA COMPLETA result:', JSON.stringify(result, null, 2));
            console.log('🔍 result.revealed_card:', result.revealed_card);
            console.log('🔍 result.targetCard:', result.targetCard);
            console.log('🔍 Tutte le chiavi in result:', Object.keys(result));
            
            // FIX: Gestisci diverse strutture di risposta
            const gameData = result.game || result.gameData || result;
            
            // Aggiorna stats di gioco - con fallback
            if (gameData.cards_collected !== undefined) {
                setCardsCollected(gameData.cards_collected);
            }
            if (gameData.wrong_guesses !== undefined) {
                setWrongGuesses(gameData.wrong_guesses);
            }
            if (gameData.current_round !== undefined) {
                setCurrentRound(gameData.current_round);
            }
            
            // Se ha indovinato, aggiungi la carta
            if (result.correct) {
                // Ottieni i dettagli della carta rivelata
                const revealedCard = result.revealed_card || result.targetCard || result.finalCard;
                
                if (revealedCard) {
                    const newCard = new CardModel(
                        revealedCard.id,
                        revealedCard.name,
                        revealedCard.image_url,
                        revealedCard.bad_luck_index,
                        revealedCard.theme
                    );
                    
                    const updatedCards = [...currentCards, newCard].sort((a, b) => a.bad_luck_index - b.bad_luck_index);
                    setCurrentCards(updatedCards);
                    
                    // Aggiorna target card con bad_luck_index rivelato
                    setTargetCard(prev => ({
                        ...prev,
                        bad_luck_index: revealedCard.bad_luck_index
                    }));
                } else {
                    console.warn('⚠️ Carta rivelata non trovata nella risposta');
                    // Usa il targetCard esistente senza bad_luck_index
                }
            } else {
                // Anche per risposte sbagliate, potremmo avere la carta rivelata
                const revealedCard = result.revealed_card || result.targetCard;
                if (revealedCard && revealedCard.bad_luck_index !== undefined) {
                    setTargetCard(prev => ({
                        ...prev,
                        bad_luck_index: revealedCard.bad_luck_index
                    }));
                }
            }
            
            // Imposta risultato del round
            setGameResult({
                isCorrect: result.correct,
                correctPosition: result.correct_position,
                guessedPosition: position,
                explanation: result.explanation || (result.correct ? 'Corretto!' : 'Sbagliato!')
            });
            
            // Controlla se partita completata - con struttura flessibile
            const gameStatus = gameData.status || result.gameStatus || result.status;
            if (gameStatus && gameStatus !== 'playing') {
                console.log('🏁 Partita completata:', gameStatus);
                clearCurrentGame();
            } else if (gameData.id) {
                updateCurrentGame(gameData);
            }
            
            setGameState('result');
            
        } catch (err) {
            console.error('❌ Errore submit guess:', err);
            setError(err.message || 'Errore nell\'invio della risposta');
            setGameState('playing');
            setTimerActive(true);
        }
    };
    
    // ============================================================================
    // GESTIONE TIMER
    // ============================================================================
    
    const handleTimeUp = () => {
        console.log('⏰ Tempo scaduto!');
        const randomPosition = Math.floor(Math.random() * (currentCards.length + 1));
        handlePositionSelect(randomPosition);
    };
    
    // ============================================================================
    // NAVIGAZIONE
    // ============================================================================
    
    const handleContinue = async () => {
        // Controlla se la partita è completata
        if (cardsCollected >= 6 || wrongGuesses >= 3) {
            setGameState('finished');
            return;
        }
        
        console.log('🔄 Continuando con prossimo round...');
        
        // SEMPRE resetta stato e richiedi nuova carta
        setGameState('loading');
        setTargetCard(null);
        setGameResult(null);
        setTimerActive(false);
        
        try {
            // IMPORTANTE: Richiedi sempre una nuova carta per il nuovo round
            await startNextRound(gameId);
        } catch (err) {
            console.error('❌ Errore continua:', err);
            setError('Errore nel caricamento del prossimo round');
            setGameState('error');
        }
    };
    
    const handleNewGame = async () => {
        console.log('🔄 Avviando nuova partita...');
        
        // Reset completo
        clearCurrentGame();
        resetAllState();
        
        // Ricrea partita
        await createAndStartNewGame();
    };
    
    const resetAllState = () => {
        setGameState('loading');
        setGameId(null);
        setCurrentCards([]);
        setTargetCard(null);
        setGameResult(null);
        setCurrentRound(1);
        setCardsCollected(0);
        setWrongGuesses(0);
        setTimerActive(false);
        setError('');
    };
    
    const handleBackHome = () => {
        navigate('/');
    };
    
    const handleAbandonGame = async () => {
        if (gameId) {
            try {
                await API.abandonGame(gameId);
                clearCurrentGame();
                setMessage({ type: 'info', msg: 'Partita abbandonata' });
            } catch (err) {
                console.error('❌ Errore abbandono:', err);
                setMessage({ type: 'error', msg: 'Errore nell\'abbandonare la partita' });
            }
        }
        handleBackHome();
    };
    
    // ============================================================================
    // GESTIONE ERRORI
    // ============================================================================
    
    const handleError = (err) => {
        console.error('❌ Gestendo errore:', err);
        setError(err.message || 'Errore sconosciuto');
        setGameState('error');
    };
    
    // ============================================================================
    // GESTIONE MODAL PARTITA ESISTENTE
    // ============================================================================
    
    const handleContinueExistingGame = async () => {
        setShowExistingGameModal(false);
        setLoading(true);
        setError('');
        
        try {
            const gameData = await API.getGameById(existingGameId);
            await loadExistingGame(gameData);
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleAbandonExistingGame = async () => {
        setShowExistingGameModal(false);
        setLoading(true);
        setError('');
        
        try {
            await API.abandonGame(existingGameId);
            clearCurrentGame();
            await createAndStartNewGame();
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
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
    
    if (gameState === 'error') {
        return (
            <Container>
                <Alert variant="danger" className="text-center">
                    <h4>Errore</h4>
                    <p>{error}</p>
                    <div className="d-flex gap-2 justify-content-center">
                        <Button variant="primary" onClick={handleBackHome}>
                            Torna alla Home
                        </Button>
                        <Button variant="secondary" onClick={() => window.location.reload()}>
                            Ricarica Pagina
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
                            onClick={handleAbandonGame}
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-arrow-left me-2"></i>
                            Abbandona Partita
                        </Button>
                        
                        <div className="text-center">
                            <h2 className="mb-1">
                                <i className="bi bi-controller me-2"></i>
                                Partita Completa
                            </h2>
                            <div className="d-flex gap-3 justify-content-center">
                                <Badge bg="primary">Round {currentRound}</Badge>
                                <Badge bg="success">Carte: {cardsCollected}/6</Badge>
                                <Badge bg="danger">Errori: {wrongGuesses}/3</Badge>
                            </div>
                        </div>
                        
                        <div style={{ width: '120px' }}></div>
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
                    
                    {/* Layout a due colonne */}
                    <Row className="mb-4">
                        <Col md={4}>
                            <div className="text-center mb-3">
                                <h4>Carta da Posizionare:</h4>
                            </div>
                            {targetCard && (
                                <CardDisplay 
                                    card={targetCard} 
                                    showBadLuckIndex={false}
                                    isTarget={true}
                                />
                            )}
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
                        </Col>
                    </Row>
                </>
            )}
            
            {/* Stato Result */}
            {gameState === 'result' && gameResult && (
                <RoundResult 
                    isCorrect={gameResult.isCorrect}
                    targetCard={targetCard}
                    correctPosition={gameResult.correctPosition}
                    guessedPosition={gameResult.guessedPosition}
                    allCards={currentCards}
                    onContinue={handleContinue}
                    onNewGame={handleNewGame}
                    isDemo={false}
                    gameCompleted={cardsCollected >= 6 || wrongGuesses >= 3}
                    gameWon={cardsCollected >= 6}
                />
            )}
            
            {/* Stato Finished */}
            {gameState === 'finished' && (
                <GameSummary 
                    gameWon={cardsCollected >= 6}
                    finalCards={currentCards}
                    totalRounds={currentRound}
                    cardsCollected={cardsCollected}
                    wrongGuesses={wrongGuesses}
                    onNewGame={handleNewGame}
                    onBackHome={handleBackHome}
                    isDemo={false}
                />
            )}
            
            {/* Modal partita esistente */}
            <Modal show={showExistingGameModal} onHide={() => setShowExistingGameModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Partita Esistente Trovata</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Hai già una partita in corso (ID: {existingGameId}). Cosa vuoi fare?</p>
                    <ul>
                        <li><strong>Continua:</strong> Riprendi la partita esistente</li>
                        <li><strong>Abbandona:</strong> Elimina la partita e iniziane una nuova</li>
                    </ul>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowExistingGameModal(false)}>
                        Annulla
                    </Button>
                    <Button variant="success" onClick={handleContinueExistingGame}>
                        <i className="bi bi-play-circle me-2"></i>
                        Continua Partita
                    </Button>
                    <Button variant="warning" onClick={handleAbandonExistingGame}>
                        <i className="bi bi-trash me-2"></i>
                        Abbandona e Crea Nuova
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default FullGameBoard;