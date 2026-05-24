export const SocketEvents = {
  RoomCreate: 'room:create',
  RoomJoin: 'room:join',
  RoomJoined: 'room:joined',
  RoomFull: 'room:full',
  GameStart: 'game:start',
  GameGuess: 'game:guess',
  GameCardPlayed: 'game:cardPlayed',
  GameRoundEnd: 'game:roundEnd',
  GameMatchEnd: 'game:matchEnd',
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
