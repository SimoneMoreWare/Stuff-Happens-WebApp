import express from 'express';
import { body, param, validationResult } from 'express-validator';
import dayjs from 'dayjs';  
import { 
    createGame, 
    getGameById, 
    getActiveGameByUser, 
    completeGame, 
    getUserGameHistory,
    advanceRound,
    incrementCardsCollected,
    incrementWrongGuesses
} from '../dao/gameDAO.mjs';
import { 
    addInitialCard, 
    addRoundCard, 
    updateGuess, 
    getGameCards, 
    getWonCards,
    getCurrentRoundCard,
    getUsedCardIds,
    getWonCardIds,
    getGameCardById
} from '../dao/gameCardDAO.mjs';
import { getRandomCards, getCorrectPosition, getCardsByIds } from '../dao/cardDAO.mjs';
import { isLoggedIn } from '../middleware/authMiddleware.mjs';

const router = express.Router();

/**
 * POST /api/games - Create a new game (AUTHENTICATED USERS ONLY)
 * 
 * Creates a new full game for authenticated users that will be saved in history.
 * Anonymous users should use /api/demo/start for demo games.
 * 
 * Body parameters:
 * @param {string} theme - Theme for the cards (optional, default: 'university_life')
 * 
 * Response:
 * @returns {Object} game - Created game object
 * @returns {Array} initialCards - Array of 3 initial cards
 * @returns {string} message - Success message
 * 
 * Status codes:
 * - 201: Game created successfully
 * - 400: User already has an active game
 * - 422: Validation errors
 * - 500: Database error
 */
router.post('/', isLoggedIn, [
    body('theme').optional().isIn(['university_life'])
        .withMessage('Invalid theme'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    
    const { theme = 'university_life' } = req.body;
    const userId = req.user.id;
    
    try {
        // Check if user already has an active game
        const activeGame = await getActiveGameByUser(userId);
        if (activeGame) {
            return res.status(400).json({ 
                error: 'You already have an active game. Complete it before starting a new one.',
                activeGameId: activeGame.id 
            });
        }
        
        // Create the full game
        const gameId = await createGame(userId);
        
        // Get 3 random initial cards
        const initialCards = await getRandomCards(theme, 3, []);
        
        if (initialCards.length < 3) {
            return res.status(500).json({ error: 'Not enough cards available to start a game' });
        }
        
        // Add initial cards to the game
        for (const card of initialCards) {
            await addInitialCard(gameId, card.id);
        }
        
        // Get the created game with all details
        const game = await getGameById(gameId);
        
        res.status(201).json({
            game,
            initialCards,
            message: 'Full game created successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error while creating game' });
    }
});

/**
 * GET /api/games/current - Get current active game (AUTHENTICATED USERS ONLY)
 * 
 * Returns the active game for the authenticated user.
 * 
 * Response:
 * @returns {Object} game - Active game object
 * @returns {Array} wonCards - Array of cards won so far
 * 
 * Status codes:
 * - 200: Active game found
 * - 404: No active game found
 * - 500: Database error
 */
router.get('/current', isLoggedIn, async (req, res) => {
    try {
        const activeGame = await getActiveGameByUser(req.user.id);
        
        if (!activeGame) {
            return res.status(404).json({ error: 'No active game found' });
        }
        
        // Get all won cards for this game
        const wonCards = await getWonCards(activeGame.id);
        const wonCardIds = wonCards.map(gc => gc.card_id);
        const cardDetails = wonCardIds.length > 0 ? await getCardsByIds(wonCardIds) : [];
        
        res.json({
            game: activeGame,
            wonCards: cardDetails
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error while fetching current game' });
    }
});

/**
 * GET /api/games/history - Get user's game history (AUTHENTICATED USERS ONLY)
 * 
 * Returns completed games for the authenticated user with card details.
 * 
 * Response:
 * @returns {Array} games - Array of completed games with card information
 * 
 * Status codes:
 * - 200: History retrieved successfully
 * - 500: Database error
 */
router.get('/history', isLoggedIn, async (req, res) => {
    try {
        const games = await getUserGameHistory(req.user.id);
        
        // For each game, get the cards involved
        const gamesWithDetails = await Promise.all(
            games.map(async (game) => {
                const gameCards = await getGameCards(game.id);
                const cardIds = gameCards.map(gc => gc.card_id);
                const cardDetails = cardIds.length > 0 ? await getCardsByIds(cardIds) : [];
                
                // Organize cards with their game results
                const cardsWithResults = gameCards.map(gameCard => {
                    const cardDetail = cardDetails.find(cd => cd.id === gameCard.card_id);
                    return {
                        ...cardDetail,
                        round_number: gameCard.round_number,
                        guessed_correctly: gameCard.guessed_correctly,
                        is_initial: gameCard.is_initial,
                        won: gameCard.is_initial || gameCard.guessed_correctly === true
                    };
                });
                
                return {
                    ...game,
                    cards: cardsWithResults
                };
            })
        );
        
        res.json(gamesWithDetails);
    } catch (error) {
        res.status(500).json({ error: 'Database error while fetching game history' });
    }
});

/**
 * DELETE /api/games/:id - Delete/abandon a game (AUTHENTICATED USERS ONLY)
 * 
 * Allows a user to abandon their active game.
 * 
 * Parameters:
 * @param {number} id - Game ID to abandon
 * 
 * Status codes:
 * - 204: Game abandoned successfully
 * - 400: Game is not active or cannot be abandoned
 * - 403: User can only abandon their own games
 * - 404: Game not found
 * - 422: Validation errors
 * - 500: Database error
 */
router.delete('/:id', isLoggedIn, [
    param('id').isInt({ min: 1 }).withMessage('Game ID must be a positive integer')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    
    try {
        const game = await getGameById(req.params.id);
        
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        // Users can only abandon their own games
        if (game.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only abandon your own games' });
        }
        
        // Can only abandon active games
        if (game.status !== 'playing') {
            return res.status(400).json({ error: 'Can only abandon active games' });
        }
        
        // Mark game as lost (abandoned)
        await completeGame(game.id, 'lost');
        
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Database error while abandoning game' });
    }
});

/**
 * POST /api/games/:id/next-round - Start next round (AUTHENTICATED USERS ONLY)
 * 
 * Starts the next round by providing a new card to guess.
 * 
 * Parameters:
 * @param {number} id - Game ID
 * 
 * Response:
 * @returns {Object} roundCard - Card for current round (without bad_luck_index)
 * @returns {string} message - Round status message
 * 
 * Status codes:
 * - 200: Round card provided
 * - 400: Game not active or invalid state
 * - 403: User can only play their own games
 * - 404: Game not found
 * - 422: Validation errors
 * - 500: Database error
 */
router.post('/:id/next-round', isLoggedIn, [
    param('id').isInt({ min: 1 }).withMessage('Game ID must be a positive integer')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    
    try {
        const game = await getGameById(req.params.id);
        
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        // Users can only play their own games
        if (game.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only play your own games' });
        }
        
        // Check if game is still active
        if (game.status !== 'playing') {
            return res.status(400).json({ error: 'Game is not active' });
        }
        
        // Check if game should be over (win/loss conditions)
        if (game.cards_collected >= 6) {
            await completeGame(game.id, 'won');
            return res.status(400).json({ error: 'Game already won' });
        }
        if (game.wrong_guesses >= 3) {
            await completeGame(game.id, 'lost');
            return res.status(400).json({ error: 'Game already lost' });
        }
        
        // Check if there's already a card for this round
        const existingRoundCard = await getCurrentRoundCard(game.id, game.current_round);
        
        if (existingRoundCard) {
            // Return existing round card without bad_luck_index
            const cardDetails = await getCardsByIds([existingRoundCard.card_id]);
            const cardWithoutIndex = {
                id: cardDetails[0].id,
                name: cardDetails[0].name,
                image_url: cardDetails[0].image_url,
                theme: cardDetails[0].theme,
                gameCardId: existingRoundCard.id,
                round_number: existingRoundCard.round_number
            };
            
            return res.json({
                roundCard: cardWithoutIndex,
                message: 'Continue current round'
            });
        }
        
        // Get all used card IDs to exclude them
        const usedCardIds = await getUsedCardIds(game.id);
        
        // Get a new random card for this round
        const newCards = await getRandomCards('university_life', 1, usedCardIds);
        
        if (newCards.length === 0) {
            return res.status(500).json({ error: 'No more cards available for this game' });
        }
        
        const newCard = newCards[0];
        
        // Add the card to the game
        const gameCardId = await addRoundCard(game.id, newCard.id, game.current_round);
        
        // Return card without bad_luck_index
        const cardWithoutIndex = {
            id: newCard.id,
            name: newCard.name,
            image_url: newCard.image_url,
            theme: newCard.theme,
            gameCardId: gameCardId,
            round_number: game.current_round
        };
        
        res.json({
            roundCard: cardWithoutIndex,
            message: `Round ${game.current_round} started`
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error while starting next round' });
    }
});

/**
 * POST /api/games/:id/guess - Submit a guess (AUTHENTICATED USERS ONLY)
 * 
 * Processes a player's guess for the current round.
 * Implements server-side timer validation and prevents cheating.
 * 
 * Parameters:
 * @param {number} id - Game ID
 * 
 * Body parameters:
 * @param {number} gameCardId - ID of the game card being guessed
 * @param {number} position - Position where player thinks the card belongs (0-based)
 * 
 * Response:
 * @returns {boolean} correct - Whether the guess was correct
 * @returns {number} correctPosition - The actual correct position
 * @returns {number} actualTimeElapsed - Server-calculated time elapsed
 * @returns {string} gameStatus - Updated game status
 * @returns {Object} game - Updated game object
 * @returns {Object} revealed_card - Complete card with bad_luck_index
 * @returns {string} message - Result message
 * 
 * Status codes:
 * - 200: Guess processed successfully
 * - 400: Invalid game state or card already played
 * - 403: User can only play their own games
 * - 404: Game not found
 * - 422: Validation errors
 * - 500: Database error
 */
router.post('/:id/guess', isLoggedIn, [
    param('id').isInt({ min: 1 }).withMessage('Game ID must be a positive integer'),
    body('gameCardId').isInt({ min: 1 }).withMessage('Game card ID must be a positive integer'),
    body('position').isInt({ min: 0 }).withMessage('Position must be a non-negative integer')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    
    const { gameCardId, position } = req.body;
    
    try {
        // Get game and perform security checks
        const game = await getGameById(req.params.id);
        
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        // Users can only play their own games
        if (game.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only play your own games' });
        }
        
        // Check if game is still active
        if (game.status !== 'playing') {
            return res.status(400).json({ error: 'Game is not active' });
        }
        
        // Get the card being guessed and validate it
        const gameCard = await getGameCardById(gameCardId);
        
        if (!gameCard) {
            return res.status(400).json({ error: 'Game card not found' });
        }
        
        // Verify card belongs to this game
        if (gameCard.game_id !== game.id) {
            return res.status(400).json({ error: 'Game card does not belong to this game' });
        }
        
        // Verify it's the current round
        if (gameCard.round_number !== game.current_round) {
            return res.status(400).json({ 
                error: 'This card is not for the current round',
                type: 'WRONG_ROUND'
            });
        }
        
        // Verify card hasn't been played already
        if (gameCard.guessed_correctly !== null) {
            return res.status(400).json({ 
                error: 'This card has already been played',
                type: 'ALREADY_PLAYED'
            });
        }
        
        // Server-side timer validation
        const now = dayjs();
        const cardDealtAt = dayjs(gameCard.card_dealt_at);
        const actualTimeElapsed = now.diff(cardDealtAt, 'second');
        const TIME_LIMIT = 30; // seconds
        const isTimeUp = actualTimeElapsed > TIME_LIMIT;
        
        // Get current won cards to determine correct position
        const wonCardIds = await getWonCardIds(game.id);
        const correctPosition = await getCorrectPosition(gameCard.card_id, wonCardIds);
        const isCorrect = !isTimeUp && position === correctPosition;
        
        // Calculate future state to determine game outcome
        const futureCardsCollected = isCorrect ? game.cards_collected + 1 : game.cards_collected;
        const futureWrongGuesses = !isCorrect ? game.wrong_guesses + 1 : game.wrong_guesses;
        
        const willWinGame = futureCardsCollected >= 6;
        const willLoseGame = futureWrongGuesses >= 3;
        const finalGameStatus = willWinGame ? 'won' : (willLoseGame ? 'lost' : 'playing');
        
        // Get card details for response
        const cardDetails = await getCardsByIds([gameCard.card_id]);
        const revealedCard = cardDetails[0];
        
        // Apply all database updates
        await updateGuess(gameCardId, isCorrect, isTimeUp ? null : position);
        
        if (isCorrect) {
            await incrementCardsCollected(game.id);
        } else {
            await incrementWrongGuesses(game.id);
        }
        
        if (willWinGame || willLoseGame) {
            await completeGame(game.id, finalGameStatus);
        } else {
            await advanceRound(game.id);
        }
        
        // Get final updated game state
        const finalUpdatedGame = await getGameById(game.id);
        
        // Construct response message
        let message;
        let reason = null;
        
        if (isTimeUp) {
            reason = 'time_up_server';
            if (willLoseGame) {
                message = `Time expired! (Server: ${actualTimeElapsed}s > ${TIME_LIMIT}s) Game over.`;
            } else {
                message = `Time expired! (Server: ${actualTimeElapsed}s > ${TIME_LIMIT}s) Next round.`;
            }
        } else if (isCorrect) {
            if (willWinGame) {
                message = `Correct! (Time: ${actualTimeElapsed}s) You won the game!`;
            } else {
                message = `Correct! (Time: ${actualTimeElapsed}s) You got the card.`;
            }
        } else {
            if (willLoseGame) {
                message = `Wrong! (Time: ${actualTimeElapsed}s) Game over.`;
            } else {
                message = `Wrong! (Time: ${actualTimeElapsed}s) Next round.`;
            }
        }
        
        return res.json({
            correct: isCorrect,
            correctPosition,
            actualTimeElapsed,
            gameStatus: finalGameStatus,
            game: finalUpdatedGame,
            revealed_card: revealedCard,
            message,
            ...(reason && { reason })
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Database error while processing guess' });            
    }
});

/**
 * POST /api/games/:id/timeout - Handle timeout (AUTHENTICATED USERS ONLY)
 * 
 * Handles when a round times out without a guess.
 * 
 * Parameters:
 * @param {number} id - Game ID
 * 
 * Body parameters:
 * @param {number} gameCardId - ID of the game card that timed out
 * 
 * Response:
 * @returns {boolean} correct - Always false for timeout
 * @returns {boolean} isTimeout - Always true
 * @returns {number} correctPosition - The correct position
 * @returns {string} gameStatus - Updated game status
 * @returns {Object} game - Updated game object
 * @returns {Object} revealed_card - Complete card with bad_luck_index
 * @returns {string} message - Timeout message
 * 
 * Status codes:
 * - 200: Timeout processed successfully
 * - 400: Invalid game state or card already processed
 * - 403: User can only play their own games
 * - 422: Validation errors
 * - 500: Database error
 */
router.post('/:id/timeout', isLoggedIn, [
    param('id').isInt({ min: 1 }).withMessage('Game ID must be a positive integer'),
    body('gameCardId').isInt({ min: 1 }).withMessage('Game card ID must be a positive integer')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    
    const { gameCardId } = req.body;
    
    try {
        const game = await getGameById(req.params.id);
        
        if (!game || game.status !== 'playing') {
            return res.status(400).json({ error: 'Game is not active' });
        }
        
        // Users can only play their own games
        if (game.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only play your own games' });
        }
        
        const gameCard = await getCurrentRoundCard(game.id, game.current_round);
        
        if (!gameCard || gameCard.id !== gameCardId || gameCard.guessed_correctly !== null) {
            return res.status(400).json({ 
                error: 'Card already processed or invalid',
                gameStatus: 'playing',
                shouldAdvance: true 
            });
        }
        
        // Calculate the correct position for the response
        const wonCardIds = await getWonCardIds(game.id);
        const correctPosition = await getCorrectPosition(gameCard.card_id, wonCardIds);
        
        // Mark as timeout
        await updateGuess(gameCardId, false, null);
        await incrementWrongGuesses(game.id);
        
        // Get card details for response
        const cardDetails = await getCardsByIds([gameCard.card_id]);
        const revealedCard = cardDetails[0];
        
        // Check if game is lost
        const updatedGame = await getGameById(game.id);
        if (updatedGame.wrong_guesses >= 3) {
            await completeGame(game.id, 'lost');
            return res.json({
                correct: false,
                isTimeout: true,
                correctPosition,
                gameStatus: 'lost',
                game: updatedGame,
                revealed_card: revealedCard,
                message: `Time expired! The card "${revealedCard.name}" had a Bad Luck Index of ${revealedCard.bad_luck_index}. Game over.`
            });
        }
        
        // Continue to next round
        await advanceRound(game.id);
        const finalUpdatedGame = await getGameById(game.id);
        
        return res.json({
            correct: false,
            isTimeout: true,
            correctPosition,
            gameStatus: 'playing',
            game: finalUpdatedGame,
            revealed_card: revealedCard,
            message: `Time expired! The card "${revealedCard.name}" had a Bad Luck Index of ${revealedCard.bad_luck_index}. Next round!`
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Database error while processing timeout' });
    }
});

export default router;