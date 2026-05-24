import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import MainMenu from './components/ui/MainMenu';
import Lobby from './components/ui/Lobby';
import GameLayout from './components/layout/GameLayout';
import GameOverScreen from './components/ui/GameOverScreen';
import OpponentLeftModal from './components/ui/OpponentLeftModal';
import { useGameStore, onMatchEnd } from './stores/gameStore';
import { useMultiplayerStore } from './stores/multiplayerStore';
import { useSocket, useSocketBridge } from './hooks/useSocket';

/**
 * Top-level layout: mounts global concerns (socket bridge, opponent-left
 * modal, match-end → game-over redirect) and renders the current route via
 * <Outlet/>.
 */
function RootLayout() {
  const navigate = useNavigate();
  const resetMatch = useGameStore((s) => s.resetMatch);
  const setOpponentLeft = useGameStore((s) => s.setOpponentLeft);
  const opponentLeft = useGameStore((s) => s.opponentLeft);
  const mode = useGameStore((s) => s.mode);
  const { disconnect } = useSocket();

  useSocketBridge();

  // Match-end → /game-over (multiplayer only; solo runs infinitely).
  useEffect(() => {
    return onMatchEnd(() => {
      if (useGameStore.getState().mode === 'solo') return;
      navigate('/game-over');
    });
  }, [navigate]);

  function returnToMenuFromOpponentLeft() {
    setOpponentLeft(false);
    if (mode === 'multiplayer') {
      disconnect();
    }
    resetMatch();
    navigate('/');
  }

  return (
    <div className="h-screen w-screen">
      <Outlet />
      {opponentLeft && (
        <OpponentLeftModal onReturnToMenu={returnToMenuFromOpponentLeft} />
      )}
    </div>
  );
}

// ---------- Route wrappers ----------

function MenuRoute() {
  const navigate = useNavigate();
  const startMatch = useGameStore((s) => s.startMatch);

  function onSolo() {
    startMatch('solo');
    navigate('/solo');
  }
  function onMultiplayer() {
    navigate('/lobby');
  }

  return <MainMenu onSolo={onSolo} onMultiplayer={onMultiplayer} />;
}

function LobbyRoute() {
  const navigate = useNavigate();
  const setMode = useGameStore((s) => s.setMode);
  const resetMatch = useGameStore((s) => s.resetMatch);
  const lobbyStatus = useMultiplayerStore((s) => s.lobbyStatus);

  function onJoined() {
    // Switch into multiplayer mode and let the multiplayer bridge drive the
    // round state. Don't call startMatch() — it would pick a local word.
    setMode('multiplayer');
    navigate('/multiplayer');
  }

  function onBack() {
    resetMatch();
    navigate('/');
  }

  // When both players are in, jump into the match. Lobby itself was watching
  // answerLength; we watch the higher-fidelity lobbyStatus from the
  // multiplayer store.
  useEffect(() => {
    if (lobbyStatus === 'inGame') onJoined();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyStatus]);

  return <Lobby onJoined={onJoined} onBack={onBack} />;
}

function SoloRoute() {
  const navigate = useNavigate();
  const resetMatch = useGameStore((s) => s.resetMatch);
  const startMatch = useGameStore((s) => s.startMatch);
  const mode = useGameStore((s) => s.mode);

  // Deep-link guard: if mode isn't already 'solo', set it up.
  useEffect(() => {
    if (mode !== 'solo') startMatch('solo');
  }, [mode, startMatch]);

  function onQuit() {
    resetMatch();
    navigate('/');
  }
  return <GameLayout onQuit={onQuit} />;
}

function MultiplayerRoute() {
  const navigate = useNavigate();
  const resetMatch = useGameStore((s) => s.resetMatch);
  const { disconnect } = useSocket();
  const mode = useGameStore((s) => s.mode);
  const roomCode = useGameStore((s) => s.roomCode);

  // Deep-link guard: if we somehow landed here without a room, bounce to
  // lobby.
  useEffect(() => {
    if (!roomCode || mode !== 'multiplayer') navigate('/lobby');
  }, [roomCode, mode, navigate]);

  function onQuit() {
    disconnect();
    resetMatch();
    navigate('/');
  }
  return <GameLayout onQuit={onQuit} />;
}

function GameOverRoute() {
  const navigate = useNavigate();
  const resetMatch = useGameStore((s) => s.resetMatch);
  const { disconnect } = useSocket();
  const mode = useGameStore((s) => s.mode);
  const matchWinner = useGameStore((s) => s.matchWinner);

  // Deep-link guard: nothing to display if no match ended.
  useEffect(() => {
    if (matchWinner === null) navigate('/');
  }, [matchWinner, navigate]);

  function backToMenu() {
    if (mode === 'multiplayer') disconnect();
    resetMatch();
    navigate('/');
  }

  return <GameOverScreen onReplay={backToMenu} onMainMenu={backToMenu} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<MenuRoute />} />
          <Route path="/lobby" element={<LobbyRoute />} />
          <Route path="/solo" element={<SoloRoute />} />
          <Route path="/multiplayer" element={<MultiplayerRoute />} />
          <Route path="/game-over" element={<GameOverRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
