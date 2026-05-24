// Multiplayer is currently disabled — solo gameplay only. This stub keeps
// imports compiling (Lobby + App still reference useSocket / useSocketBridge)
// but does no real socket work. Re-enable by restoring the original socket
// wiring once gameStore exposes mp-specific actions again.

export function useSocket() {
  return {
    socket: null,
    connect: () => {},
    disconnect: () => {},
    createRoom: () => {},
    joinRoom: (_roomCode: string) => {},
    submitGuess: (_word: string) => {},
    playCard: (_cardId: string, _target: 'self' | 'opponent') => {},
    leaveRoom: () => {},
  };
}

export function useSocketBridge() {
  // No-op; gameStore handles solo flow directly.
}
