import dayjs from 'dayjs';

/**
 * Card model representing a horrible situation card
 */
function Card(id, name, image_url, bad_luck_index, theme, created_at) {
    this.id = id;
    this.name = name;                    // Nome della situazione orribile
    this.image_url = image_url;          // URL dell'immagine
    this.bad_luck_index = bad_luck_index; // Indice di sfortuna (1-100)
    this.theme = theme;                  // Tema della carta
    this.created_at = dayjs(created_at);
}

export { Card };