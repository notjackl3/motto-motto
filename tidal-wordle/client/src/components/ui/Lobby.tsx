import { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import { SocketEvents } from '../../../../shared/events';

interface LobbyProps {
  onJoined: () => void;
  onBack: () => void;
}

export default function Lobby({ onJoined, onBack }: LobbyProps) {
  const { connect, emit, socket } = useSocket();
  const setRoomId = useMultiplayerStore((s) => s.setRoomId);
  const setIsHost = useMultiplayerStore((s) => s.setIsHost);
  const status = useMultiplayerStore((s) => s.connectionStatus);
  const [code, setCode] = useState('');

  useEffect(() => {
    connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onJoinedEvent = (payload: { roomId: string }) => {
      console.log('[lobby] room:joined', payload);
      setRoomId(payload.roomId);
      onJoined();
    };
    const onFull = () => {
      console.warn('[lobby] room:full');
    };
    socket.on(SocketEvents.RoomJoined, onJoinedEvent);
    socket.on(SocketEvents.RoomFull, onFull);
    return () => {
      socket.off(SocketEvents.RoomJoined, onJoinedEvent);
      socket.off(SocketEvents.RoomFull, onFull);
    };
  }, [socket, onJoined, setRoomId]);

  function createRoom() {
    setIsHost(true);
    emit(SocketEvents.RoomCreate, {});
  }

  function joinRoom() {
    if (!code.trim()) return;
    setIsHost(false);
    emit(SocketEvents.RoomJoin, { roomId: code.trim().toUpperCase() });
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-ocean to-deep">
      <h2 className="text-3xl font-bold">Lobby</h2>
      <div className="text-sm opacity-70">Status: {status}</div>
      <div className="flex flex-col gap-3 w-72 bg-black/30 rounded-lg p-4">
        <button
          onClick={createRoom}
          className="bg-seafoam text-deep font-semibold py-2 rounded hover:bg-white transition"
        >
          Create Room
        </button>
        <div className="text-center text-xs opacity-60">— or —</div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ROOM CODE"
          className="bg-white/10 rounded px-3 py-2 uppercase tracking-widest text-center outline-none"
        />
        <button
          onClick={joinRoom}
          className="bg-sand text-deep font-semibold py-2 rounded hover:bg-white transition"
        >
          Join Room
        </button>
      </div>
      <button onClick={onBack} className="text-sm opacity-70 underline">
        Back to menu
      </button>
    </div>
  );
}
