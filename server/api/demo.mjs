import express from 'express';
import { body, validationResult } from 'express-validator';
import { getRandomCards, getCorrectPosition, getCardsByIds } from '../dao/cardDAO.mjs';

const router = express.Router();

/**
 * POST /api/demo/start - Start a demo game (anonymous users only)
 * 
 * Creates a single-round demo game for anonymous users.
 * Returns 3 initial cards and 1 card to guess.
 * No data is saved to the database permanently.
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
            message: 'Demo game started! Try to guess where the target card belongs.'
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

/**
 * GET /api/demo/instructions - Get game instructions
 * 
 * Returns the game rules and instructions for anonymous users.
 * This is accessible to all users without authentication.
 */
router.get('/instructions', (req, res) => {
    const instructions = {
        title: "Stuff Happens - Game Instructions",
        overview: "A single-player card game where you guess the relative 'bad luck' level of horrible situations.",
        
        gameRules: {
            objective: "Collect 6 cards by correctly guessing where new cards belong in your collection.",
            setup: "Start with 3 random cards showing their bad luck index (1-100, where 1 is 'nothing serious' and 100 is 'but why me?').",
            gameplay: [
                "Each round, you'll see a new horrible situation card (name and image only, no bad luck index).",
                "You have 30 seconds to guess where this card belongs among your current cards.",
                "If you guess correctly, you get the card and advance to the next round.",
                "If you guess wrong or time runs out, you don't get the card and it's discarded.",
                "The game ends when you collect 6 cards (WIN) or make 3 wrong guesses (LOSE)."
            ]
        },
        
        demoVersion: {
            description: "Anonymous users can play a single-round demo.",
            features: [
                "Start with 3 cards and try to place 1 new card",
                "No time pressure (though timing is still tracked)",
                "See the correct answer immediately after guessing",
                "No game history saved"
            ]
        },
        
        fullVersion: {
            description: "Registered users get the complete experience.",
            features: [
                "Full games up to 6 cards or 3 wrong guesses",
                "30-second time limit per round",
                "Game history and statistics",
                "Resume interrupted games"
            ]
        },
        
        tips: [
            "Pay attention to the severity of situations - 'lose a pen' vs 'miss final exam'",
            "Remember that each card has a unique bad luck index",
            "Think about the context and consequences of each situation",
            "Practice with the demo version before creating an account"
        ]
    };

    res.json(instructions);
});

/**
 * POST /api/demo/practice-cards - Get practice cards for viewing
 * 
 * Returns a set of cards with their bad luck indices visible
 * so anonymous users can practice understanding the scoring system.
 * 
 * Body parameters:
 * @param {string} theme - Theme for the cards (default: 'university_life')
 * @param {number} count - Number of cards to return (default: 5, max: 10)
 */
router.post('/practice-cards', [
    body('theme').optional().isIn(['university_life', 'travel', 'sports', 'love_life', 'work_life'])
        .withMessage('Invalid theme'),
    body('count').optional().isInt({ min: 3, max: 10 })
        .withMessage('Count must be between 3 and 10')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const { theme = 'university_life', count = 5 } = req.body;

    try {
        const practiceCards = await getRandomCards(theme, count, []);
        
        if (practiceCards.length < count) {
            return res.status(400).json({ 
                error: `Not enough cards available. Requested ${count}, found ${practiceCards.length}` 
            });
        }

        // Sort cards by bad luck index for educational purposes
        practiceCards.sort((a, b) => a.bad_luck_index - b.bad_luck_index);

        res.json({
            cards: practiceCards,
            message: `Here are ${practiceCards.length} sample cards with their bad luck indices visible for practice.`,
            explanation: "Study these to understand how different situations are ranked from 1 (minor inconvenience) to 100 (major disaster)."
        });

    } catch (error) {
        console.error('Error fetching practice cards:', error);
        res.status(500).json({ error: 'Database error while fetching practice cards' });
    }
});

export default router;