[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ArqHNgsV)

# Exam #1: "Stuff Happens"
## Student: s337165 Candido Simone pio

## React Client Application Routes

- Route `/`: page content and purpose
- Route `/something/:param`: page content and purpose, param specification
- ...

## API Server

- POST `/api/something`
  - request parameters and request body content
  - response body content
- GET `/api/something`
  - request parameters
  - response body content
- POST `/api/something`
  - request parameters and request body content
  - response body content
- ...

## Database Tables

- Table `Users` - contains registered users with authentication credentials. Stores id (PK), username (unique), email (unique), hashed password, salt for encryption, and creation timestamp.
- Table `Cards` - contains horrible situation cards for the game. Each card has id (PK), situation name, robohash image URL, unique bad_luck_index (1-100), theme classification, and creation timestamp.
- Table `Games` - tracks individual game sessions. Stores id (PK), user_id (FK, NULL for anonymous), game status (playing/won/lost), cards_collected count, wrong_guesses count, current_round number, and timestamps.
- Table `GameCards` - junction table linking games and cards with game progress details. Contains id (PK), game_id (FK), card_id (FK), round_number, guess correctness, user's position guess, initial card flag, and play timestamp.

## Main React Components

- `ListOfSomething` (in `List.js`): component purpose and main functionality
- `GreatButton` (in `GreatButton.js`): component purpose and main functionality
- ...

(only _main_ components, minor ones may be skipped)

## Screenshot

![Screenshot](./img/screenshot.jpg)

## Users Credentials

- user1, password (email: u1@p.it)
- user2, password (email: u2@p.it)
- testuser, password (email: u3@p.it)
