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
 * ✅ SECURITY: Already properly protected with isLoggedIn middleware.
 * Creates a new full game for authenticated users that will be saved in history.
 * Anonymous users should use /api/demo/start for demo games.
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
 * GET /api/games/current - Get current active game (AUTHENTICATED USERS ONLY)
 * 
 * ✅ SECURITY: Already properly protected with isLoggedIn middleware.
 * Returns the active game for the authenticated user only.
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
 * GET /api/games/history - Get user's game history (AUTHENTICATED USERS ONLY)
 * 
 * ✅ SECURITY: Already properly protected with isLoggedIn middleware.
 * Returns completed games for the authenticated user only.
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
 * DELETE /api/games/:id - Delete/abandon a game (AUTHENTICATED USERS ONLY)
 * 
 * ✅ SECURITY: Already properly protected with isLoggedIn middleware.
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
        
        // 🔒 SECURITY: Users can only abandon their own games
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
 * POST /api/games/:id/next-round - Start next round (AUTHENTICATED USERS ONLY)
 * 
 * 🔒 SECURITY FIX: Added isLoggedIn middleware protection!
 * ⚠️ PREVIOUS VULNERABILITY: Anonymous users could access round cards!
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
        
        // 🔒 SECURITY: Users can only play their own games
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
        console.error('Error starting next round:', error);
        res.status(500).json({ error: 'Database error while starting next round' });
    }
});


/**
 * POST /api/games/:id/guess - Submit a guess (AUTHENTICATED USERS ONLY)
 * 
 * 🔒 SECURITY COMPLETA + ✅ CHECK-THEN-ACT PATTERN:
 * - Validazione timer server-side (ignora timeElapsed dal client)
 * - Controllo ownership del game
 * - Prevenzione guess multipli
 * - Validazione round corrente
 * - Calcolo stato futuro PRIMA delle modifiche
 * - Autenticazione obbligatoria
 */
router.post('/:id/guess', isLoggedIn, [
    param('id').isInt({ min: 1 }).withMessage('Game ID must be a positive integer'),
    body('gameCardId').isInt({ min: 1 }).withMessage('Game card ID must be a positive integer'),
    body('position').isInt({ min: 0 }).withMessage('Position must be a non-negative integer')
    // 🔒 SECURITY: Rimuovo validazione timeElapsed - non ci fidiamo del client!
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    
    const { gameCardId, position } = req.body;
    // 🔒 SECURITY: Ignoriamo completamente timeElapsed dal client!
    
    try {
        // ====================================================================
        // FASE 1: CONTROLLI PRELIMINARI (Read-Only)
        // ====================================================================
        
        const game = await getGameById(req.params.id);
        
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        // 🔒 SECURITY: Users can only play their own games
        if (game.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only play your own games' });
        }
        
        // Check if game is still active
        if (game.status !== 'playing') {
            return res.status(400).json({ error: 'Game is not active' });
        }
        
        // Get the card being guessed - CON CONTROLLI COMPLETI
        const gameCard = await getGameCardById(gameCardId);
        
        if (!gameCard) {
            return res.status(400).json({ error: 'Game card not found' });
        }
        
        // 🔒 SECURITY: Verifica che la carta appartenga al gioco corrente
        if (gameCard.game_id !== game.id) {
            return res.status(400).json({ error: 'Game card does not belong to this game' });
        }
        
        // 🔒 SECURITY: Verifica che sia davvero il round corrente
        if (gameCard.round_number !== game.current_round) {
            return res.status(400).json({ 
                error: 'This card is not for the current round',
                type: 'WRONG_ROUND'
            });
        }
        
        // 🔒 SECURITY: Verifica che la carta non sia già stata giocata
        if (gameCard.guessed_correctly !== null) {
            return res.status(400).json({ 
                error: 'This card has already been played',
                type: 'ALREADY_PLAYED'
            });
        }
        
        // ====================================================================
        // FASE 2: CALCOLO STATO FUTURO (Check-Then-Act Pattern)
        // ====================================================================
        
        // 🔒 SECURITY: VALIDAZIONE TIMER SERVER-SIDE
        const now = dayjs();
        const cardDealtAt = dayjs(gameCard.card_dealt_at);
        const actualTimeElapsed = now.diff(cardDealtAt, 'second');
        const TIME_LIMIT = 30; // seconds
        const isTimeUp = actualTimeElapsed > TIME_LIMIT;
        
        // Get current won cards to determine correct position
        const wonCardIds = await getWonCardIds(game.id);
        const correctPosition = await getCorrectPosition(gameCard.card_id, wonCardIds);
        const isCorrect = !isTimeUp && position === correctPosition;
        
        // ✅ CHECK-THEN-ACT: Calcola stato futuro PRIMA delle modifiche
        const futureCardsCollected = isCorrect ? game.cards_collected + 1 : game.cards_collected;
        const futureWrongGuesses = !isCorrect ? game.wrong_guesses + 1 : game.wrong_guesses;
        
        // ✅ PREDICTI: Determina risultato finale senza modifiche
        const willWinGame = futureCardsCollected >= 6;
        const willLoseGame = futureWrongGuesses >= 3;
        const finalGameStatus = willWinGame ? 'won' : (willLoseGame ? 'lost' : 'playing');
        
        // Get card details for response (preparare ora per evitare query extra)
        const cardDetails = await getCardsByIds([gameCard.card_id]);
        const revealedCard = cardDetails[0];
        
        // ====================================================================
        // FASE 3: APPLICAZIONE MODIFICHE (Act)
        // ====================================================================
        // Ora che sappiamo esattamente cosa succederà, possiamo applicare le modifiche
        
        // 1. Aggiorna sempre il guess
        await updateGuess(gameCardId, isCorrect, isTimeUp ? null : position);
        
        // 2. Aggiorna contatori basandosi sui calcoli precedenti
        if (isCorrect) {
            await incrementCardsCollected(game.id);
        } else {
            await incrementWrongGuesses(game.id);
        }
        
        // 3. Gestisci stato finale del gioco
        if (willWinGame || willLoseGame) {
            await completeGame(game.id, finalGameStatus);
        } else {
            // Continue to next round only if game continues
            await advanceRound(game.id);
        }
        
        // ====================================================================
        // FASE 4: RISPOSTA (Una sola query per stato aggiornato)
        // ====================================================================
        
        // Una sola query finale per ottenere lo stato aggiornato
        const finalUpdatedGame = await getGameById(game.id);
        
        // Costruisci messaggio specifico
        let message;
        let reason = null;
        
        if (isTimeUp) {
            reason = 'time_up_server';
            if (willLoseGame) {
                message = `Tempo scaduto! (Server: ${actualTimeElapsed}s > ${TIME_LIMIT}s) Game over.`;
            } else {
                message = `Tempo scaduto! (Server: ${actualTimeElapsed}s > ${TIME_LIMIT}s) Prossimo round.`;
            }
        } else if (isCorrect) {
            if (willWinGame) {
                message = `Corretto! (Tempo: ${actualTimeElapsed}s) Hai vinto la partita!`;
            } else {
                message = `Corretto! (Tempo: ${actualTimeElapsed}s) Hai preso la carta.`;
            }
        } else {
            if (willLoseGame) {
                message = `Sbagliato! (Tempo: ${actualTimeElapsed}s) Game over.`;
            } else {
                message = `Sbagliato! (Tempo: ${actualTimeElapsed}s) Prossimo round.`;
            }
        }
        
        // ✅ RISPOSTA UNIFICATA: Un solo punto di uscita
        return res.json({
            correct: isCorrect,
            correctPosition,
            actualTimeElapsed,
            gameStatus: finalGameStatus,
            game: finalUpdatedGame,
            revealed_card: revealedCard,
            message,
            ...(reason && { reason }) // Aggiunge reason solo se presente
        });
        
    } catch (error) {
        console.error('Error processing guess:', error);
        res.status(500).json({ error: 'Database error while processing guess' });            
    }
});

/**
 * POST /api/games/:id/timeout - Handle timeout (AUTHENTICATED USERS ONLY)
 * 
 * 🔒 SECURITY FIX: Added isLoggedIn middleware protection!
 * ⚠️ PREVIOUS VULNERABILITY: Anonymous users could trigger timeouts!
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
        
        // 🔒 SECURITY: Users can only play their own games
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
                message: `Tempo scaduto! La carta "${revealedCard.name}" aveva un Bad Luck Index di ${revealedCard.bad_luck_index}. Partita terminata.`
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
            message: `Tempo scaduto! La carta "${revealedCard.name}" aveva un Bad Luck Index di ${revealedCard.bad_luck_index}. Prossimo round!`
        });
        
    } catch (error) {
        console.error('Error processing timeout:', error);
        res.status(500).json({ error: 'Database error while processing timeout' });
    }
});

export default router;