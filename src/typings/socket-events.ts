enum Events {
  Connected = 'connect',
  JoinGame = 'join-game',
  Joiner = 'joiner',
  Joined = 'joined',
}

interface Player {
  id: string
}

export interface Payload<T = any> {
  gameID?: string
  payload?: T | undefined
}

/** Glossary
 * player:
 */

// These events are only emitted from the client but are read by the server.
export enum ClientEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',

  // When a host (user with game config in session) visits the game page and
  // requests to start a new game. The server will check if the room exists and
  // should probably return an error if it does.
  // Payload: gameID
  START_GAME = 'START_GAME',

  // Sent from the host with the game config in their session storage
  REQUEST_START_GAME = 'REQUEST_START_GAME',

  // Sent when a non-host player joins the game from a link. This will trigger
  // the `PLAYER_JOINED_GAME` event.
  REQUEST_JOIN_GAME = 'REQUEST_JOIN_GAME',

  // When a new person joins the room, players should send their identity so
  // that everyone can see all participants. Triggers `PLAYER_IDENTITY`.
  SELF_IDENTIFY = 'SELF_IDENTIFY',

  // Triggered by `PLAYER_IDENTITY` following `SELF_IDENTIFY` and instructs the
  // client to update list of participants
  RECEIVED_PLAYER_IDENTITY = 'RECEIVED_PLAYER_IDENTITY',

  // Sent when the game config is modified or when a new player joins the game
  // Payload: gameConfig
  GAME_CONFIG = 'GAME_CONFIG',
}

// These events are only emitted the server, but are read by both
export enum ServerEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',

  // When a user starts a new game. This will probably have no effect but I’m
  // leaving it here anyway.
  PLAYER_STARTED_GAME = 'PLAYER_STARTED_GAME',

  // When a player joins the game. It will trigger the clients to `SELF_IDENTIFY`
  PLAYER_JOINED_GAME = 'PLAYER_JOINED_GAME',

  // When a player disconnects, instruct the client to remove the player from its list
  PLAYER_LEFT = 'PLAYER_LEFT',

  // Forwarded from `SELF_IDENTIFY`. Received from players in the game and is forwarded to players in the room.
  PLAYER_IDENTITY = 'PLAYER_IDENTITY',

  // Received from the client and should be spread to the other players in the game.
  GAME_CONFIG = 'GAME_CONFIG',
}

export default Events
