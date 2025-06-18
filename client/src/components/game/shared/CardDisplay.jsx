// CardDisplay.jsx - Reusable card component for displaying game cards
import { useState } from 'react';
import { Card, Badge, Spinner } from 'react-bootstrap';

/**
 * CardDisplay Component - Displays a single game card with image, name, and optional bad luck index
 * 
 * @param {Object} card - Card object with id, name, image_url, bad_luck_index
 * @param {boolean} showBadLuckIndex - Whether to show the bad luck index badge
 * @param {boolean} isTarget - Whether this card is the current target card
 * @param {string} className - Additional CSS classes
 * @param {boolean} fixedHeight - Whether to use fixed height for consistency
 */
function CardDisplay({ card, showBadLuckIndex = true, isTarget = false, className = "", fixedHeight = false }) {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Handle successful image load
    const handleImageLoad = () => {
        setImageLoading(false);
    };

    // Handle image load error
    const handleImageError = () => {
        setImageLoading(false);
        setImageError(true);
    };

    return (
        <Card className={`h-100 shadow-sm ${isTarget ? 'border-warning border-3' : ''} ${className}`}>
            {/* Card image section with loading and error handling */}
            <div 
                className="position-relative" 
                style={{ 
                    height: fixedHeight ? '180px' : '220px', 
                    overflow: 'hidden' 
                }}
            >
                {/* Loading spinner */}
                {imageLoading && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                        <Spinner animation="border" size="sm" />
                    </div>
                )}
                
                {/* Image error fallback */}
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

            {/* Card body with title and badge */}
            <Card.Body 
                className="p-2 d-flex flex-column justify-content-between"
                style={{ height: '130px', overflow: 'hidden' }}
            >
                {/* Card title with text overflow handling */}
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
                
                {/* Badge section for bad luck index or target indicator */}
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

/**
 * Helper function to determine badge color based on bad luck index
 * 
 * @param {number} index - Bad luck index from 1 to 100
 * @returns {string} Bootstrap color variant
 */
function getBadLuckColor(index) {
    if (index <= 20) return 'success';     // Green for minor issues
    if (index <= 40) return 'warning';     // Yellow for annoying situations
    if (index <= 60) return 'primary';     // Blue for problematic situations
    if (index <= 80) return 'danger';      // Red for serious problems
    return 'dark';                         // Dark for catastrophic events
}

export default CardDisplay;