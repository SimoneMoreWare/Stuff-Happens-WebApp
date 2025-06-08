import { Container, Row, Col, Card, Alert, Button, Badge } from 'react-bootstrap';
import CardDisplay from './CardDisplay.jsx';

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
    
    // ✅ CALCOLI E LOGICA
    const getResultTitle = () => {
        if (isTimeout) {
            return isDemo ? 'Tempo Scaduto!' : 'Tempo Scaduto!';
        }
        return isCorrect ? 'Carta Vinta!' : 'Carta Persa!';
    };
    
    const getResultMessage = () => {
        if (isTimeout) {
            return isDemo ? 
                'Il tempo è scaduto prima che tu potessi posizionare la carta.' :
                'Il tempo è scaduto! Hai perso questa carta e accumulato un errore.';
        }
        
        if (isCorrect) {
            return isDemo ?
                'Perfetto! Hai capito come funziona il gioco e vinto la carta.' :
                'Ottimo lavoro! Hai posizionato correttamente la carta e l\'hai aggiunta alla tua collezione.';
        } else {
            return isDemo ?
                'Non è la posizione corretta, ma ora sai come funziona il gioco!' :
                'Peccato! La posizione non era corretta. Hai perso questa carta e accumulato un errore.';
        }
    };
    
    const getAlertVariant = () => {
        if (isTimeout) return 'warning';
        return isCorrect ? 'success' : 'danger';
    };
    
    return (
        <Container className="py-4">
            {/* ✅ PULSANTE CONTINUA IN CIMA - SOLO PER PARTITE COMPLETE NON DEMO */}
            {!isDemo && !gameCompleted && (
                <Row className="mb-4">
                    <Col className="text-center">
                        <Card className="bg-primary text-white shadow-lg">
                            <Card.Body className="py-3">
                                <h5 className="mb-3">Pronto per il prossimo round?</h5>
                                <Button 
                                    variant="light" 
                                    size="lg"
                                    onClick={onContinue}
                                    className="d-flex align-items-center mx-auto"
                                >
                                    <i className="bi bi-arrow-right me-2"></i>
                                    Continua al Prossimo Round
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* ✅ RISULTATO PRINCIPALE */}
            <Row className="mb-4">
                <Col className="text-center">
                    <Alert variant={getAlertVariant()} className="shadow-lg">
                        <div className="display-4 mb-3">
                            {isTimeout ? '⏰' : isCorrect ? '🥳' : '😢'}
                        </div>
                        <h2 className="mb-3">{getResultTitle()}</h2>
                        <p className="lead mb-0">{getResultMessage()}</p>
                    </Alert>
                </Col>
            </Row>
            
            {/* ✅ CARTA COINVOLTA - SOLO SE VINTA */}
            {isCorrect && targetCard && (
                <Row className="mb-4">
                    <Col className="text-center">
                        <h4 className="mb-3">
                            <i className="bi bi-card-heading me-2"></i>
                            Carta Vinta
                        </h4>
                        
                        <div className="d-flex justify-content-center">
                            <div className="text-center">
                                <div className="mb-2">
                                    <Badge bg="success">VINTA</Badge>
                                </div>
                                <div style={{ width: '200px', maxWidth: '100%' }}>
                                    <CardDisplay 
                                        card={targetCard}
                                        showBadLuckIndex={true} // ✅ Solo se vinta
                                        className="shadow"
                                    />
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            )}
            
            {/* ✅ SPIEGAZIONE - SOLO SE VINTA */}
            {isCorrect && targetCard && (
                <Row className="mb-4">
                    <Col md={10} className="mx-auto">
                        <Card className="border-success">
                            <Card.Header className="bg-success text-white">
                                <h5 className="mb-0">
                                    <i className="bi bi-lightbulb me-2"></i>
                                    Ottimo Lavoro!
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="mb-3">
                                    <strong>La tua scelta:</strong> Posizione {guessedPosition}
                                    <br />
                                    <strong>Era corretta!</strong> La carta "{targetCard.name}" ha Bad Luck Index {targetCard.bad_luck_index}.
                                </div>
                                
                                <div className="mt-3 p-3 bg-light rounded">
                                    <small className="text-muted">
                                        <i className="bi bi-trophy me-2"></i>
                                        <strong>Bene!</strong> Continua così e osserva attentamente le immagini e i nomi delle situazioni!
                                    </small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
            
            {/* ✅ MESSAGGIO GENERICO SE PERSA - NESSUN DETTAGLIO */}
            {!isCorrect && !isTimeout && (
                <Row className="mb-4">
                    <Col md={10} className="mx-auto">
                        <Card className="border-danger">
                            <Card.Header className="bg-danger text-white">
                                <h5 className="mb-0">
                                    <i className="bi bi-x-circle me-2"></i>
                                    Non Scoraggiarti!
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="mb-3">
                                    <strong>La tua scelta:</strong> Posizione {guessedPosition}
                                    <br />
                                    <strong>Non era corretta.</strong> Hai perso questa carta.
                                </div>
                                
                                <div className="mt-3 p-3 bg-light rounded">
                                    <small className="text-muted">
                                        <i className="bi bi-lightbulb me-2"></i>
                                        <strong>Consiglio:</strong> Osserva attentamente le immagini e pensa a quanto gravi siano le situazioni rispetto a quelle che hai già!
                                    </small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
            
            {/* ✅ MESSAGGIO GENERICO SE TIMEOUT - NESSUN DETTAGLIO */}
            {isTimeout && (
                <Row className="mb-4">
                    <Col md={10} className="mx-auto">
                        <Card className="border-warning">
                            <Card.Header className="bg-warning text-dark">
                                <h5 className="mb-0">
                                    <i className="bi bi-clock me-2"></i>
                                    Tempo Scaduto
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="mb-3">
                                    Il tempo di 30 secondi è scaduto prima che tu potessi fare una scelta.
                                </div>
                                
                                <div className="mt-3 p-3 bg-light rounded">
                                    <small className="text-muted">
                                        <i className="bi bi-stopwatch me-2"></i>
                                        <strong>Suggerimento:</strong> Cerca di essere più veloce nella prossima volta!
                                    </small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
            
            {/* ✅ ORDINE FINALE DELLE CARTE - SOLO PER DEMO quando vinci */}
            {isDemo && isCorrect && allCards && allCards.length > 0 && (
                <Row className="mb-4">
                    <Col>
                        <Card className="border-success">
                            <Card.Header className="bg-success text-white">
                                <h5 className="mb-0">
                                    <i className="bi bi-collection me-2"></i>
                                    Le Tue Carte Attuali
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <p className="text-muted mb-3">
                                    Ecco come sono ordinate le tue carte dopo questo round:
                                </p>
                                <Row className="g-3">
                                    {allCards
                                        .sort((a, b) => a.bad_luck_index - b.bad_luck_index)
                                        .map((card, index) => {
                                            // ✅ NUOVO: Determina se è carta iniziale o vinta
                                            const isWonCard = card.id === targetCard?.id;
                                            
                                            return (
                                                <Col key={card.id} md={3} lg={2} className="text-center">
                                                    <div className="mb-2">
                                                        {isWonCard ? (
                                                            <Badge bg="success">
                                                                <i className="bi bi-trophy-fill me-1"></i>
                                                                Vinta!
                                                            </Badge>
                                                        ) : (
                                                            <Badge bg="info">
                                                                <i className="bi bi-circle-fill me-1"></i>
                                                                Iniziale
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <CardDisplay 
                                                        card={card}
                                                        showBadLuckIndex={true}
                                                        className={`h-100 ${isWonCard ? 'border-success border-2' : 'border-info'}`}
                                                        style={{ maxHeight: '200px' }}
                                                    />
                                                </Col>
                                            );
                                        })}
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
            
            {/* ✅ PULSANTI DI AZIONE - GESTIONE DEMO vs FULL GAME */}
            <Row>
                <Col className="text-center">
                    <Card className="bg-body-secondary">
                        <Card.Body className="p-4">
                            <h4 className="mb-3">Cosa vuoi fare ora?</h4>
                            
                            {/* ✅ GESTIONE SPECIFICA PER DEMO */}
                            {isDemo && (
                                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                                    <Button 
                                        variant="primary" 
                                        size="lg" 
                                        onClick={onNewGame}
                                        className="d-flex align-items-center"
                                    >
                                        <i className="bi bi-arrow-repeat me-2"></i>
                                        Nuova Demo
                                    </Button>
                                    
                                    <Button 
                                        variant="outline-primary" 
                                        size="lg"
                                        href="/login"
                                        className="d-flex align-items-center"
                                    >
                                        <i className="bi bi-person-plus me-2"></i>
                                        Registrati per Partite Complete
                                    </Button>
                                    
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
                            )}
                            
                            {/* ✅ GESTIONE PER PARTITE COMPLETE */}
                            {!isDemo && (
                                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                                    {/* Se partita COMPLETATA = vai al riepilogo finale */}
                                    {gameCompleted && (
                                        <Button 
                                            variant="primary" 
                                            size="lg"
                                            onClick={onContinue}
                                            className="d-flex align-items-center"
                                        >
                                            <i className="bi bi-eye me-2"></i>
                                            Vedi Riepilogo Finale
                                        </Button>
                                    )}
                                    
                                    {/* Sempre presenti per partite complete */}
                                    <Button 
                                        variant="outline-primary" 
                                        size="lg"
                                        onClick={onNewGame}
                                        className="d-flex align-items-center"
                                    >
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Nuova Partita
                                    </Button>
                                    
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
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            {/* ✅ MESSAGGIO PROMOZIONALE PER DEMO */}
            {isDemo && (
                <Row className="mt-4">
                    <Col>
                        <Alert variant={isCorrect ? 'success' : 'info'} className="text-center">
                            <h5 className="alert-heading">
                                <i className="bi bi-star me-2"></i>
                                {isCorrect ? 'Complimenti! Hai talento per questo gioco!' : 'Vuoi migliorare?'}
                            </h5>
                            <p className="mb-3">
                                {isCorrect ? 
                                    'Hai dimostrato di capire il meccanismo. Registrati per giocare partite complete con 6 carte e tenere traccia dei tuoi progressi!' :
                                    'Questa era solo un\'anteprima! Registrati per giocare partite complete e perfezionare le tue abilità.'
                                }
                            </p>
                            <Button variant={isCorrect ? 'success' : 'primary'} href="/login" size="lg">
                                <i className="bi bi-person-plus me-2"></i>
                                Registrati Ora
                            </Button>
                        </Alert>
                    </Col>
                </Row>
            )}
        </Container>
    );
}

export default RoundResult;