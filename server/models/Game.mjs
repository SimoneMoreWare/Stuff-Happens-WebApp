import dayjs from 'dayjs';

/**
 * Game model representing a game session
 */
function Game(id, user_id, status, cards_collected, wrong_guesses, current_round, created_at, completed_at) {
    this.id = id;
    this.user_id = user_id;              // NULL per utenti anonimi
    this.status = status;                // 'playing', 'won', 'lost'
    this.cards_collected = cards_collected; // Numero carte raccolte
    this.wrong_guesses = wrong_guesses;   // Numero errori commessi
    this.current_round = current_round;   // Round corrente
    this.created_at = dayjs(created_at);
    this.completed_at = completed_at ? dayjs(completed_at) : null;
}

export { Game };