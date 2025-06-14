import express from 'express';
import { param, validationResult } from 'express-validator';
import { getCardById } from '../dao/cardDAO.mjs';

const router = express.Router();

/**
 * GET /api/cards/:id/without-index - Get card without bad_luck_index (PUBLIC)
 * 
 * ✅ ANTI-CHEAT SAFE: Questo endpoint è sicuro per l'accesso pubblico!
 * Non espone il bad_luck_index, quindi non può essere usato per cheat.
 * 
 * @param {number} id - Card ID
 */
router.get('/:id/without-index', [
    param('id').isInt({ min: 1 }).withMessage('Card ID must be a positive integer')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    
    try {
        const card = await getCardById(req.params.id);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        // Return card without bad_luck_index for gameplay
        const cardWithoutIndex = {
            id: card.id,
            name: card.name,
            image_url: card.image_url,
            theme: card.theme
            // Deliberately excluding bad_luck_index
        };
        
        res.json(cardWithoutIndex);
    } catch (error) {
        console.error('Error fetching card without index:', error);
        res.status(500).json({ error: 'Database error while fetching card' });
    }
});

export default router;