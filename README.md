[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ArqHNgsV)

# Exam #1: "Stuff Happens"
## Student: s337165 Candido Simone pio

## React Client Application Routes

- Route `/`: page content and purpose
- Route `/something/:param`: page content and purpose, param specification
- ...

## API Server

### Authentication APIs

- **POST** `/api/sessions`
  - **Purpose**: User login authentication
  - **Request body**: `{ "username": "string", "password": "string" }`
  - **Response body**: `{ "id": number, "username": "string", "email": "string" }` (user object)
  - **Status codes**: 201 (login successful), 401 (invalid credentials), 500 (server error)

- **GET** `/api/sessions/current`
  - **Purpose**: Get current authenticated user information
  - **Request parameters**: None (uses session cookie)
  - **Response body**: `{ "id": number, "username": "string", "email": "string" }` or `{ "error": "Not authenticated" }`
  - **Status codes**: 200 (authenticated), 401 (not authenticated)

- **DELETE** `/api/sessions/current`
  - **Purpose**: User logout (destroy session)
  - **Request parameters**: None
  - **Response body**: Empty
  - **Status codes**: 200 (logout successful)

### Cards APIs

- **GET** `/api/cards`
  - **Purpose**: Get all cards in the system (mainly for debugging)
  - **Request parameters**: None
  - **Response body**: Array of card objects with all details including bad_luck_index
  - **Status codes**: 200 (success), 500 (database error)

- **GET** `/api/cards/theme/:theme`
  - **Purpose**: Get all cards of a specific theme
  - **Request parameters**: `theme` (university_life, travel, sports, love_life, work_life)
  - **Response body**: Array of card objects filtered by theme
  - **Status codes**: 200 (success), 422 (invalid theme), 500 (database error)

- **GET** `/api/cards/:id`
  - **Purpose**: Get detailed information about a specific card
  - **Request parameters**: `id` (card ID)
  - **Response body**: `{ "id": number, "name": "string", "image_url": "string", "bad_luck_index": number, "theme": "string", "created_at": "datetime" }`
  - **Status codes**: 200 (success), 404 (card not found), 422 (invalid ID), 500 (database error)

- **GET** `/api/cards/:id/without-index`
  - **Purpose**: Get card information WITHOUT bad_luck_index (for gameplay)
  - **Request parameters**: `id` (card ID)
  - **Response body**: `{ "id": number, "name": "string", "image_url": "string", "theme": "string" }`
  - **Status codes**: 200 (success), 404 (card not found), 422 (invalid ID), 500 (database error)

- **POST** `/api/cards/random`
  - **Purpose**: Get random cards for game initialization or rounds
  - **Request body**: `{ "theme": "string", "count": number, "excludeIds": [number] }`
  - **Response body**: Array of random card objects
  - **Status codes**: 200 (success), 400 (not enough cards), 422 (validation error), 500 (database error)

- **POST** `/api/cards/by-ids`
  - **Purpose**: Get multiple cards by their IDs
  - **Request body**: `{ "ids": [number] }`
  - **Response body**: Array of card objects ordered by bad_luck_index
  - **Status codes**: 200 (success), 422 (validation error), 500 (database error)

### Demo APIs (Anonymous Users)

- **GET** `/api/demo/instructions`
  - **Purpose**: Get comprehensive game instructions and rules
  - **Request parameters**: None
  - **Response body**: Detailed instructions object with rules, tips, and game modes
  - **Status codes**: 200 (success)

- **POST** `/api/demo/practice-cards`
  - **Purpose**: Get practice cards with visible bad_luck_index for learning
  - **Request body**: `{ "theme": "string", "count": number }`
  - **Response body**: `{ "cards": [card objects], "message": "string", "explanation": "string" }`
  - **Status codes**: 200 (success), 400 (not enough cards), 422 (validation error), 500 (database error)

- **POST** `/api/demo/start`
  - **Purpose**: Start a single-round demo game for anonymous users
  - **Request body**: `{ "theme": "string" }`
  - **Response body**: `{ "initialCards": [3 cards], "targetCard": card_without_index, "message": "string" }`
  - **Status codes**: 200 (success), 422 (validation error), 500 (database error)

- **POST** `/api/demo/guess`
  - **Purpose**: Submit a guess for demo game and get immediate result
  - **Request body**: `{ "targetCardId": number, "initialCardIds": [number], "position": number, "timeElapsed": number }`
  - **Response body**: `{ "correct": boolean, "correctPosition": number, "timeUp": boolean, "targetCard": card_object, "initialCards": [card objects], "message": "string", "explanation": "string" }`
  - **Status codes**: 200 (success), 422 (validation error), 500 (database error)

### Games APIs (Authenticated Users Only)

- **POST** `/api/games`
  - **Purpose**: Create a new game for authenticated users
  - **Request body**: `{ "theme": "string" }`
  - **Response body**: `{ "game": game_object, "initialCards": [3 cards], "isDemoGame": false, "message": "string" }`
  - **Status codes**: 201 (created), 400 (already has active game), 422 (validation error), 401 (not authenticated), 500 (database error)

- **GET** `/api/games/current`
  - **Purpose**: Get user's current active game
  - **Request parameters**: None (uses authenticated user session)
  - **Response body**: `{ "game": game_object, "wonCards": [card objects] }`
  - **Status codes**: 200 (success), 404 (no active game), 401 (not authenticated), 500 (database error)

- **GET** `/api/games/:id`
  - **Purpose**: Get detailed information about a specific game
  - **Request parameters**: `id` (game ID)
  - **Response body**: `{ "game": game_object, "initialCards": [card objects], "roundCards": [card objects] }`
  - **Status codes**: 200 (success), 404 (game not found), 403 (not authorized), 422 (invalid ID), 500 (database error)

- **POST** `/api/games/:id/next-round`
  - **Purpose**: Start next round or get current round card
  - **Request parameters**: `id` (game ID)
  - **Request body**: `{}`
  - **Response body**: `{ "roundCard": card_without_index, "message": "string" }`
  - **Status codes**: 200 (success), 400 (game not active/won/lost), 403 (not authorized), 422 (invalid ID), 500 (database error)

- **POST** `/api/games/:id/guess`
  - **Purpose**: Submit position guess for current round card
  - **Request parameters**: `id` (game ID)
  - **Request body**: `{ "gameCardId": number, "position": number, "timeElapsed": number }`
  - **Response body**: `{ "correct": boolean, "correctPosition": number, "gameStatus": "playing|won|lost", "message": "string", "finalCards": [cards] }`
  - **Status codes**: 200 (success), 400 (invalid game state), 403 (not authorized), 422 (validation error), 500 (database error)

- **GET** `/api/games/history`
  - **Purpose**: Get user's completed games history
  - **Request parameters**: None (uses authenticated user session)
  - **Response body**: Array of game objects with card details and results
  - **Status codes**: 200 (success), 401 (not authenticated), 500 (database error)

- **DELETE** `/api/games/:id`
  - **Purpose**: Abandon/delete an active game
  - **Request parameters**: `id` (game ID)
  - **Response body**: Empty
  - **Status codes**: 204 (deleted), 400 (can't abandon non-active game), 403 (not authorized), 404 (game not found), 401 (not authenticated), 500 (database error)


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

- username: user1, password: password, email: u1@p.it
  - Pre-existing user with completed game history
- username: user2, password: password, email: u2@p.it
  - User for testing new game creation and gameplay flow
- username: testuser, password: password, email: u3@p.it
  