import express from 'express';
import { body, validationResult } from 'express-validator';
import { getRandomCards, getCorrectPosition, getCardsByIds } from '../dao/cardDAO.mjs';

const router = express.Router();

/**
 * POST /api/demo/start - Start a demo game (anonymous users)
 * 
 * Creates a single-round demo game for anonymous users.
 * Returns 3 initial cards and 1 card to guess.
 * No data is saved to the database permanently - everything is handled in memory.
 * 
 * Body parameters:
 * @param {string} theme - Theme for the cards (default: 'university_life')
 */
router.post('/start', [
    body('theme').optional().isIn(['university_life', 'travel', 'sports', 'love_life', 'work_life'])
        .withMessage('Invalid theme')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const { theme = 'university_life' } = req.body;

    try {
        // Get 4 random cards: 3 for initial hand + 1 for guessing
        const allCards = await getRandomCards(theme, 4, []);
        
        if (allCards.length < 4) {
            return res.status(500).json({ 
                error: 'Not enough cards available for demo game' 
            });
        }

        // Split cards: first 3 for initial hand, last 1 for guessing
        const initialCards = allCards.slice(0, 3);
        const targetCard = allCards[3];

        // For the demo, we return the target card WITHOUT the bad_luck_index
        const targetCardWithoutIndex = {
            id: targetCard.id,
            name: targetCard.name,
            image_url: targetCard.image_url,
            theme: targetCard.theme
            // Deliberately excluding bad_luck_index
        };

        // Sort initial cards by bad_luck_index for proper display
        initialCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);

        res.json({
            initialCards,
            targetCard: targetCardWithoutIndex,
            message: 'Demo game started! Try to guess where the target card belongs.',
            isDemo: true
        });

    } catch (error) {
        console.error('Error starting demo game:', error);
        res.status(500).json({ error: 'Database error while starting demo game' });
    }
});

/**
 * POST /api/demo/guess - Submit a guess for demo game
 * 
 * Processes a guess for the demo game and returns the result.
 * No persistent data is stored - everything is calculated on the fly.
 * 
 * Body parameters:
 * @param {number} targetCardId - ID of the card being guessed
 * @param {number[]} initialCardIds - IDs of the initial 3 cards in order
 * @param {number} position - Position where player thinks the card belongs (0-based)
 * @param {number} timeElapsed - Time elapsed in seconds (for validation)
 */
router.post('/guess', [
    body('targetCardId').isInt({ min: 1 })
        .withMessage('Target card ID must be a positive integer'),
    body('initialCardIds').isArray({ min: 3, max: 3 })
        .withMessage('Initial card IDs must be an array of exactly 3 elements'),
    body('initialCardIds.*').isInt({ min: 1 })
        .withMessage('Each initial card ID must be a positive integer'),
    body('position').isInt({ min: 0, max: 3 })
        .withMessage('Position must be between 0 and 3'),
    body('timeElapsed').optional().isFloat({ min: 0, max: 60 })
        .withMessage('Time elapsed must be between 0 and 60 seconds')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const { targetCardId, initialCardIds, position, timeElapsed = 0 } = req.body;

    try {
        // Server-side time validation
        const TIME_LIMIT = 30; // seconds
        const isTimeUp = timeElapsed > TIME_LIMIT;

        // Get the correct position
        const correctPosition = await getCorrectPosition(targetCardId, initialCardIds);
        const isCorrect = !isTimeUp && position === correctPosition;

        // Get complete card details for the result
        const allCardIds = [...initialCardIds, targetCardId];
        const allCards = await getCardsByIds(allCardIds);
        
        const targetCardComplete = allCards.find(card => card.id === targetCardId);
        const initialCardsComplete = initialCardIds.map(id => 
            allCards.find(card => card.id === id)
        );

        // Sort initial cards by bad_luck_index for proper display
        initialCardsComplete.sort((a, b) => a.bad_luck_index - b.bad_luck_index);

        let message;
        if (isTimeUp) {
            message = `Time's up! The correct position was ${correctPosition}. The card "${targetCardComplete.name}" has a bad luck index of ${targetCardComplete.bad_luck_index}.`;
        } else if (isCorrect) {
            message = `Correct! The card "${targetCardComplete.name}" belongs at position ${correctPosition} with a bad luck index of ${targetCardComplete.bad_luck_index}.`;
        } else {
            message = `Wrong! The correct position was ${correctPosition}. The card "${targetCardComplete.name}" has a bad luck index of ${targetCardComplete.bad_luck_index}.`;
        }

        res.json({
            correct: isCorrect,
            correctPosition,
            timeUp: isTimeUp,
            targetCard: targetCardComplete,
            initialCards: initialCardsComplete,
            message,
            explanation: `Cards ordered by bad luck index: ${initialCardsComplete.map(c => `${c.name} (${c.bad_luck_index})`).join(', ')}`
        });

    } catch (error) {
        console.error('Error processing demo guess:', error);
        res.status(500).json({ error: 'Database error while processing demo guess' });
    }
});

export default router;