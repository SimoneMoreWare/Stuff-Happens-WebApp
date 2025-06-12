import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { getCardById, getRandomCards, getCardsByIds } from '../dao/cardDAO.mjs';
import { isLoggedIn } from '../middleware/authMiddleware.mjs';

const router = express.Router();

/**
 * GET /api/cards/theme/:theme - Get cards by theme (ANTI-CHEAT PROTECTED)
 */
router.get('/theme/:theme', isLoggedIn, [
    param('theme').isIn(['university_life', 'travel', 'sports', 'love_life', 'work_life'])
        .withMessage('Invalid theme. Must be one of: university_life, travel, sports, love_life, work_life')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    
    try {
        const cards = await getCardsByTheme(req.params.theme);
        res.json(cards);
    } catch (error) {
        console.error('Error fetching cards by theme:', error);
        res.status(500).json({ error: 'Database error while fetching cards by theme' });
    }
}); 

/**
 * GET /api/cards/:id - Get a specific card by ID (ANTI-CHEAT PROTECTED)
 */
router.get('/:id', isLoggedIn, [
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
        res.json(card);
    } catch (error) {
        console.error('Error fetching card by ID:', error);
        res.status(500).json({ error: 'Database error while fetching card' });
    }
});

/**
 * POST /api/cards/random - Get random cards (PROTECTED)
 * 
 * ✅ ANTI-CHEAT: Questa API è protetta ma necessaria per il setup dei giochi.
 * Restituisce solo le carte necessarie per iniziare una partita.
 * 
 * Body parameters:
 * @param {string} theme - Theme of cards to select from
 * @param {number} count - Number of cards to return
 * @param {number[]} excludeIds - Array of card IDs to exclude (optional)
 */
router.post('/random', isLoggedIn, [
    body('theme').isIn(['university_life', 'travel', 'sports', 'love_life', 'work_life'])
        .withMessage('Invalid theme'),
    body('count').isInt({ min: 1, max: 10 })
        .withMessage('Count must be between 1 and 10'),
    body('excludeIds').optional().isArray()
        .withMessage('excludeIds must be an array'),
    body('excludeIds.*').optional().isInt({ min: 1 })
        .withMessage('Each excluded ID must be a positive integer')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    
    const { theme, count, excludeIds = [] } = req.body;
    
    try {
        const cards = await getRandomCards(theme, count, excludeIds);
        
        if (cards.length < count) {
            return res.status(400).json({ 
                error: `Not enough cards available. Requested ${count}, found ${cards.length}` 
            });
        }
        
        res.json(cards);
    } catch (error) {
        console.error('Error fetching random cards:', error);
        res.status(500).json({ error: 'Database error while fetching random cards' });
    }
});

/**
 * POST /api/cards/by-ids - Get multiple cards by their IDs (PROTECTED)
 * 
 * ✅ ANTI-CHEAT: Questa API è protetta ma necessaria per mostrare risultati.
 * Usata per mostrare dettagli delle carte dopo che sono state vinte/perse.
 * 
 * Body parameters:
 * @param {number[]} ids - Array of card IDs to retrieve
 */
router.post('/by-ids', isLoggedIn, [
    body('ids').isArray({ min: 1 })
        .withMessage('ids must be a non-empty array'),
    body('ids.*').isInt({ min: 1 })
        .withMessage('Each ID must be a positive integer')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    
    const { ids } = req.body;
    
    try {
        const cards = await getCardsByIds(ids);
        res.json(cards);
    } catch (error) {
        console.error('Error fetching cards by IDs:', error);
        res.status(500).json({ error: 'Database error while fetching cards' });
    }
});

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