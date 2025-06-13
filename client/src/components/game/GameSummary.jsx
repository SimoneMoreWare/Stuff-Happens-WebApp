import { Card, Row, Col, Button, Badge, Alert, ListGroup, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import CardDisplay from './CardDisplay.jsx';

function GameSummary({ 
    gameWon, 
    finalCards, 
    allGameCards,
    totalRounds,
    cardsCollected, 
    wrongGuesses,
    onNewGame, 
    onBackHome, 
    isDemo = false 
}) {
    const navigate = useNavigate();
    
    // ✅ FUNZIONE AGGIUNTA NEL POSTO GIUSTO
    const handleNewGameForCompletedGame = () => {
        // Per le partite completate, usa direttamente onNewGame 
        // che dovrebbe saltare i controlli di partita attiva
        if (onNewGame) {
            onNewGame();
        }
    };
    
    // ✅ CALCOLI INTELLIGENTI per demo vs full game
    const targetCards = isDemo ? 1 : 6;
    const maxErrors = isDemo ? 1 : 3;
    const precision = totalRounds > 0 ? Math.round(((totalRounds - wrongGuesses) / totalRounds) * 100) : 0;
    
    // ✅ SEPARAZIONE carte iniziali da carte vinte per partite complete
    const getCardsDisplay = () => {
        if (isDemo) {
            return {
                initialCards: finalCards?.slice(0, 3) || [],
                wonCards: finalCards?.slice(3) || [],
                allCards: finalCards || []
            };
        } else {
            // Partite complete: usa is_initial dal database
            if (allGameCards && allGameCards.length > 0) {
                const initialCards = allGameCards
                    .filter(card => card.is_initial)
                    .sort((a, b) => a.bad_luck_index - b.bad_luck_index);
                    
                const wonCards = allGameCards
                    .filter(card => !card.is_initial && card.guessed_correctly)
                    .sort((a, b) => a.bad_luck_index - b.bad_luck_index);
                    
                const allCards = [...initialCards, ...wonCards]
                    .sort((a, b) => a.bad_luck_index - b.bad_luck_index);
                    
                return { initialCards, wonCards, allCards };
            } else {
                return {
                    initialCards: finalCards?.slice(0, 3) || [],
                    wonCards: finalCards?.slice(3) || [],
                    allCards: finalCards || []
                };
            }
        }
    };
    
    const { initialCards, wonCards, allCards } = getCardsDisplay();
    
    const getMainTitle = () => {
        if (isDemo) {
            return gameWon ? 'Demo Completata! ⭐' : 'Demo Completata 📝';
        } else {
            return gameWon ? 'Vittoria! 🏆' : 'Partita Persa 💀';
        }
    };
    
    const getMainSubtitle = () => {
        if (isDemo) {
            return gameWon ? 
                'Ottimo! Hai capito come funziona il gioco.' : 
                'Adesso sai come si gioca. Prova ancora!';
        } else {
            return gameWon ? 
                'Congratulazioni! Hai dimostrato di essere un vero esperto del disastro!' : 
                'Peccato! I disastri della vita ti hanno sopraffatto questa volta.';
        }
    };
    
    return (
        <Container>
            {/* Header principale con risultato */}
            <Row className="justify-content-center mb-4">
                <Col md={10}>
                    <Card className="text-center shadow-lg border-0">
                        <Card.Header className={isDemo ? "bg-info text-white py-4" : gameWon ? "bg-success text-white py-4" : "bg-danger text-white py-4"}>
                            <h1 className="mb-2">{getMainTitle()}</h1>
                            <p className="mb-0 fs-5">{getMainSubtitle()}</p>
                        </Card.Header>
                    </Card>
                </Col>
            </Row>
            {/* Statistiche della partita */}
            <Row className="justify-content-center mb-4">
                <Col md={10}>
                    <Card className="shadow">
                        <Card.Header className="bg-light">
                            <h4 className="mb-0">
                                <i className="bi bi-graph-up me-2"></i>
                                {isDemo ? 'Statistiche Demo' : 'Statistiche Partita'}
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            <Row className="text-center">
                                <Col md={3}>
                                    <div className="p-3">
                                        <h3 className="text-primary">{totalRounds}</h3>
                                        {isDemo ? 'Round Demo' : 'Round Giocati'}
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="p-3">
                                        <h3 className="text-success">{cardsCollected}</h3>
                                        Carte Raccolte
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="p-3">
                                        <h3 className="text-danger">{wrongGuesses}</h3>
                                        {isDemo ? 'Errori Demo' : 'Errori Commessi'}
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="p-3">
                                        <h3 className="text-info">{precision}%</h3>
                                        Precisione
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            {/* ✅ SEZIONE CARTE - CORRETTA */}
            <Row className="justify-content-center mb-4">
                <Col md={10}>
                    <Card className="shadow">
                        <Card.Header className="bg-light">
                            <h4 className="mb-0">
                                <i className="bi bi-collection me-2"></i>
                                {isDemo ? 'Carte in Tuo Possesso' : 'Le Tue Carte'} ({allCards.length})
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            {isDemo ? (
                                /* DEMO: Comportamento originale */
                                <>
                                    <Alert variant="info" className="mb-3">
                                        Ecco tutte le carte che possiedi al termine della demo:
                                    </Alert>
                                    <Row className="justify-content-center g-3">
                                        {allCards.map((card, index) => {
                                            const isInitialCard = index < 3;
                                            const isTargetCard = index === 3;
                                            
                                            return (
                                                <Col key={`demo-card-${card.id}`} xs={6} md={4} lg={3}>
                                                    <div className="text-center">
                                                        {isInitialCard ? (
                                                            <Badge bg="secondary" className="mb-2">
                                                                <i className="bi bi-card-list me-1"></i>
                                                                Carta Iniziale #{index + 1}
                                                            </Badge>
                                                        ) : isTargetCard ? (
                                                            <Badge bg="success" className="mb-2">
                                                                <i className="bi bi-trophy me-1"></i>
                                                                Carta Vinta!
                                                            </Badge>
                                                        ) : (
                                                            <Badge bg="primary" className="mb-2">#{index + 1}</Badge>
                                                        )}
                                                    </div>
                                                    <CardDisplay card={card} showBadLuckIndex={true} fixedHeight={true} />
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                </>
                            ) : (
                                /* ✅ PARTITE COMPLETE: VERSIONE CORRETTA */
                                <>
                                    <Alert variant="info" className="mb-3">
                                        Ecco tutte le tue carte ordinate per Bad Luck Index crescente. 
                                        Le carte marcate come "Iniziali" erano quelle di partenza, 
                                        le altre le hai vinte durante i round.
                                    </Alert>
                                    <Row className="justify-content-center g-3">
                                        {allCards.map((card, index) => {
                                            // ✅ Usa i dati reali da allGameCards
                                            const gameCard = allGameCards ? 
                                                allGameCards.find(gc => gc.id === card.id) : null;
                                            const isInitialCard = gameCard?.is_initial || false;
                                            const cardRound = gameCard?.round_number;
                                            
                                            return (
                                                <Col key={`game-card-${card.id}`} xs={6} md={4} lg={3} className='pb-4'>
                                                    <div className="text-center">
                                                        {isInitialCard ? (
                                                            <Badge bg="secondary" className="mb-2">
                                                                <i className="bi bi-card-list me-1"></i>
                                                                Iniziale
                                                            </Badge>
                                                        ) : (
                                                            <Badge bg="success" className="mb-2">
                                                                <i className="bi bi-trophy me-1"></i>
                                                                {cardRound ? `Round ${cardRound}` : 'Vinta'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <CardDisplay card={card} showBadLuckIndex={true} fixedHeight={true} />
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                    
                                    <div className="mt-4 pt-4 text-center">
                                        <small className="text-muted">
                                            <i className="bi bi-info-circle me-2"></i>
                                            <strong>Totale:</strong> {allCards.length} carte • 
                                            <strong className="text-secondary ms-2">Iniziali:</strong> {initialCards.length} • 
                                            <strong className="text-success ms-2">Vinte:</strong> {wonCards.length}
                                        </small>
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            {/* Analisi delle performance */}
            <Row className="justify-content-center mb-4">
                <Col md={10}>
                    <Card className="shadow">
                        <Card.Header className="bg-light">
                            <h4 className="mb-0">
                                <i className="bi bi-analytics me-2"></i>
                                {isDemo ? 'Come Hai Performato' : 'Analisi delle Performance'}
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            {isDemo ? (
                                <div>
                                    {gameWon ? (
                                        <>
                                            <Alert variant="success" className="mb-3">
                                                Perfetto! Hai capito il meccanismo del gioco al primo tentativo.
                                            </Alert>
                                            <ListGroup variant="flush">
                                                <ListGroup.Item className="border-0">
                                                    <i className="bi bi-check-circle text-success me-2"></i>
                                                    Hai indovinato la posizione corretta
                                                </ListGroup.Item>
                                                <ListGroup.Item className="border-0">
                                                    <i className="bi bi-check-circle text-success me-2"></i>
                                                    Hai compreso il sistema del Bad Luck Index
                                                </ListGroup.Item>
                                                <ListGroup.Item className="border-0">
                                                    <i className="bi bi-check-circle text-success me-2"></i>
                                                    Sei pronto per una partita completa!
                                                </ListGroup.Item>
                                            </ListGroup>
                                        </>
                                    ) : (
                                        <>
                                            <Alert variant="info" className="mb-3">
                                                Nessun problema! Il gioco richiede un po' di pratica per capire come valutare i disastri.
                                            </Alert>
                                            <ListGroup variant="flush">
                                                <ListGroup.Item className="border-0">
                                                    <i className="bi bi-info-circle text-info me-2"></i>
                                                    Ora conosci il meccanismo del gioco
                                                </ListGroup.Item>
                                                <ListGroup.Item className="border-0">
                                                    <i className="bi bi-lightbulb text-warning me-2"></i>
                                                    Consiglio: Fai attenzione alle immagini e al nome della situazione
                                                </ListGroup.Item>
                                                <ListGroup.Item className="border-0">
                                                    <i className="bi bi-arrow-repeat text-primary me-2"></i>
                                                    Prova di nuovo o registrati per partite complete!
                                                </ListGroup.Item>
                                            </ListGroup>
                                        </>
                                    )}
                                </div>
                            ) : gameWon ? (
                                <div>
                                    <Alert variant="success" className="mb-3">
                                        Eccellente! Hai dimostrato una perfetta comprensione 
                                        della scala dei disastri della vita.
                                    </Alert>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item className="border-0">
                                            <i className="bi bi-check-circle text-success me-2"></i>
                                            Hai raccolto tutte e 6 le carte necessarie
                                        </ListGroup.Item>
                                        <ListGroup.Item className="border-0">
                                            <i className="bi bi-check-circle text-success me-2"></i>
                                            Hai mantenuto gli errori sotto il limite di 3
                                        </ListGroup.Item>
                                        <ListGroup.Item className="border-0">
                                            <i className="bi bi-check-circle text-success me-2"></i>
                                            La tua precisione è stata del {precision}%
                                        </ListGroup.Item>
                                    </ListGroup>
                                </div>
                            ) : (
                                <div>
                                    <Alert variant="warning" className="mb-3">
                                        Non scoraggiarti! Interpretare i disastri è più difficile di quanto sembri.
                                    </Alert>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item className="border-0">
                                            <i className="bi bi-info-circle text-info me-2"></i>
                                            Hai raccolto {cardsCollected} carte su 6 necessarie
                                        </ListGroup.Item>
                                        <ListGroup.Item className="border-0">
                                            <i className="bi bi-x-circle text-danger me-2"></i>
                                            Hai commesso {wrongGuesses} errori (limite: 3)
                                        </ListGroup.Item>
                                        <ListGroup.Item className="border-0">
                                            <i className="bi bi-lightbulb text-warning me-2"></i>
                                            Consiglio: Presta più attenzione alle immagini e ai dettagli del nome delle situazioni
                                        </ListGroup.Item>
                                    </ListGroup>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            {/* Pulsanti di azione finale */}
            <Row className="mt-4 mb-4 pb-4 justify-content-center align-items-center">
                <Col md={10}>
                    <Card className="text-center shadow-sm">
                        <Card.Body>
                            <h5 className="text-secondary mb-3">
                                <i className="bi bi-question-circle me-2"></i>
                                Cosa vuoi fare ora?
                            </h5>
                            <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                                <Button 
                                    variant={isDemo ? "success" : (gameWon ? "success" : "primary")}
                                    size="lg"
                                    onClick={isDemo ? onNewGame : handleNewGameForCompletedGame}
                                    className="d-flex align-items-center justify-content-center"
                                >
                                    <i className={`bi ${isDemo ? 'bi-arrow-repeat' : (gameWon ? 'bi-trophy' : 'bi-arrow-clockwise')} me-2`}></i>
                                    {isDemo ? 'Nuova Demo' : (gameWon ? 'Nuova Sfida' : 'Riprova')}
                                </Button>
                                {!isDemo && (
                                    <Button 
                                        variant="outline-info" 
                                        size="lg"
                                        onClick={() => navigate('/profile')}
                                        className="d-flex align-items-center justify-content-center"
                                    >
                                        <i className="bi bi-person-circle me-2"></i>
                                        Vai al Profilo
                                    </Button>
                                )}
                                <Button 
                                    variant="outline-secondary" 
                                    size="lg"
                                    onClick={onBackHome}
                                    className="d-flex align-items-center justify-content-center"
                                >
                                    <i className="bi bi-house me-2"></i>
                                    Torna alla Home
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default GameSummary;