import { useEffect, useState } from 'react';
import WaveScene from '../scene/WaveScene';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../stores/gameStore';
import { useMultiplayerStore } from '../../stores/multiplayerStore';

interface LobbyProps {
  onJoined: () => void;
  onBack: () => void;
}

type Tab = 'create' | 'join';

export default function Lobby({ onJoined, onBack }: LobbyProps) {
  const { connect, createRoom, joinRoom } = useSocket();
  const [tab, setTab] = useState<Tab>('create');
  const [code, setCode] = useState('');
  const roomCode = useGameStore((s) => s.roomCode);
  const answerLength = useGameStore((s) => s.answerLength);
  const status = useMultiplayerStore((s) => s.connectionStatus);

  useEffect(() => {
    connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Server emits game:start once two players are present. Bridge sets
  // answerLength on the store, which is our cue to jump into the game.
  useEffect(() => {
    if (answerLength !== null) onJoined();
  }, [answerLength, onJoined]);

  const waitingForOpponent = tab === 'create' && roomCode && answerLength === null;

  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      <WaveScene />
      <div className="absolute inset-0 bg-gradient-to-b from-deep/40 via-transparent to-deep/70 pointer-events-none" />

      <div className="relative h-full w-full flex flex-col items-center justify-center gap-6 px-6">
        <h2 className="text-4xl font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] text-sand">
          Lobby
        </h2>
        <div className="text-xs opacity-60">Connection: {status}</div>

        <div className="w-80 backdrop-blur-md bg-deep/40 rounded-xl border border-white/15 shadow-2xl overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-3 font-semibold transition ${
                tab === 'create'
                  ? 'bg-seafoam text-deep'
                  : 'bg-transparent text-white/70 hover:text-white'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-3 font-semibold transition ${
                tab === 'join'
                  ? 'bg-seafoam text-deep'
                  : 'bg-transparent text-white/70 hover:text-white'
              }`}
            >
              Join Room
            </button>
          </div>

          <div className="p-4 flex flex-col gap-3">
            {tab === 'create' ? (
              <>
                {!roomCode ? (
                  <button
                    onClick={createRoom}
                    className="bg-sand text-deep font-bold py-3 rounded-lg hover:bg-white hover:scale-[1.02] transition shadow-lg"
                  >
                    Generate room code
                  </button>
                ) : (
                  <div className="text-center">
                    <div className="text-xs uppercase tracking-widest opacity-70 mb-1">
                      Share this code
                    </div>
                    <div className="text-4xl font-extrabold tracking-[0.4em] text-sand bg-black/30 rounded-lg py-3 mb-2">
                      {roomCode}
                    </div>
                    {waitingForOpponent && (
                      <div className="text-sm opacity-80 italic flex items-center justify-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-seafoam animate-pulse" />
                        Waiting for opponent to join…
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') joinRoom(code);
                  }}
                  placeholder="ABCDEF"
                  maxLength={6}
                  className="bg-white/10 rounded-lg px-3 py-3 uppercase tracking-[0.4em] text-center text-2xl font-bold outline-none placeholder-white/30 border border-white/10 focus:border-seafoam"
                />
                <button
                  onClick={() => joinRoom(code)}
                  disabled={code.length < 4}
                  className="bg-sand text-deep font-bold py-3 rounded-lg hover:bg-white hover:scale-[1.02] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Join
                </button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onBack}
          className="text-sm opacity-70 hover:opacity-100 underline transition"
        >
          ← Back to menu
        </button>
      </div>
    </div>
  );
}
