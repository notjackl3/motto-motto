import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useMultiplayerStore } from '../stores/multiplayerStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export function useSocket() {
  const socket = useMultiplayerStore((s) => s.socket);
  const setSocket = useMultiplayerStore((s) => s.setSocket);
  const setStatus = useMultiplayerStore((s) => s.setStatus);

  function connect(): Socket {
    if (socket) return socket;
    setStatus('connecting');
    const s = io(SERVER_URL, { autoConnect: true });
    s.on('connect', () => setStatus('connected'));
    s.on('disconnect', () => setStatus('disconnected'));
    setSocket(s);
    return s;
  }

  function disconnect() {
    socket?.disconnect();
    setSocket(null);
    setStatus('idle');
  }

  function emit(event: string, payload?: unknown) {
    socket?.emit(event, payload);
  }

  function on(event: string, handler: (...args: unknown[]) => void) {
    socket?.on(event, handler);
    return () => socket?.off(event, handler);
  }

  return { socket, connect, disconnect, emit, on };
}

export function useAutoConnectSocket() {
  const { connect, disconnect } = useSocket();
  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
