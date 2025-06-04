import { Container, Row, Col, Card } from 'react-bootstrap';

function InstructionsPage() {
  return (
    <Container>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3>
                <i className="bi bi-book me-2"></i>
                Come Giocare a Stuff Happens
              </h3>
            </Card.Header>
            <Card.Body>
              <h5>📋 Regole Base</h5>
              <ul>
                <li><strong>Obiettivo:</strong> Raccogliere 6 carte ordinandole correttamente</li>
                <li><strong>Tempo:</strong> 30 secondi per ogni decisione</li>
                <li><strong>Errori:</strong> Massimo 3 errori prima della sconfitta</li>
              </ul>

              <h5>🎮 Come Funziona</h5>
              <ol>
                <li>Ricevi 3 carte iniziali con situazioni sfortunate</li>
                <li>Ogni round ti viene mostrata una nuova situazione</li>
                <li>Devi decidere dove posizionarla tra le tue carte</li>
                <li>Se indovini la posizione corretta, ottieni la carta</li>
                <li>Se sbagli o il tempo scade, è un errore</li>
              </ol>

              <h5>🏆 Modalità di Gioco</h5>
              <Card className="mt-3">
                <Card.Body>
                  <h6>👤 Utenti Anonimi - Demo</h6>
                  <p>Un solo round di prova per imparare le meccaniche</p>
                  
                  <h6>🔐 Utenti Registrati - Partita Completa</h6>
                  <p>Gioco completo con salvataggio progressi e cronologia</p>
                </Card.Body>
              </Card>

              <h5>📊 Sistema di Punteggio</h5>
              <p>🚧 Dettagli sul Bad Luck Index e ordinamento carte...</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default InstructionsPage;