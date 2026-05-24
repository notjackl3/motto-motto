interface MainMenuProps {
  onSolo: () => void;
  onMultiplayer: () => void;
}

export default function MainMenu({ onSolo, onMultiplayer }: MainMenuProps) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-ocean to-deep">
      <h1 className="text-5xl font-extrabold tracking-tight">Tidal Wordle</h1>
      <p className="opacity-70 italic">Beach-themed competitive Wordle, riding the waves.</p>
      <div className="flex flex-col gap-3 w-64">
        <button
          onClick={onSolo}
          className="bg-seafoam text-deep font-semibold py-3 rounded hover:bg-white transition"
        >
          Solo
        </button>
        <button
          onClick={onMultiplayer}
          className="bg-sand text-deep font-semibold py-3 rounded hover:bg-white transition"
        >
          Multiplayer
        </button>
        <button
          disabled
          className="bg-white/10 text-white/50 font-semibold py-3 rounded cursor-not-allowed"
        >
          Settings (TODO)
        </button>
      </div>
    </div>
  );
}
