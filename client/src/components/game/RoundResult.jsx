import { Alert, Button, Row, Col } from 'react-bootstrap';
import CardDisplay from './CardDisplay.jsx';

function RoundResult({ 
   isCorrect, 
   isTimeout = false,
   targetCard, 
   correctPosition, 
   guessedPosition, 
   allCards,
   onContinue,
   onNewGame,
   isDemo = false,
   gameCompleted = false,
   gameWon = false
}) {
   console.log('🎯 RoundResult props:', {
       isCorrect,
       isTimeout,
       correctPosition,
       guessedPosition,
       targetCardName: targetCard?.name
   });

   // ✅ LOGICA CORRETTA: Mostra dettagli solo se indovinato
   const shouldShowCardDetails = isCorrect;
   
   // Determina l'azione successiva in base allo stato del gioco
   const getNextAction = () => {
       if (isDemo) {
           return 'demo';
       } else if (gameCompleted) {
           return gameWon ? 'won' : 'lost';
       } else {
           return 'continue';
       }
   };

   const nextAction = getNextAction();

   return (
       <div className="round-result">
           <Alert variant={isCorrect ? 'success' : (isTimeout ? 'warning' : 'danger')} className="text-center mb-4">
               <div className="display-6 mb-3">
                   {isCorrect ? (
                       <i className="bi bi-check-circle-fill text-success"></i>
                   ) : isTimeout ? (
                       <i className="bi bi-clock-fill text-warning"></i>
                   ) : (
                       <i className="bi bi-x-circle-fill text-danger"></i>
                   )}
               </div>
               
               <h4 className="alert-heading">
                   {isCorrect ? '🎉 Corretto!' : isTimeout ? '⏰ Tempo Scaduto!' : '😞 Sbagliato!'}
               </h4>
               
               <p className="mb-0">
                   {isCorrect ? (
                       <>Hai indovinato la posizione! La carta è stata aggiunta alla tua collezione.</>
                   ) : isTimeout ? (
                       <>Il tempo è scaduto! Non hai fatto una scelta in tempo.</>
                   ) : (
                       <>
                           Hai scelto la posizione <strong>{guessedPosition + 1}</strong>, 
                           ma quella corretta era <strong>{correctPosition + 1}</strong>.
                       </>
                   )}
               </p>

               {/* Messaggio aggiuntivo per partite complete */}
               {!isDemo && gameCompleted && (
                   <div className="mt-3 pt-3 border-top">
                       <h5 className={gameWon ? 'text-success' : 'text-danger'}>
                           {gameWon ? (
                               <>
                                   <i className="bi bi-trophy-fill me-2"></i>
                                   Partita Vinta! 🏆
                               </>
                           ) : (
                               <>
                                   <i className="bi bi-x-octagon-fill me-2"></i>
                                   Partita Persa! 💀
                               </>
                           )}
                       </h5>
                       <p className="mb-0">
                           {gameWon ? 
                               'Congratulazioni! Hai raccolto tutte e 6 le carte!' : 
                               'Peccato! Hai commesso 3 errori.'
                           }
                       </p>
                   </div>
               )}
           </Alert>

           {/* ✅ OPZIONE 3: Mostra carta SOLO se vinta */}
           {shouldShowCardDetails && (
               <Row className="justify-content-center mb-4">
                   <Col md={4}>
                       <h6 className="text-center mb-3">Carta Vinta:</h6>
                       <CardDisplay 
                           card={targetCard} 
                           showBadLuckIndex={true}
                           className="border-success"
                       />
                   </Col>
               </Row>
           )}

           {/* ✅ SPIEGAZIONE MODIFICATA */}
           <Row style={{ marginTop: '4rem' }}>
               <Col>
                   <Alert variant="info" className="mb-4">
                       <h6 className="alert-heading">
                           <i className="bi bi-info-circle me-2"></i>
                           {isCorrect ? 'Spiegazione' : 'Informazioni Round'}
                       </h6>
                       
                       {isCorrect ? (
                           // ✅ Solo se vinta: mostra tutti i dettagli
                           <>
                               <p className="mb-2">
                                   <strong>"{targetCard.name}"</strong> ha un Bad Luck Index di <strong>{targetCard.bad_luck_index}</strong>.
                               </p>
                               <p className="mb-0">
                                   Perfetto! Hai capito che questa situazione doveva essere posizionata in quella posizione.
                               </p>
                           </>
                       ) : isTimeout ? (
                           // ✅ Timeout: nessun dettaglio sulla carta
                           <p className="mb-0">
                               Il tempo è scaduto senza che tu facessi una scelta. 
                               La carta è stata scartata e non sarà più disponibile in questa partita.
                           </p>
                       ) : (
                           // ✅ Sbagliato: nessun dettaglio sulla carta
                           <p className="mb-0">
                               Hai scelto la posizione <strong>{guessedPosition + 1}</strong>, 
                               ma non era quella corretta. La carta è stata scartata e non sarà più disponibile.
                           </p>
                       )}
                   </Alert>
               </Col>
           </Row>

           {/* Pulsanti azione dinamici */}
           <div className="text-center">
               {nextAction === 'demo' && (
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
               )}

               {nextAction === 'continue' && (
                   <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                       <Button variant="primary" size="lg" onClick={onContinue}>
                           <i className="bi bi-arrow-right me-2"></i>
                           Continua al Prossimo Round
                       </Button>
                       <Button variant="outline-secondary" onClick={onNewGame}>
                           <i className="bi bi-arrow-repeat me-2"></i>
                           Nuova Partita
                       </Button>
                   </div>
               )}

               {nextAction === 'won' && (
                   <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                       <Button variant="success" size="lg" onClick={onContinue}>
                           <i className="bi bi-list-stars me-2"></i>
                           Vedi Riassunto Vittoria
                       </Button>
                       <Button variant="primary" onClick={onNewGame}>
                           <i className="bi bi-arrow-repeat me-2"></i>
                           Nuova Partita
                       </Button>
                       <Button variant="outline-secondary" href="/profile">
                           <i className="bi bi-person-lines-fill me-2"></i>
                           Vai al Profilo
                       </Button>
                   </div>
               )}

               {nextAction === 'lost' && (
                   <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                       <Button variant="warning" size="lg" onClick={onContinue}>
                           <i className="bi bi-list-task me-2"></i>
                           Vedi Riassunto Partita
                       </Button>
                       <Button variant="primary" onClick={onNewGame}>
                           <i className="bi bi-arrow-repeat me-2"></i>
                           Nuova Partita
                       </Button>
                       <Button variant="outline-secondary" href="/profile">
                           <i className="bi bi-person-lines-fill me-2"></i>
                           Vai al Profilo
                       </Button>
                   </div>
               )}
           </div>
       </div>
   );
}

export default RoundResult;