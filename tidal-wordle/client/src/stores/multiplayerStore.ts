import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import type { Role } from '../../../shared/events';

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected';

export type LobbyStatus = 'idle' | 'waitingForOpponent' | 'inGame';

interface MultiplayerStoreState {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  roomCode: string | null;
  role: Role | null;
  opponentConnected: boolean;
  opponentRole: Role | null;
  opponentName: string | null;
  lobbyStatus: LobbyStatus;
  // Most-recent lobby error from the server, surfaced as a transient toast.
  lobbyError: { type: 'full' | 'notFound'; roomCode: string } | null;

  setSocket: (socket: Socket | null) => void;
  setStatus: (status: ConnectionStatus) => void;
  setRoom: (roomCode: string, role: Role) => void;
  setOpponent: (role: Role | null, name?: string | null) => void;
  setOpponentConnected: (connected: boolean) => void;
  setLobbyStatus: (status: LobbyStatus) => void;
  setLobbyError: (
    err: { type: 'full' | 'notFound'; roomCode: string } | null,
  ) => void;
  reset: () => void;
}

const INITIAL: Pick<
  MultiplayerStoreState,
  | 'socket'
  | 'connectionStatus'
  | 'roomCode'
  | 'role'
  | 'opponentConnected'
  | 'opponentRole'
  | 'opponentName'
  | 'lobbyStatus'
  | 'lobbyError'
> = {
  socket: null,
  connectionStatus: 'idle',
  roomCode: null,
  role: null,
  opponentConnected: false,
  opponentRole: null,
  opponentName: null,
  lobbyStatus: 'idle',
  lobbyError: null,
};

export const useMultiplayerStore = create<MultiplayerStoreState>((set) => ({
  ...INITIAL,
  setSocket: (socket) => set({ socket }),
  setStatus: (connectionStatus) => set({ connectionStatus }),
  setRoom: (roomCode, role) => set({ roomCode, role }),
  setOpponent: (opponentRole, opponentName = 'Opponent') =>
    set({ opponentRole, opponentName: opponentName ?? 'Opponent' }),
  setOpponentConnected: (opponentConnected) => set({ opponentConnected }),
  setLobbyStatus: (lobbyStatus) => set({ lobbyStatus }),
  setLobbyError: (lobbyError) => set({ lobbyError }),
  reset: () =>
    set((prev) => {
      // Don't recreate the socket on reset — just clear room/match state.
      // Caller is responsible for socket.disconnect() if a full teardown is
      // wanted.
      return { ...INITIAL, socket: prev.socket };
    }),
}));
