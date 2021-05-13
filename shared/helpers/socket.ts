export const getPlayerUUID = (socket: SocketIO.Socket) => {
  return socket.handshake.query.sessionID
}
