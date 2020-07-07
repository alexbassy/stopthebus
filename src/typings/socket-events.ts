export interface Payload<T = any> {
  gameID?: string
  payload?: T
}

export interface PlayerVote {
  playerID: string
  category: string
  value: boolean
}

// These events are only emitted from the client but are read by the server.
export enum ClientEvent {
  CONNECT = 'connect',

  DISCONNECT = 'disconnect',

  // Sent from the host with the game config in their session storage
  REQUEST_CREATE_GAME = 'REQUEST_CREATE_GAME',

  // Sent when a non-host player joins the game from a link. This will trigger
  // the `PLAYER_JOINED_GAME` event.
  REQUEST_JOIN_GAME = 'REQUEST_JOIN_GAME',

  // When the user sets a nickname for themselves
  UPDATE_NICKNAME = 'UPDATE_NICKNAME',

  // Sent when the game config is modified or when a new player joins the game
  // Payload: gameConfig
  GAME_CONFIG = 'GAME_CONFIG',

  // Sent when the "Start game" button is clicked and triggers the first/next round
  START_ROUND = 'START_ROUND',

  // Sent when a player cancels the first round from being started
  CANCEL_START_ROUND = 'CANCEL_START_ROUND',

  // Sent when a player focusses an input, which will show up on other’s screens
  FOCUSSED_ANSWER = 'FOCUSSED_ANSWER',

  // Sent when the player finishes entering an answer
  FILLED_ANSWER = 'FILLED_ANSWER',

  // Sent when the player rejoins the game after disconnecting, to retrieve their answers
  RETRIEVE_ANSWERS = 'RETRIEVE_ANSWERS',

  // Implies the round has finished, presumably when the player clicks the
  // "end round" button, but could also be with timer? Not sure how to handle this
  END_ROUND = 'END_ROUND',

  // Sent when a player votes for validity of one of the other players answers
  VOTE_ANSWER = 'VOTE_ANSWER',
}

// These events are only emitted the server, but are read by both
export enum ServerEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',

  // When a user starts a new game. This will probably have no effect but I’m
  // leaving it here anyway.
  PLAYER_STARTED_GAME = 'PLAYER_STARTED_GAME',

  // When a player joins the game successfully, payload is the whole room
  JOINED_GAME = 'JOINED_GAME',

  // When another player joins the game. It will trigger the clients to `SELF_IDENTIFY`
  PLAYER_JOINED_GAME = 'PLAYER_JOINED_GAME',

  // When a player disconnects, instruct the client to remove the player from its list
  PLAYER_LEFT = 'PLAYER_LEFT',

  // Received from the client and should be spread to the other players in the game.
  GAME_CONFIG = 'GAME_CONFIG',

  // Triggered by someone clicking the "start round" button and shows a countdown on clients
  ROUND_STARTING = 'ROUND_STARTING',

  // Triggered by the `START_GAME` event - changes game state
  ROUND_STARTED = 'ROUND_STARTED',

  // Triggered when a player has finished the round and all clients must submit final answers
  ROUND_ENDING = 'ROUND_ENDING',

  // When the player reconnects to an active round and needs their answers
  SEND_ANSWERS = 'SEND_ANSWERS',

  // Updates players' screens with progress of other players
  OPPONENT_CURRENT_CATEGORY = 'OPPONENT_CURRENT_CATEGORY',

  // When the round has ended and we should go to the review screen
  ROUND_ENDED = 'ROUND_ENDED',

  // Emit an updated vote for the given player and answer when in review screen
  UPDATE_VOTES = 'UPDATE_VOTES',

  // Triggered by clicking "cancel" when someone starts the game
  // but I gave it a generic name because it seems so specific
  GAME_STATE_CHANGE = 'GAME_STATE_CHANGE',
}

export enum QueueEvent {
  START_ROUND = 'START_ROUND',
  END_ROUND = 'END_ROUND',
}
