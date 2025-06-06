import express from 'express';
import { body, param, validationResult } from 'express-validator';
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
    getWonCardIds
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
 * Automatically generates 3 initial random cards and adds them to the game.
 * 
 * Body parameters:
 * @param {string} theme - Theme for the cards (default: 'university_life')
 */
router.post('/', isLoggedIn, [
    body('theme').optional().isIn(['university_life', 'travel', 'sports', 'love_life', 'work_life'])
        .withMessage('Invalid theme'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const { theme = 'university_life' } = req.body;
    const userId = req.user.id; // Always authenticated due to middleware

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
        console.error('Error creating game:', error);
        res.status(500).json({ error: 'Database error while creating game' });
    }
});

/**
 * GET /api/games/current - Get current active game
 * 
 * For registered users: returns their active game if any.
 * For anonymous users: returns 403 (they don't have persistent games).
 */
router.get('/current', isLoggedIn, async (req, res) => {
    try {
        const activeGame = await getActiveGameByUser(req.user.id);
        
        if (!activeGame) {
            return res.status(404).json({ error: 'No active game found' });
        }

        // Get all game cards (including initial cards and won cards)
        const wonCards = await getWonCards(activeGame.id);
        const wonCardIds = wonCards.map(gc => gc.card_id);
        const cardDetails = wonCardIds.length > 0 ? await getCardsByIds(wonCardIds) : [];

        res.json({
            game: activeGame,
            wonCards: cardDetails
        });

    } catch (error) {
        console.error('Error fetching current game:', error);
        res.status(500).json({ error: 'Database error while fetching current game' });
    }
});

/**
 * GET /api/games/history - Get user's game history
 * 
 * Returns completed games (won/lost) for the authenticated user.
 * Only for registered users - anonymous users don't have history.
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
        console.error('Error fetching game history:', error);
        res.status(500).json({ error: 'Database error while fetching game history' });
    }
});

/**
 * GET /api/games/:id - Get specific game details
 * 
 * Returns complete game information including all cards.
 * For registered users: they can only access their own games.
 * 
 * @param {number} id - Game ID
 */
router.get('/:id', [
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

        // Authorization: users can only access their own games
        if (req.isAuthenticated() && game.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only access your own games' });
        }

        // Get all game cards
        const gameCards = await getGameCards(game.id);
        const allCardIds = gameCards.map(gc => gc.card_id);
        const cardDetails = allCardIds.length > 0 ? await getCardsByIds(allCardIds) : [];

        // Organize cards by type
        const initialCards = [];
        const roundCards = [];

        for (const gameCard of gameCards) {
            const cardDetail = cardDetails.find(cd => cd.id === gameCard.card_id);
            if (cardDetail) {
                const cardWithGameInfo = {
                    ...cardDetail,
                    round_number: gameCard.round_number,
                    guessed_correctly: gameCard.guessed_correctly,
                    position_guessed: gameCard.position_guessed,
                    is_initial: gameCard.is_initial,
                    played_at: gameCard.played_at
                };

                if (gameCard.is_initial) {
                    initialCards.push(cardWithGameInfo);
                } else {
                    roundCards.push(cardWithGameInfo);
                }
            }
        }

        res.json({
            game,
            initialCards,
            roundCards
        });

    } catch (error) {
        console.error('Error fetching game details:', error);
        res.status(500).json({ error: 'Database error while fetching game' });
    }
});

/**
 * DELETE /api/games/:id - Delete/abandon a game
 * 
 * Allows a user to abandon their current game.
 * Can only be used on games in 'playing' status.
 * 
 * @param {number} id - Game ID
 */
router.delete('/:id', [
    param('id').isInt({ min: 1 }).withMessage('Game ID must be a positive integer')
], isLoggedIn, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    try {
        const game = await getGameById(req.params.id);
        
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Authorization
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
        console.error('Error abandoning game:', error);
        res.status(500).json({ error: 'Database error while abandoning game' });
    }
});

/**
 * POST /api/games/:id/next-round - Start next round or get current round card
 * 
 * For ongoing games, this endpoint:
 * 1. Checks if game is still active
 * 2. Gets a new random card for the current round (excluding used cards)
 * 3. Returns the card WITHOUT bad_luck_index for the player to guess
 * 
 * @param {number} id - Game ID
 */
router.post('/:id/next-round', [
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

        // Authorization: users can only play their own games
        if (req.isAuthenticated() && game.user_id !== req.user.id) {
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
        console.error('Error starting next round:', error);
        res.status(500).json({ error: 'Database error while starting next round' });
    }
});

/**
 * POST /api/games/:id/guess - Submit a position guess for the current round card
 * 
 * Player submits where they think the current round card should be positioned
 * among their current cards. The server validates the guess and updates the game state.
 * 
 * @param {number} id - Game ID
 * Body parameters:
 * @param {number} gameCardId - ID of the GameCard being guessed
 * @param {number} position - Position where player thinks the card belongs (0-based)
 * @param {number} timeElapsed - Time elapsed in seconds (for server-side validation)
 */
router.post('/:id/guess', [
    param('id').isInt({ min: 1 }).withMessage('Game ID must be a positive integer'),
    body('gameCardId').isInt({ min: 1 }).withMessage('Game card ID must be a positive integer'),
    body('position').isInt({ min: 0 }).withMessage('Position must be a non-negative integer'),
    body('timeElapsed').optional().isFloat({ min: 0, max: 60 })
        .withMessage('Time elapsed must be between 0 and 60 seconds')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const { gameCardId, position, timeElapsed = 0 } = req.body;

    try {
        const game = await getGameById(req.params.id);
        console.log('🎮 GUESS DEBUG - Game info:', { gameId: game.id, status: game.status, currentRound: game.current_round });
        console.log('🎯 GUESS DEBUG - Received gameCardId:', gameCardId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Authorization
        if (req.isAuthenticated() && game.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only play your own games' });
        }

        // Check if game is still active
        if (game.status !== 'playing') {
            return res.status(400).json({ error: 'Game is not active' });
        }

        // Server-side time validation (basic check)
        const TIME_LIMIT = 30; // seconds
        if (timeElapsed > TIME_LIMIT) {
            // Time's up - mark as wrong guess
            await updateGuess(gameCardId, false, position);
            await incrementWrongGuesses(game.id);
            
            // Check if game is lost
            const updatedGame = await getGameById(game.id);
            if (updatedGame.wrong_guesses >= 3) {
                await completeGame(game.id, 'lost');
                return res.json({
                    correct: false,
                    reason: 'time_up',
                    gameStatus: 'lost',
                    message: 'Time is up! Game over.'
                });
            }

            await advanceRound(game.id);
            return res.json({
                correct: false,
                reason: 'time_up',
                gameStatus: 'playing',
                message: 'Time is up! Try the next round.'
            });
        }

        // Get current won cards to determine correct position
        const wonCardIds = await getWonCardIds(game.id);
        
        // Get the card being guessed
        const gameCard = await getCurrentRoundCard(game.id, game.current_round);
        console.log('🔍 GUESS DEBUG - Found gameCard:', gameCard);
        console.log('🔍 GUESS DEBUG - gameCard.id vs received:', { foundId: gameCard?.id, receivedId: gameCardId });
        if (!gameCard || gameCard.id !== gameCardId) {
                    console.log('❌ GUESS DEBUG - Mismatch!');
            return res.status(400).json({ error: 'Invalid game card for current round' });
        }

        // Calculate correct position
        const correctPosition = await getCorrectPosition(gameCard.card_id, wonCardIds);
        const isCorrect = position === correctPosition;

        // Update the guess
        await updateGuess(gameCardId, isCorrect, position);

        if (isCorrect) {
    // Correct guess - player gets the card
    await incrementCardsCollected(game.id);
    const cardDetails = await getCardsByIds([gameCard.card_id]);
    const revealedCard = cardDetails[0];

    // Check if game is won
    const updatedGame = await getGameById(game.id);
    if (updatedGame.cards_collected >= 6) {
        await completeGame(game.id, 'won');
        
        return res.json({
            correct: true,
            correctPosition,
            gameStatus: 'won',  // 👈 CAMBIATO da 'playing'
            game: updatedGame,
            revealed_card: revealedCard,
            message: 'Correct! You got the card and won the game!'
        });
    }
    
    // 👈 AGGIUNGI QUESTA RIGA
    await advanceRound(game.id);
    
    // Ottieni il gioco aggiornato con il nuovo round
    const finalUpdatedGame = await getGameById(game.id);
    
    return res.json({
        correct: true,
        correctPosition,
        gameStatus: 'playing',
        game: finalUpdatedGame,  // 👈 MODIFICA: usa finalUpdatedGame
        revealed_card: revealedCard,
        message: 'Correct! You got the card.'
    });
        } else {
            // Wrong guess
            await incrementWrongGuesses(game.id);
            const cardDetails = await getCardsByIds([gameCard.card_id]);
            const revealedCard = cardDetails[0];
            
            // Check if game is lost
            const updatedGame = await getGameById(game.id);
            if (updatedGame.wrong_guesses >= 3) {
                await completeGame(game.id, 'lost');
                return res.json({
                    correct: false,
                    correctPosition,
                    gameStatus: 'lost',
                    game: updatedGame,
                    revealed_card: revealedCard,
                    message: 'Wrong guess! Game over.'
                });
            }
            
            // 👈 AGGIUNGI QUESTA RIGA
            await advanceRound(game.id);
            
            // Ottieni il gioco aggiornato con il nuovo round
            const finalUpdatedGame = await getGameById(game.id);
            
            return res.json({
                correct: false,
                correctPosition,
                gameStatus: 'playing',
                game: finalUpdatedGame,  // 👈 MODIFICA: usa finalUpdatedGame
                revealed_card: revealedCard,
                message: 'Wrong guess! Try the next round.'
            });
        }

    } catch (error) {
        console.error('Error processing guess:', error);
        res.status(500).json({ error: 'Database error while processing guess' });            
    }
});

export default router;