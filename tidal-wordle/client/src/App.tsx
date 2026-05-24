import { useEffect, useState } from 'react';
import MainMenu from './components/ui/MainMenu';
import Lobby from './components/ui/Lobby';
import GameLayout from './components/layout/GameLayout';
import GameOverScreen from './components/ui/GameOverScreen';
import { useGameStore } from './stores/gameStore';
import type { RoutingScreen } from './types';

export default function App() {
  const [screen, setScreen] = useState<RoutingScreen>('menu');
  const startMatch = useGameStore((s) => s.startMatch);
  const resetMatch = useGameStore((s) => s.resetMatch);
  const matchWinner = useGameStore((s) => s.matchWinner);

  useEffect(() => {
    if (matchWinner !== null && screen === 'game') {
      setScreen('gameOver');
    }
  }, [matchWinner, screen]);

  function startSolo() {
    startMatch('solo');
    setScreen('game');
  }

  function startMultiplayer() {
    setScreen('lobby');
  }

  function handleLobbyJoined() {
    startMatch('multiplayer');
    setScreen('game');
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
        <Lobby onJoined={handleLobbyJoined} onBack={backToMenu} />
      )}
      {screen === 'game' && (
        <GameLayout onQuit={backToMenu} />
      )}
      {screen === 'gameOver' && (
        <GameOverScreen winner={matchWinner} onReplay={backToMenu} />
      )}
    </div>
  );
}
