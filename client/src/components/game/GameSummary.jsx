import { Card, Row, Col, Button, Badge, Alert, ListGroup } from 'react-bootstrap';
import CardDisplay from './CardDisplay.jsx';

function GameSummary({ 
    gameWon, 
    finalCards, 
    allInvolvedCards, // ✅ NUOVO: tutte le carte coinvolte (per demo)
    totalRounds, 
    cardsCollected, 
    wrongGuesses,
    onNewGame, 
    onBackHome, 
    isDemo = false 
}) {
    
    // ✅ CALCOLI INTELLIGENTI per demo vs full game
    const targetCards = isDemo ? 1 : 6;
    const maxErrors = isDemo ? 1 : 3; // Demo ha massimo 1 errore possibile
    const precision = totalRounds > 0 ? Math.round(((totalRounds - wrongGuesses) / totalRounds) * 100) : 0;
    
    // ✅ TITOLI DINAMICI
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
        <div className="game-summary">
            {/* ✅ Header principale con risultato */}
            <Row className="mb-5">
                <Col className="text-center">
                    <div className={`display-3 mb-3 ${gameWon ? 'text-success' : (isDemo ? 'text-warning' : 'text-danger')}`}>
                        {isDemo ? (
                            <i className="bi bi-controller"></i>
                        ) : gameWon ? (
                            <i className="bi bi-trophy-fill"></i>
                        ) : (
                            <i className="bi bi-emoji-frown"></i>
                        )}
                    </div>
                    <h1 className={`display-4 fw-bold ${gameWon ? 'text-success' : (isDemo ? 'text-warning' : 'text-danger')}`}>
                        {getMainTitle()}
                    </h1>
                    <p className="lead text-muted mb-4">
                        {getMainSubtitle()}
                    </p>
                </Col>
            </Row>

            {/* ✅ Statistiche della partita */}
            <Row className="mb-5">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className={`${gameWon ? 'bg-success' : (isDemo ? 'bg-warning text-dark' : 'bg-danger')} text-white text-center`}>
                            <h4 className="mb-0">
                                <i className="bi bi-graph-up me-2"></i>
                                {isDemo ? 'Statistiche Demo' : 'Statistiche Partita'}
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            <Row className="text-center">
                                <Col md={3} className="mb-3">
                                    <div className="bg-body-secondary rounded p-3">
                                        <div className="display-6 text-primary mb-1">{totalRounds}</div>
                                        <small className="text-muted">{isDemo ? 'Round Demo' : 'Round Giocati'}</small>
                                    </div>
                                </Col>
                                <Col md={3} className="mb-3">
                                    <div className="bg-body-secondary rounded p-3">
                                        <div className="display-6 text-success mb-1">{cardsCollected}</div>
                                        <small className="text-muted">Carte Raccolte</small>
                                    </div>
                                </Col>
                                <Col md={3} className="mb-3">
                                    <div className="bg-body-secondary rounded p-3">
                                        <div className="display-6 text-danger mb-1">{wrongGuesses}</div>
                                        <small className="text-muted">{isDemo ? 'Errori Demo' : 'Errori Commessi'}</small>
                                    </div>
                                </Col>
                                <Col md={3} className="mb-3">
                                    <div className="bg-body-secondary rounded p-3">
                                        <div className="display-6 text-warning mb-1">{precision}%</div>
                                        <small className="text-muted">Precisione</small>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ✅ IMPORTANTE: Carte raccolte/coinvolte - SEMPRE MOSTRATE secondo specifiche */}
            <Row className="mb-5">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-primary text-white">
                            <h4 className="mb-0">
                                <i className="bi bi-collection me-2"></i>
                                {isDemo ? 'Carte Coinvolte nella Demo' : 'Le Tue Carte'} ({isDemo && allInvolvedCards ? allInvolvedCards.length : finalCards.length})
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            {/* ✅ DEMO: Mostra tutte le carte coinvolte */}
                            {isDemo && allInvolvedCards && allInvolvedCards.length > 0 ? (
                                <>
                                    <p className="text-muted mb-4">
                                        Ecco tutte le carte coinvolte nella demo:
                                    </p>
                                    <Row className="g-3 mb-4 pb-4">
                                        {allInvolvedCards.map((card, index) => {
                                            // ✅ Determina se è una carta iniziale o la carta target
                                            const isInitialCard = index < 3;
                                            const isTargetCard = index === 3;
                                            const wasWon = finalCards.some(wonCard => wonCard.id === card.id);
                                            
                                            return (
                                                <Col key={card.id} md={6} lg={3}>
                                                    <div className="text-center mb-2">
                                                        {isInitialCard ? (
                                                            <Badge bg="info">Carta Iniziale #{index + 1}</Badge>
                                                        ) : isTargetCard ? (
                                                            <Badge bg={wasWon ? 'success' : 'danger'}>
                                                                Carta Target {wasWon ? '(Vinta)' : '(Persa)'}
                                                            </Badge>
                                                        ) : (
                                                            <Badge bg="secondary">#{index + 1}</Badge>
                                                        )}
                                                    </div>
                                                    <CardDisplay 
                                                        card={card} 
                                                        showBadLuckIndex={true}
                                                        className={`h-100 ${isTargetCard ? (wasWon ? 'border-success' : 'border-danger') : 'border-info'}`}
                                                    />
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                    
                                    {/* ✅ SPIEGAZIONE PER DEMO */}
                                    <Alert variant="info" className="mt-4 pt-4">
                                        <h6 className="alert-heading">
                                            <i className="bi bi-info-circle me-2"></i>
                                            Spiegazione Demo
                                        </h6>
                                        <p className="mb-0">
                                            <strong>Carte Iniziali:</strong> Le prime 3 carte che avevi in possesso all'inizio, ordinate per Bad Luck Index crescente.<br/>
                                            <strong>Carta Target:</strong> La carta che dovevi posizionare. {gameWon ? 'L\'hai vinta indovinando la posizione corretta!' : 'Non sei riuscito a indovinare la posizione corretta.'}
                                        </p>
                                    </Alert>
                                </>
                            ) : 
                            /* ✅ PARTITE COMPLETE: Comportamento originale */
                            finalCards && finalCards.length > 0 ? (
                                <>
                                    <p className="text-muted mb-4">
                                        Ecco tutte le carte che sei riuscito a raccogliere, ordinate dal Bad Luck Index più basso al più alto:
                                    </p>
                                    <Row className="g-3">
                                        {finalCards.map((card, index) => (
                                            <Col key={card.id} md={4} lg={3}>
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
                                </>
                            ) : (
                                // ✅ IMPORTANTE: Anche se 0 carte, mostra il riepilogo come da specifiche
                                <div className="text-center py-5">
                                    <div className="display-1 text-muted mb-3">
                                        <i className="bi bi-collection"></i>
                                    </div>
                                    <h5 className="text-muted mb-3">Nessuna Carta Raccolta</h5>
                                    <p className="text-muted mb-0">
                                        {isDemo ? 
                                            'Non sei riuscito a indovinare la posizione corretta nella demo.' :
                                            'Non sei riuscito a raccogliere nessuna carta in questa partita.'
                                        }
                                    </p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ✅ Analisi delle performance */}
            <Row className="mb-5">
                <Col>
                    <Alert variant={gameWon ? 'success' : (isDemo && !gameWon ? 'info' : 'warning')} className="mb-4">
                        <h5 className="alert-heading">
                            <i className="bi bi-lightbulb me-2"></i>
                            {isDemo ? 'Come Hai Performato' : 'Analisi delle Performance'}
                        </h5>
                        
                        {isDemo ? (
                            // ✅ MESSAGGI SPECIFICI PER DEMO
                            <div>
                                {gameWon ? (
                                    <>
                                        <p className="mb-2">
                                            <strong>Perfetto!</strong> Hai capito il meccanismo del gioco al primo tentativo.
                                        </p>
                                        <ListGroup variant="flush" className="bg-transparent">
                                            <ListGroup.Item className="bg-transparent px-0">
                                                <i className="bi bi-check-circle text-success me-2"></i>
                                                Hai indovinato la posizione corretta
                                            </ListGroup.Item>
                                            <ListGroup.Item className="bg-transparent px-0">
                                                <i className="bi bi-check-circle text-success me-2"></i>
                                                Hai compreso il sistema del Bad Luck Index
                                            </ListGroup.Item>
                                            <ListGroup.Item className="bg-transparent px-0">
                                                <i className="bi bi-star text-warning me-2"></i>
                                                Sei pronto per una partita completa!
                                            </ListGroup.Item>
                                        </ListGroup>
                                    </>
                                ) : (
                                    <>
                                        <p className="mb-2">
                                            <strong>Nessun problema!</strong> Il gioco richiede un po' di pratica per capire come valutare i disastri.
                                        </p>
                                        <ListGroup variant="flush" className="bg-transparent">
                                            <ListGroup.Item className="bg-transparent px-0">
                                                <i className="bi bi-info-circle text-primary me-2"></i>
                                                Ora conosci il meccanismo del gioco
                                            </ListGroup.Item>
                                            <ListGroup.Item className="bg-transparent px-0">
                                                <i className="bi bi-lightbulb text-warning me-2"></i>
                                                <strong>Consiglio:</strong> Fai attenzione alle immagini e al nome della situazione
                                            </ListGroup.Item>
                                            <ListGroup.Item className="bg-transparent px-0">
                                                <i className="bi bi-arrow-repeat text-info me-2"></i>
                                                Prova di nuovo o registrati per partite complete!
                                            </ListGroup.Item>
                                        </ListGroup>
                                    </>
                                )}
                            </div>
                        ) : gameWon ? (
                            // ✅ MESSAGGI PER PARTITA COMPLETA VINTA
                            <div>
                                <p className="mb-2">
                                    <strong>Eccellente!</strong> Hai dimostrato una perfetta comprensione 
                                    della scala dei disastri della vita.
                                </p>
                                <ListGroup variant="flush" className="bg-transparent">
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        Hai raccolto tutte e 6 le carte necessarie
                                    </ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        Hai mantenuto gli errori sotto il limite di 3
                                    </ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        La tua precisione è stata del {precision}%
                                    </ListGroup.Item>
                                </ListGroup>
                            </div>
                        ) : (
                            // ✅ MESSAGGI PER PARTITA COMPLETA PERSA
                            <div>
                                <p className="mb-2">
                                    <strong>Non scoraggiarti!</strong> Interpretare i disastri è più difficile di quanto sembri.
                                </p>
                                <ListGroup variant="flush" className="bg-transparent">
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-info-circle text-primary me-2"></i>
                                        Hai raccolto {cardsCollected} carte su 6 necessarie
                                    </ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-info-circle text-primary me-2"></i>
                                        Hai commesso {wrongGuesses} errori (limite: 3)
                                    </ListGroup.Item>
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-lightbulb text-warning me-2"></i>
                                        <strong>Consiglio:</strong> Presta più attenzione alle immagini e ai dettagli del nome delle situazioni
                                    </ListGroup.Item>
                                </ListGroup>
                            </div>
                        )}
                    </Alert>
                </Col>
            </Row>

            {/* ✅ Pulsanti di azione finale */}
            <Row>
                <Col>
                    <Card className="bg-body-secondary text-center">
                        <Card.Body className="p-4">
                            <h4 className="mb-3">Cosa vuoi fare ora?</h4>
                            <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                                <Button 
                                    variant="primary" 
                                    size="lg" 
                                    onClick={onNewGame}
                                    className="d-flex align-items-center"
                                >
                                    <i className="bi bi-arrow-repeat me-2"></i>
                                    {isDemo ? 'Nuova Demo' : (gameWon ? 'Nuova Sfida' : 'Riprova')}
                                </Button>
                                
                                {!isDemo && (
                                    <Button 
                                        variant="outline-primary" 
                                        size="lg"
                                        href="/profile"
                                        className="d-flex align-items-center"
                                    >
                                        <i className="bi bi-person-lines-fill me-2"></i>
                                        Vai al Profilo
                                    </Button>
                                )}
                                
                                <Button 
                                    variant="outline-secondary" 
                                    size="lg"
                                    onClick={onBackHome}
                                    className="d-flex align-items-center"
                                >
                                    <i className="bi bi-house me-2"></i>
                                    Torna alla Home
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ✅ MODIFICATO: Messaggio per utenti demo */}
            {isDemo && (
                <Row className="mt-4">
                    <Col>
                        <Alert variant="success" className="text-center">
                            <h5 className="alert-heading">
                                <i className="bi bi-star me-2"></i>
                                Ti è piaciuto il gioco?
                            </h5>
                            <p className="mb-3">
                                {gameWon ? 
                                    'Complimenti! Hai il talento per questo gioco. Registrati per giocare partite complete con 6 carte e tenere traccia dei tuoi progressi.' :
                                    'Questa era solo un\'anteprima! Registrati per giocare partite complete e migliorare le tue abilità.'
                                }
                            </p>
                            <Button variant="success" href="/login" size="lg">
                                <i className="bi bi-person-plus me-2"></i>
                                Registrati Ora
                            </Button>
                        </Alert>
                    </Col>
                </Row>
            )}
        </div>
    );
}

export default GameSummary;