import { useState } from 'react';
import MainMenu from './components/ui/MainMenu';
import Lobby from './components/ui/Lobby';
import GameLayout from './components/layout/GameLayout';
import GameOverScreen from './components/ui/GameOverScreen';
import { useGameStore } from './stores/gameStore';
import type { RoutingScreen } from './types';

export default function App() {
  const [screen, setScreen] = useState<RoutingScreen>('menu');
  const setMode = useGameStore((s) => s.setMode);
  const resetMatch = useGameStore((s) => s.resetMatch);

  function startSolo() {
    setMode('solo');
    setScreen('game');
  }

  function startMultiplayer() {
    setMode('multiplayer');
    setScreen('lobby');
  }

  function backToMenu() {
    resetMatch();
    setScreen('menu');
  }

  return (
    <div className="h-screen w-screen">
      {screen === 'menu' && (
        <MainMenu onSolo={startSolo} onMultiplayer={startMultiplayer} />
      )}
      {screen === 'lobby' && (
        <Lobby onJoined={() => setScreen('game')} onBack={backToMenu} />
      )}
      {screen === 'game' && <GameLayout onBackToMenu={() => setScreen('gameOver')} />}
      {screen === 'gameOver' && (
        <GameOverScreen winner={null} onReplay={backToMenu} />
      )}
    </div>
  );
}
