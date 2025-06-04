import { Button, Row, Col } from 'react-bootstrap';

function PositionSelector({ cards, onPositionSelect, disabled = false }) {
    // Genera le posizioni possibili (prima, tra ogni carta, dopo)
    const positions = [];
    
    // Prima di tutte le carte
    positions.push({
        index: 0,
        label: "Prima di tutte le carte",
        description: `Prima di "${cards[0]?.name}"`,
        icon: "bi-arrow-up"
    });

    // Tra le carte esistenti
    for (let i = 0; i < cards.length - 1; i++) {
        positions.push({
            index: i + 1,
            label: `Tra la ${i + 1}ª e ${i + 2}ª carta`,
            description: `Tra "${cards[i]?.name}" e "${cards[i + 1]?.name}"`,
            icon: "bi-arrow-down-up"
        });
    }

    // Dopo tutte le carte
    positions.push({
        index: cards.length,
        label: "Dopo tutte le carte",
        description: `Dopo "${cards[cards.length - 1]?.name}"`,
        icon: "bi-arrow-down"
    });

    return (
        <div className="position-selector">
            <Row className="g-3">
                {positions.map((position) => (
                    <Col key={position.index} xs={12}>
                        <Button
                            variant="outline-primary"
                            className="w-100 p-3 text-start"
                            onClick={() => onPositionSelect(position.index)}
                            disabled={disabled}
                        >
                            <div className="d-flex align-items-center">
                                <i className={`${position.icon} me-3 fs-4`}></i>
                                <div>
                                    <div className="fw-bold">{position.label}</div>
                                    <small className="text-muted">{position.description}</small>
                                </div>
                            </div>
                        </Button>
                    </Col>
                ))}
            </Row>
        </div>
    );
}

export default PositionSelector;