import { useContext } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link } from 'react-router';
import UserContext from '../../context/UserContext.jsx';

function ProfilePage() {
  const { loggedIn, user } = useContext(UserContext);

  if (!loggedIn) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="warning" className="text-center">
              <h4>Accesso Richiesto</h4>
              <p>Devi essere autenticato per visualizzare il profilo.</p>
              <Link to="/login" className="btn btn-primary">
                Vai al Login
              </Link>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3>
                <i className="bi bi-person-lines-fill me-2"></i>
                Profilo di {user?.username}
              </h3>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <strong>Informazioni Utente:</strong><br />
                Username: {user?.username}<br />
                Email: {user?.email}<br />
                ID: {user?.id}
              </Alert>
              
              <h5>🚧 Cronologia Partite</h5>
              <p>Qui ci sarà la GameHistory con:</p>
              <ul>
                <li>Lista delle partite completate</li>
                <li>Carte vinte per ogni partita</li>
                <li>Data/ora delle partite</li>
                <li>Risultato (vittoria/sconfitta)</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;
