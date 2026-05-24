import { useEffect, useState } from 'react';
import MainMenu from './components/ui/MainMenu';
import Lobby from './components/ui/Lobby';
import GameLayout from './components/layout/GameLayout';
import GameOverScreen from './components/ui/GameOverScreen';
import { useGameStore } from './stores/gameStore';
import { useSocket, useSocketBridge } from './hooks/useSocket';
import type { RoutingScreen } from './types';

export default function App() {
  const [screen, setScreen] = useState<RoutingScreen>('menu');
  const setMode = useGameStore((s) => s.setMode);
  const resetMatch = useGameStore((s) => s.resetMatch);
  const matchEnd = useGameStore((s) => s.matchEnd);
  const opponentLeft = useGameStore((s) => s.opponentLeft);

  const { connect, disconnect } = useSocket();

  // Single global socket lifetime + listener bridge.
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useSocketBridge();

  // Server-driven transition into the game-over screen.
  useEffect(() => {
    if ((matchEnd || opponentLeft) && screen === 'game') {
      setScreen('gameOver');
    }
  }, [matchEnd, opponentLeft, screen]);

  function startSolo() {
    resetMatch();
    setMode('solo');
    setScreen('game');
  }

  function startMultiplayer() {
    resetMatch();
    setMode('multiplayer');
    setScreen('lobby');
  }

  function backToMenu() {
    resetMatch();
    setScreen('menu');
  }

  function replay() {
    const wasMultiplayer = useGameStore.getState().mode === 'multiplayer';
    resetMatch();
    if (wasMultiplayer) {
      setMode('multiplayer');
      setScreen('lobby');
    } else {
      setMode('solo');
      setScreen('game');
    }
  }

  return (
    <div className="h-screen w-screen">
      {screen === 'menu' && (
        <MainMenu onSolo={startSolo} onMultiplayer={startMultiplayer} />
      )}
      {screen === 'lobby' && (
        <Lobby onJoined={() => setScreen('game')} onBack={backToMenu} />
      )}
      {screen === 'game' && <GameLayout onBackToMenu={backToMenu} />}
      {screen === 'gameOver' && (
        <GameOverScreen onReplay={replay} onMainMenu={backToMenu} />
      )}
    </div>
  );
}
