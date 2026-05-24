import { create } from 'zustand';
import type { Socket } from 'socket.io-client';

interface OpponentState {
  id: string;
  name: string;
  connected: boolean;
}

interface MultiplayerStoreState {
  socket: Socket | null;
  roomId: string | null;
  isHost: boolean;
  opponent: OpponentState | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected';

  setSocket: (socket: Socket | null) => void;
  setRoomId: (id: string | null) => void;
  setIsHost: (host: boolean) => void;
  setOpponent: (opp: OpponentState | null) => void;
  setStatus: (status: MultiplayerStoreState['connectionStatus']) => void;
  reset: () => void;
}

export const useMultiplayerStore = create<MultiplayerStoreState>((set) => ({
  socket: null,
  roomId: null,
  isHost: false,
  opponent: null,
  connectionStatus: 'idle',

  setSocket: (socket) => set({ socket }),
  setRoomId: (id) => set({ roomId: id }),
  setIsHost: (host) => set({ isHost: host }),
  setOpponent: (opp) => set({ opponent: opp }),
  setStatus: (status) => set({ connectionStatus: status }),
  reset: () =>
    set({
      socket: null,
      roomId: null,
      isHost: false,
      opponent: null,
      connectionStatus: 'idle',
    }),
}));
