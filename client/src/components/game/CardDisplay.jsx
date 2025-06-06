import { useState } from 'react';
import { Card, Badge, Spinner } from 'react-bootstrap';

function CardDisplay({ card, showBadLuckIndex = true, isTarget = false, className = "" }) {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const handleImageLoad = () => {
        setImageLoading(false);
    };

    const handleImageError = () => {
        setImageLoading(false);
        setImageError(true);
    };

    return (
        <Card className={`h-100 shadow-sm ${isTarget ? 'border-warning border-3' : ''} ${className}`}>
            {/* Immagine della carta */}
            <div className="position-relative" style={{ height: '200px', overflow: 'hidden' }}>
                {imageLoading && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                        <Spinner animation="border" size="sm" />
                    </div>
                )}
                
                {imageError ? (
                    <div className="d-flex align-items-center justify-content-center h-100 bg-body-secondary">
                        <div className="text-center text-muted">
                            <i className="bi bi-image" style={{ fontSize: '3rem' }}></i>
                            <p className="mt-2 mb-0">Immagine non disponibile</p>
                        </div>
                    </div>
                ) : (
                    <img
                        src={card.image_url}
                        alt={card.name}
                        className="card-img-top h-100 object-fit-cover"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        style={{ display: imageLoading ? 'none' : 'block' }}
                    />
                )}

                {/* Badge per carta target */}
                {isTarget && (
                    <div className="position-absolute top-0 end-0 m-2">
                        <Badge bg="warning" className="d-flex align-items-center">
                            <i className="bi bi-bullseye me-1"></i>
                            Da Posizionare
                        </Badge>
                    </div>
                )}
            </div>

            {/* Corpo della carta */}
            <Card.Body className="p-3">
                <Card.Title className="h6 mb-2">{card.name}</Card.Title>
                
                {/* Bad Luck Index (visibile solo se richiesto) */}
                {showBadLuckIndex && card.bad_luck_index !== undefined && (
                    <div className="d-flex align-items-center justify-content-between">
                        <small className="text-muted">Bad Luck Index:</small>
                        <Badge 
                            bg={getBadLuckColor(card.bad_luck_index)} 
                            className="fs-6"
                        >
                            {card.bad_luck_index}
                        </Badge>
                    </div>
                )}

                {/* Placeholder per carte target */}
                {isTarget && !showBadLuckIndex && (
                    <div className="text-center">
                        <Badge bg="secondary">Indice Nascosto</Badge>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

// Funzione helper per determinare il colore del badge
function getBadLuckColor(index) {
    if (index <= 20) return 'success';
    if (index <= 40) return 'warning';
    if (index <= 60) return 'primary';
    if (index <= 80) return 'danger';
    return 'dark';
}

export default CardDisplay;