import React from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, ListGroup } from 'react-bootstrap';
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
    
    // ✅ LOGIC per determinare i messaggi e azioni secondo le specifiche del prof
    const getMainMessage = () => {
        if (isDemo) {
            if (isTimeout) {
                return {
                    title: "Tempo Scaduto! ⏰",
                    subtitle: "Non hai fatto in tempo a posizionare la carta",
                    variant: "warning"
                };
            }
            return {
                title: isCorrect ? "Perfetto! ⭐" : "Non Proprio! 📝",
                subtitle: isCorrect ? 
                    "Hai capito come funziona il gioco!" : 
                    "Adesso sai come si gioca. Prova ancora!",
                variant: isCorrect ? "success" : "info"
            };
        } else {
            // Partita completa
            if (isTimeout) {
                return {
                    title: "Tempo Scaduto! ⏰",
                    subtitle: `Round ${isCorrect ? 'vinto' : 'perso'} - Tempo scaduto`,
                    variant: "warning"
                };
            }
            
            if (gameCompleted) {
                return {
                    title: gameWon ? "Partita Vinta! 🏆" : "Partita Persa 💀",
                    subtitle: gameWon ? 
                        "Congratulazioni! Hai completato la sfida!" : 
                        "Peccato! Hai raggiunto il limite di errori.",
                    variant: gameWon ? "success" : "danger"
                };
            } else {
                return {
                    title: isCorrect ? "Round Vinto! ⭐" : "Round Perso 📝",
                    subtitle: isCorrect ? 
                        "Ottimo! Continua così." : 
                        "Non scoraggiarti, continua a giocare!",
                    variant: isCorrect ? "success" : "warning"
                };
            }
        }
    };
    
    const message = getMainMessage();
    
    // ✅ DETERMINA i pulsanti da mostrare secondo il prof
    const getActionButtons = () => {
        if (isDemo) {
            // Demo: solo "Nuova Demo" e "Torna alla Home" secondo prof
            return (
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
                        variant="outline-secondary" 
                        size="lg"
                        onClick={onBackHome}
                        className="d-flex align-items-center"
                    >
                        <i className="bi bi-house me-2"></i>
                        Torna alla Home
                    </Button>
                </div>
            );
        } else {
            // Partita completa: logica esistente
            if (gameCompleted) {
                return (
                    <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                        <Button 
                            variant="primary" 
                            size="lg" 
                            onClick={onContinue}
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-list-check me-2"></i>
                            Mostra Riepilogo
                        </Button>
                        
                        <Button 
                            variant="outline-primary" 
                            size="lg"
                            onClick={onNewGame}
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-arrow-repeat me-2"></i>
                            Nuova Partita
                        </Button>
                        
                        <Button 
                            variant="outline-secondary" 
                            size="lg"
                            onClick={onBackHome}
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-house me-2"></i>
                            Home
                        </Button>
                    </div>
                );
            } else {
                return (
                    <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                        <Button 
                            variant="primary" 
                            size="lg" 
                            onClick={onContinue}
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-play-fill me-2"></i>
                            Continua Partita
                        </Button>
                        
                        <Button 
                            variant="outline-primary" 
                            size="lg"
                            onClick={onNewGame}
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-arrow-repeat me-2"></i>
                            Nuova Partita
                        </Button>
                        
                        <Button 
                            variant="outline-secondary" 
                            size="lg"
                            onClick={onBackHome}
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-house me-2"></i>
                            Home
                        </Button>
                    </div>
                );
            }
        }
    };

    return (
        <Container className="py-4">
            {/* ✅ Header principale con risultato */}
            <Row className="mb-5">
                <Col className="text-center">
                    <div className={`display-3 mb-3 text-${message.variant}`}>
                        {isDemo ? (
                            <i className="bi bi-controller"></i>
                        ) : isCorrect ? (
                            <i className="bi bi-check-circle-fill"></i>
                        ) : (
                            <i className="bi bi-x-circle-fill"></i>
                        )}
                    </div>
                    <h1 className={`display-4 fw-bold text-${message.variant}`}>
                        {message.title}
                    </h1>
                    <p className="lead text-muted mb-4">
                        {message.subtitle}
                    </p>
                </Col>
            </Row>

            {/* ✅ Carta Target Rivelata - SOLO se vinta */}
            {isCorrect && (
                <Row className="mb-5">
                    <Col>
                        <Card className="shadow-sm">
                            <Card.Header className={`bg-${message.variant} text-white text-center`}>
                                <h4 className="mb-0">
                                    <i className="bi bi-eye me-2"></i>
                                    Carta Target Vinta
                                </h4>
                            </Card.Header>
                            <Card.Body>
                                <Row className="justify-content-center">
                                    <Col md={6} lg={4} className="mx-auto">
                                        <div className="text-center mb-3">
                                            <Badge bg="success" className="fs-6 p-2">
                                                Carta Vinta!
                                            </Badge>
                                        </div>
                                        <CardDisplay 
                                            card={targetCard} 
                                            showBadLuckIndex={true}
                                            className="border-3 border-success"
                                        />
                                        <div className="text-center mt-3">
                                            <h5 className="mb-1">Bad Luck Index</h5>
                                            <Badge bg="dark" className="fs-5 p-2">
                                                {targetCard.bad_luck_index}
                                            </Badge>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* ✅ Spiegazione del Risultato - STRETTA secondo prof */}
            <Row className="mb-5">
                <Col>
                    <Alert variant={message.variant} className="shadow-sm">
                        <h5 className="alert-heading">
                            <i className="bi bi-info-circle me-2"></i>
                            Risultato Round
                        </h5>
                        
                        {isCorrect ? (
                            // ✅ SOLO se vinto: mostra dettagli completi
                            <div>
                                <p className="mb-3">
                                    <strong>La tua scelta:</strong> Posizione {guessedPosition + 1}
                                    <br />
                                    <strong>Posizione corretta:</strong> Posizione {correctPosition + 1}
                                </p>
                                <p className="mb-0">
                                    <i className="bi bi-check-circle text-success me-2"></i>
                                    <strong>Perfetto!</strong> Hai posizionato correttamente la carta basandoti sul Bad Luck Index.
                                </p>
                            </div>
                        ) : isTimeout ? (
                            // ✅ TIMEOUT: Nessuna informazione sulla carta
                            <p className="mb-0">
                                <i className="bi bi-clock text-warning me-2"></i>
                                <strong>Tempo scaduto!</strong> Non hai fatto in tempo a posizionare la carta. 
                                La carta è stata scartata e non sarà più disponibile.
                            </p>
                        ) : (
                            // 🚨 SBAGLIATO: NESSUNA informazione secondo prof ("does not see ANY info")
                            <p className="mb-0">
                                <i className="bi bi-x-circle text-danger me-2"></i>
                                <strong>Risposta errata!</strong> La carta è stata scartata e non sarà più disponibile.
                                {isDemo && " Prova di nuovo per scoprire dove doveva andare!"}
                            </p>
                        )}
                    </Alert>
                </Col>
            </Row>

            {/* ✅ DEMO ONLY: Mostra tutte le carte con ordine corretto - SOLO SE VINTO */}
            {isDemo && isCorrect && allCards && allCards.length > 0 && (
                <Row className="mb-5">
                    <Col>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-secondary text-white text-center">
                                <h5 className="mb-0">
                                    <i className="bi bi-list-ol me-2"></i>
                                    Ordine Corretto delle Carte
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    {/* Mostra le carte nell'ordine corretto con la target inserita */}
                                    {(() => {
                                        // Crea array con tutte le carte nell'ordine corretto
                                        const sortedCards = [...allCards].sort((a, b) => a.bad_luck_index - b.bad_luck_index);
                                        const allCardsWithTarget = [...sortedCards];
                                        
                                        // Inserisci la carta target nella posizione corretta
                                        allCardsWithTarget.splice(correctPosition, 0, targetCard);
                                        
                                        return allCardsWithTarget.map((card, index) => (
                                            <Col key={card.id} md={6} lg={3} className="mb-3">
                                                <div className="text-center mb-2">
                                                    <Badge 
                                                        bg={card.id === targetCard.id ? "success" : "secondary"}
                                                        className="fs-6"
                                                    >
                                                        Pos. {index + 1}
                                                        {card.id === targetCard.id && " (Target)"}
                                                    </Badge>
                                                </div>
                                                <CardDisplay 
                                                    card={card} 
                                                    showBadLuckIndex={true}
                                                    className={`h-100 ${card.id === targetCard.id ? 
                                                        'border-3 border-success' : ''}`}
                                                />
                                                <div className="text-center mt-2">
                                                    <small className="text-muted">
                                                        Bad Luck: <strong>{card.bad_luck_index}</strong>
                                                    </small>
                                                </div>
                                            </Col>
                                        ));
                                    })()}
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* ✅ Consigli per migliorare (solo se non ha vinto) */}
            {!isCorrect && !isTimeout && (
                <Row className="mb-5">
                    <Col>
                        <Alert variant="info" className="shadow-sm">
                            <h6 className="alert-heading">
                                <i className="bi bi-lightbulb me-2"></i>
                                Consigli per Migliorare
                            </h6>
                            <ListGroup variant="flush" className="bg-transparent">
                                <ListGroup.Item className="bg-transparent px-0">
                                    <i className="bi bi-eye text-primary me-2"></i>
                                    Osserva attentamente l'immagine della situazione
                                </ListGroup.Item>
                                <ListGroup.Item className="bg-transparent px-0">
                                    <i className="bi bi-book text-primary me-2"></i>
                                    Leggi con attenzione il nome della situazione
                                </ListGroup.Item>
                                <ListGroup.Item className="bg-transparent px-0">
                                    <i className="bi bi-graph-up text-primary me-2"></i>
                                    Confronta mentalmente la gravità con le altre carte
                                </ListGroup.Item>
                                {isDemo && (
                                    <ListGroup.Item className="bg-transparent px-0">
                                        <i className="bi bi-star text-warning me-2"></i>
                                        Prova di nuovo o registrati per partite complete!
                                    </ListGroup.Item>
                                )}
                            </ListGroup>
                        </Alert>
                    </Col>
                </Row>
            )}

            {/* ✅ INVITO ALLA REGISTRAZIONE per utenti demo */}
            {isDemo && (
                <Row className="mb-4">
                    <Col>
                        <Alert variant="success" className="text-center shadow-sm">
                            <h5 className="alert-heading">
                                <i className="bi bi-star me-2"></i>
                                Ti è piaciuto il gioco?
                            </h5>
                            <p className="mb-3">
                                {isCorrect ? 
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

            {/* ✅ Pulsanti di Azione - Dinamici secondo le specifiche del prof */}
            <Row>
                <Col>
                    <Card className="bg-body-secondary text-center shadow-sm">
                        <Card.Body className="p-4">
                            <h4 className="mb-3">
                                {isDemo ? "Cosa vuoi fare ora?" : "Continua la Sfida"}
                            </h4>
                            {getActionButtons()}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default RoundResult;