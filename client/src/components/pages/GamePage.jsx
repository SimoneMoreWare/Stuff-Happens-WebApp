import { useContext } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import UserContext from '../../context/UserContext.jsx';

function GamePage() {
  const { loggedIn, currentGame, user } = useContext(UserContext);

  return (
    <Container>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3>
                <i className="bi bi-controller me-2"></i>
                {loggedIn ? 'Partita Completa' : 'Modalità Demo'}
              </h3>
            </Card.Header>
            <Card.Body>
              {loggedIn ? (
                <div>
                  <Alert variant="info">
                    <strong>Modalità Utente Autenticato</strong><br />
                    Utente: {user?.username}<br />
                    Partita corrente: {currentGame ? 'Sì' : 'Nessuna'}
                  </Alert>
                  <p>🚧 Qui ci sarà il GameBoard per partite complete...</p>
                  <ul>
                    <li>Fino a 6 carte da raccogliere</li>
                    <li>Massimo 3 errori</li>
                    <li>Timer 30 secondi per round</li>
                    <li>Salvataggio progressi</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <Alert variant="warning">
                    <strong>Modalità Demo</strong><br />
                    Un solo round di prova senza salvataggio
                  </Alert>
                  <p>🚧 Qui ci sarà il GameBoard per demo...</p>
                  <ul>
                    <li>3 carte iniziali + 1 carta da posizionare</li>
                    <li>Un solo tentativo</li>
                    <li>Nessun salvataggio</li>
                  </ul>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GamePage;