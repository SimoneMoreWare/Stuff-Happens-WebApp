import dayjs from 'dayjs';

/**
 * User model representing a registered user
 */
function User(id, username, email, password, salt, created_at) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;  // Hash della password
    this.salt = salt;          // Salt per l'hashing
    this.created_at = dayjs(created_at);
}

export { User };