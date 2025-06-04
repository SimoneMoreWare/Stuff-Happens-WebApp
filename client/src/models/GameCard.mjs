/**
 * GameCard model representing a card involved in a specific game
 */
function GameCard(id, game_id, card_id, round_number, guessed_correctly, position_guessed, is_initial, played_at) {
    this.id = id;
    this.game_id = game_id;                    // ID della partita
    this.card_id = card_id;                    // ID della carta
    this.round_number = round_number;          // Round in cui è stata presentata (0 per iniziali)
    this.guessed_correctly = guessed_correctly; // true/false/null se non ancora giocata
    this.position_guessed = position_guessed;  // Posizione indovinata dall'utente
    this.is_initial = is_initial;              // Se è una delle 3 carte iniziali
    this.played_at = played_at ? dayjs(played_at) : null; // Quando è stata giocata
}

export { GameCard };