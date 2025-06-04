import { Alert, Button, Row, Col } from 'react-bootstrap';
import CardDisplay from './CardDisplay.jsx';

function RoundResult({ 
    isCorrect, 
    targetCard, 
    correctPosition, 
    guessedPosition, 
    allCards,
    onContinue,
    onNewGame,
    isDemo = false 
}) {
    return (
        <div className="round-result">
            {/* Alert principale con risultato */}
            <Alert variant={isCorrect ? 'success' : 'danger'} className="text-center mb-4">
                <div className="display-6 mb-3">
                    {isCorrect ? (
                        <i className="bi bi-check-circle-fill text-success"></i>
                    ) : (
                        <i className="bi bi-x-circle-fill text-danger"></i>
                    )}
                </div>
                
                <h4 className="alert-heading">
                    {isCorrect ? '🎉 Corretto!' : '😞 Sbagliato!'}
                </h4>
                
                <p className="mb-0">
                    {isCorrect ? (
                        <>Hai indovinato la posizione! La carta è stata aggiunta alla tua collezione.</>
                    ) : (
                        <>
                            Hai scelto la posizione <strong>{guessedPosition + 1}</strong>, 
                            ma quella corretta era <strong>{correctPosition + 1}</strong>.
                        </>
                    )}
                </p>
            </Alert>

            {/* Mostra la carta con Bad Luck Index rivelato */}
            <Row className="justify-content-center mb-4">
                <Col md={4}>
                    <h6 className="text-center mb-3">Carta Rivelata:</h6>
                    <CardDisplay 
                        card={targetCard} 
                        showBadLuckIndex={true}
                        className="border-info"
                    />
                </Col>
            </Row>

            {/* Spiegazione dettagliata - Abbassata molto di più */}
            <Row style={{ marginTop: '4rem' }}>
                <Col>
                    <Alert variant="info" className="mb-4">
                        <h6 className="alert-heading">
                            <i className="bi bi-info-circle me-2"></i>
                            Spiegazione
                        </h6>
                        <p className="mb-2">
                            <strong>"{targetCard.name}"</strong> ha un Bad Luck Index di <strong>{targetCard.bad_luck_index}</strong>.
                        </p>
                        <p className="mb-0">
                            {isCorrect ? (
                                <>Perfetto! Hai capito che questa situazione doveva essere posizionata in quella posizione.</>
                            ) : (
                                <>
                                    La posizione corretta era <strong>{correctPosition + 1}</strong> perché il suo indice 
                                    di sfortuna ({targetCard.bad_luck_index}) la colloca {correctPosition === 0 ? 'all\'inizio' : 
                                    correctPosition === allCards.length ? 'alla fine' : 'in mezzo'} rispetto alle altre carte.
                                </>
                            )}
                        </p>
                    </Alert>
                </Col>
            </Row>

            {/* Pulsanti azione */}
            <div className="text-center">
                {isDemo ? (
                    <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                        <Button variant="primary" size="lg" onClick={onNewGame}>
                            <i className="bi bi-arrow-repeat me-2"></i>
                            Prova Ancora
                        </Button>
                        <Button variant="success" size="lg" href="/login">
                            <i className="bi bi-person-plus me-2"></i>
                            Registrati per Partite Complete
                        </Button>
                    </div>
                ) : (
                    <Button variant="primary" size="lg" onClick={onContinue}>
                        <i className="bi bi-arrow-right me-2"></i>
                        Continua al Prossimo Round
                    </Button>
                )}
            </div>
        </div>
    );
}

export default RoundResult;
