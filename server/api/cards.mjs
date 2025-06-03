import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { getAllCards, getCardsByTheme, getCardById, getRandomCards, getCardsByIds } from '../dao/cardDAO.mjs';

const router = express.Router();

/**
 * GET /api/cards - Get all cards
 * 
 * Returns all available cards in the system, ordered by bad_luck_index.
 * This endpoint is mainly for admin purposes or debugging.
 * In a real game, we use more specific endpoints.
 */
router.get('/', async (req, res) => {
    try {
        const cards = await getAllCards();
        res.json(cards);
    } catch (error) {
        console.error('Error fetching all cards:', error);
        res.status(500).json({ error: 'Database error while fetching cards' });
    }
});

/**
 * GET /api/cards/theme/:theme - Get cards by theme
 * 
 * Returns all cards of a specific theme, ordered by bad_luck_index.
 * Useful for filtering cards by category.
 * 
 * @param {string} theme - The theme to filter by (university_life, travel, sports, etc.)
 */
router.get('/theme/:theme', [
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
 * GET /api/cards/:id - Get a specific card by ID
 * 
 * Returns detailed information about a single card.
 * Used when we need to show complete card details including bad_luck_index.
 * 
 * @param {number} id - Card ID
 */
router.get('/:id', [
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
 * POST /api/cards/random - Get random cards for game initialization
 * 
 * Returns a specified number of random cards from a theme, excluding specified cards.
 * This is the main endpoint used for:
 * - Getting 3 initial cards for a new game
 * - Getting the next round card (excluding already used cards)
 * 
 * For demo games (anonymous users), this can be called without authentication.
 * For registered users' games, this should be used within the game flow.
 * 
 * Body parameters:
 * @param {string} theme - Theme of cards to select from
 * @param {number} count - Number of cards to return
 * @param {number[]} excludeIds - Array of card IDs to exclude (optional)
 */
router.post('/random', [
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
 * POST /api/cards/by-ids - Get multiple cards by their IDs
 * 
 * Returns an array of cards for the given IDs, ordered by bad_luck_index.
 * Useful for retrieving the complete card details for a user's collection.
 * 
 * Body parameters:
 * @param {number[]} ids - Array of card IDs to retrieve
 */
router.post('/by-ids', [
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
 * GET /api/cards/:id/without-index - Get card without bad_luck_index
 * 
 * Returns card information WITHOUT the bad_luck_index.
 * This is used during gameplay when showing the current round card
 * to the player - they should see name and image but not the index.
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