import { useState } from 'react';
import { Card, Badge, Spinner } from 'react-bootstrap';

function CardDisplay({ card, showBadLuckIndex = true, isTarget = false, className = "", fixedHeight = false }) {
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
            {/* Immagine della carta - PIÙ PICCOLA PER DARE SPAZIO AL TESTO */}
            <div 
                className="position-relative" 
                style={{ 
                    height: fixedHeight ? '180px' : '220px', 
                    overflow: 'hidden' 
                }}
            >
                {imageLoading && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                        <Spinner animation="border" size="sm" />
                    </div>
                )}
                
                {imageError ? (
                    <div className="d-flex align-items-center justify-content-center h-100 bg-body-secondary">
                        <div className="text-center text-muted">
                            <i className="bi bi-image" style={{ fontSize: '1.5rem' }}></i>
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
            </div>

            {/* Corpo della carta - PIÙ SPAZIO PER IL TESTO */}
            <Card.Body 
                className="p-2 d-flex flex-column justify-content-between"
                style={{ height: '130px', overflow: 'hidden' }}
            >
                {/* Titolo carta - PIÙ RIGHE E PIÙ LEGGIBILE */}
                <Card.Title 
                    className="small mb-2 text-center"
                    style={{ 
                        fontSize: '13px', 
                        lineHeight: '1.3',
                        maxHeight: '5em',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        wordWrap: 'break-word',
                        hyphens: 'auto'
                    }}
                    title={card.name}
                >
                    {card.name}
                </Card.Title>
                
                {/* Badge centrale - solo se necessario */}
                <div className="text-center mt-auto">
                    {showBadLuckIndex && card.bad_luck_index !== undefined ? (
                        <Badge 
                            bg={getBadLuckColor(card.bad_luck_index)} 
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                            {card.bad_luck_index}
                        </Badge>
                    ) : isTarget ? (
                        <Badge 
                            bg="secondary" 
                            style={{ fontSize: '11px', padding: '3px 6px' }}
                        >
                            ?
                        </Badge>
                    ) : null}
                </div>
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