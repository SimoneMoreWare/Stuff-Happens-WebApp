import { Container, Row, Col, Card, Alert, Button, Badge } from 'react-bootstrap';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import UserContext from '../../context/UserContext.jsx';
import API from '../../API/API.mjs';
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
   
   // ✅ CONTEXT E NAVIGATE PER COPIARE LOGICA NAVBAR
   const { 
       currentGame, 
       isInActiveGame,
       setIsInActiveGame,
       clearCurrentGame,
       setMessage 
   } = useContext(UserContext);
   const navigate = useNavigate();
   
   // ✅ STATO PER GESTIRE LA CONFERMA
   const [showConfirmAbandon, setShowConfirmAbandon] = useState(false);
   
   // ✅ FANCULO, TORNIAMO ALLA HOME CHE FUNZIONA!
   const handleNewGameWithAutoAbandon = async () => {
       if (isInActiveGame) {
           try {
               if (currentGame) {
                   await API.abandonGame(currentGame.id);
               }
               
               setIsInActiveGame(false);
               clearCurrentGame();
               setMessage({ type: 'info', msg: 'Partita abbandonata - Torna al gioco per iniziarne una nuova' });
               
               // ✅ ANDIAMO ALLA HOME CHE FUNZIONA SEMPRE
               navigate('/');
               
           } catch (err) {
               setIsInActiveGame(false);
               clearCurrentGame();
               setMessage({ type: 'warning', msg: 'Partita abbandonata localmente' });
               
               // ✅ ALLA HOME ANCHE IN CASO DI ERRORE
               navigate('/');
           }
       } else {
           // Se non c'è partita attiva, vai alla home
           navigate('/');
       }
   };
   
   // ✅ FUNZIONI PER GESTIRE LA CONFERMA (SEMPLIFICATE)
   const handleRequestNewGame = () => {
       if (gameCompleted) {
           // Se la partita è completata, usa la logica navbar
           handleNewGameWithAutoAbandon();
       } else {
           // Se la partita è in corso, mostra la conferma
           setShowConfirmAbandon(true);
       }
   };
   
   const handleConfirmAbandon = () => {
       setShowConfirmAbandon(false);
       // ✅ USA LA LOGICA NAVBAR CHE FUNZIONA!
       handleNewGameWithAutoAbandon();
   };
   
   const handleCancelAbandon = () => {
       setShowConfirmAbandon(false);
   };
   
   // ✅ LOGICA SEMPLIFICATA
   const getMainIcon = () => {
       if (isTimeout) return '⏰';
       return isCorrect ? '🎉' : '💔';
   };
   
   const getMainTitle = () => {
       if (isTimeout) return 'Tempo Scaduto!';
       return isCorrect ? 'Fantastico!' : 'Peccato!';
   };
   
   const getMainMessage = () => {
       if (isTimeout) {
           return isDemo ? 
               'Il tempo è scaduto, ma ora sai come funziona!' :
               'Il tempo è scaduto. Riprova nel prossimo round!';
       }
       
       if (isCorrect) {
           return isDemo ?
               'Hai capito perfettamente il meccanismo del gioco!' :
               'Ottimo! Hai vinto questa carta.';
       } else {
           return isDemo ?
               'Non preoccuparti, ora hai capito come funziona il gioco e sei pronto per le partite complete!' :
               'Prossima volta andrà meglio!';
       }
   };
   
   // ✅ COLORE UNICO BASATO SUL RISULTATO
   const getThemeColor = () => {
       if (isTimeout) return 'warning';
       return isCorrect ? 'success' : 'primary'; // Blu invece di rosso per essere meno aggressivo
   };
   
   const themeColor = getThemeColor();
   
   return (
       <Container className="py-4" style={{ maxWidth: '800px' }}>
           
           {/* ✅ MODALE DI CONFERMA REACT-STYLE */}
           {showConfirmAbandon && (
               <Row className="mb-4">
                   <Col>
                       <Alert variant="warning" className="shadow border-0">
                           <Alert.Heading className="h5">
                               <i className="bi bi-exclamation-triangle me-2"></i>
                               Abbandonare la Partita?
                           </Alert.Heading>
                           <p className="mb-3">
                               Sei sicuro di voler abbandonare la partita in corso e iniziarne una nuova? 
                               Perderai tutti i progressi attuali.
                           </p>
                           <div className="d-flex gap-2 justify-content-end">
                               <Button 
                                   variant="outline-secondary" 
                                   onClick={handleCancelAbandon}
                               >
                                   <i className="bi bi-x-circle me-1"></i>
                                   Annulla
                               </Button>
                               <Button 
                                   variant="danger" 
                                   onClick={handleConfirmAbandon}
                               >
                                   <i className="bi bi-check-circle me-1"></i>
                                   Sì, Abbandona
                               </Button>
                           </div>
                       </Alert>
                   </Col>
               </Row>
           )}
           
           {/* ✅ PULSANTE PROSSIMO ROUND - SUBITO VISIBILE */}
           {!isDemo && !gameCompleted && (
               <Row className="mb-4">
                   <Col className="text-center">
                       <Button 
                           variant={themeColor}
                           size="lg"
                           onClick={onContinue}
                           className="px-5 py-3 shadow"
                           style={{ fontSize: '1.2rem' }}
                       >
                           <i className="bi bi-arrow-right me-2"></i>
                           Prossimo Round
                       </Button>
                   </Col>
               </Row>
           )}
           
           {/* 🏆 NOTIFICA VITTORIA/SCONFITTA - QUANDO GIOCO COMPLETATO */}
           {!isDemo && gameCompleted && (
               <Row className="mb-4">
                   <Col className="text-center">
                       <Alert 
                           variant={gameWon ? 'success' : 'danger'} 
                           className="shadow-lg border-0 p-4"
                       >
                           <div className="display-1 mb-3">
                               {gameWon ? '🏆' : '😔'}
                           </div>
                           <Alert.Heading as="h1" className="mb-3">
                               {gameWon ? 'VITTORIA!' : 'PARTITA FINITA'}
                           </Alert.Heading>
                           <p className="lead mb-0">
                               {gameWon ? 
                                   'Complimenti! Hai raccolto tutte le 6 carte e completato il gioco!' :
                                   'Hai commesso 3 errori. La partita è terminata, ma hai fatto del tuo meglio!'
                               }
                           </p>
                       </Alert>
                   </Col>
               </Row>
           )}
           
           {/* ✅ SEZIONE PRINCIPALE - RISULTATO CHIARO E SEMPLICE */}
           <Row className="mb-4">
               <Col className="text-center">
                   <Card className={`border-${themeColor} shadow-lg`}>
                       <Card.Body className="py-4">
                           <div className="display-2 mb-3">
                               {getMainIcon()}
                           </div>
                           <h2 className={`text-${themeColor} mb-3`}>
                               {getMainTitle()}
                           </h2>
                           <p className="lead text-muted mb-3">
                               {getMainMessage()}
                           </p>
                           
                           {/* ✅ INFORMAZIONE ESSENZIALE SOLO SE NECESSARIA E NON COMPLETATA */}
                           {!isTimeout && !gameCompleted && (
                               <div className={`p-3 bg-${themeColor === 'warning' ? 'light' : themeColor}-subtle rounded`}>
                                   <small className="text-muted">
                                       <strong>La tua scelta:</strong> Posizione {guessedPosition}
                                       {isCorrect && targetCard && (
                                           <span> • <strong>Bad Luck Index:</strong> {targetCard.bad_luck_index}</span>
                                       )}
                                   </small>
                               </div>
                           )}
                       </Card.Body>
                   </Card>
               </Col>
           </Row>
           
           {/* ✅ CARTA VINTA - SOLO SE RILEVANTE E IN MODO PULITO */}
           {isCorrect && targetCard && (
               <Row className="mb-4">
                   <Col className="text-center">
                       <h4 className="text-muted mb-3">Carta Aggiunta alla Collezione</h4>
                       <div className="d-inline-block position-relative">
                           <CardDisplay 
                               card={targetCard}
                               showBadLuckIndex={true}
                               className="shadow"
                               style={{ width: '250px', maxWidth: '100%' }}
                           />
                           <Badge 
                               bg="success" 
                               className="position-absolute top-0 start-100 translate-middle"
                               style={{ fontSize: '0.8rem' }}
                           >
                               ✓ Vinta
                           </Badge>
                       </div>
                   </Col>
               </Row>
           )}
           
           {/* ✅ COLLEZIONE FINALE - SEMPRE PER DEMO */}
           {isDemo && allCards && allCards.length > 0 && (
               <Row className="mb-4">
                   <Col>
                       <Card className="bg-light border-0">
                           <Card.Body>
                               <h5 className="text-center text-muted mb-4">
                                   {isCorrect ? "La Tua Collezione Aggiornata" : "Le Tue Carte"}
                               </h5>
                               <div className="d-flex justify-content-center flex-wrap gap-2">
                                   {allCards
                                       .sort((a, b) => a.bad_luck_index - b.bad_luck_index)
                                       .map((card, index) => {
                                           const isNewCard = isCorrect && card.id === targetCard?.id;
                                           return (
                                               <div key={card.id} className="text-center">
                                                   <div style={{ width: '120px' }}>
                                                       <CardDisplay 
                                                           card={card}
                                                           showBadLuckIndex={true}
                                                           className={`${isNewCard ? 'border-success border-2' : 'border-light'} mb-1`}
                                                           style={{ height: '140px' }}
                                                       />
                                                       {isNewCard && (
                                                           <small className="text-success fw-bold">
                                                               ★ Nuova
                                                           </small>
                                                       )}
                                                   </div>
                                               </div>
                                           );
                                       })}
                               </div>
                           </Card.Body>
                       </Card>
                   </Col>
               </Row>
           )}
           
           {/* ✅ AZIONI SECONDARIE - PIÙ DISCRETE */}
           <Row>
               <Col className="text-center">
                   <Card className="border-0 bg-transparent">
                       <Card.Body>
                           
                           {/* PULSANTI PRINCIPALI PER DEMO E GAME COMPLETATO */}
                           <div className="mb-3">
                               {!isDemo && gameCompleted && (
                                   <Button 
                                       variant={gameWon ? 'success' : 'primary'}
                                       size="lg"
                                       onClick={onContinue}
                                       className="px-5 py-3 shadow"
                                       style={{ fontSize: '1.2rem' }}
                                   >
                                       <i className={`bi ${gameWon ? 'bi-trophy' : 'bi-chart-bar'} me-2`}></i>
                                       {gameWon ? 'Celebra la Vittoria!' : 'Vedi il Tuo Punteggio'}
                                   </Button>
                               )}
                               
                               {isDemo && (
                                   <Button 
                                       variant={themeColor}
                                       size="lg"
                                       onClick={onNewGame}
                                       className="px-5 py-3 shadow"
                                       style={{ fontSize: '1.2rem' }}
                                   >
                                       <i className="bi bi-arrow-repeat me-2"></i>
                                       Prova Ancora
                                   </Button>
                               )}
                           </div>
                           
                           {/* PULSANTI SECONDARI - PIÙ DISCRETI CON FIX */}
                           <div className="d-flex gap-2 justify-content-center flex-wrap">
                               {!isDemo && (
                                   <Button 
                                       variant="outline-secondary"
                                       onClick={handleRequestNewGame}
                                   >
                                       <i className="bi bi-plus-circle me-1"></i>
                                       Nuova Partita
                                   </Button>
                               )}
                               
                               <Button 
                                   variant="outline-secondary"
                                   onClick={onBackHome}
                               >
                                   <i className="bi bi-house me-1"></i>
                                   Home
                               </Button>
                               
                               {isDemo && (
                                   <Button 
                                       variant="outline-primary"
                                       href="/login"
                                   >
                                       <i className="bi bi-person-plus me-1"></i>
                                       Registrati
                                   </Button>
                               )}
                           </div>
                       </Card.Body>
                   </Card>
               </Col>
           </Row>
           
           {/* ✅ MESSAGGIO PROMOZIONALE - SOLO PER DEMO E MOLTO DISCRETO */}
           {isDemo && (
               <Row className="mt-4">
                   <Col>
                       <div className="text-center p-3 bg-light rounded">
                           <small className="text-muted">
                               <i className="bi bi-info-circle me-1"></i>
                               {isCorrect ? 
                                   'Ti è piaciuto? Registrati per giocare partite complete!' :
                                   'Vuoi allenarti di più? Registrati per partite complete!'
                               }
                           </small>
                       </div>
                   </Col>
               </Row>
           )}
       </Container>
   );
}

export default RoundResult;