import { useState } from 'react';

export default function GuessInput() {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: validate, evaluate, push to gameStore.myGuesses
    setValue('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 bg-black/40 rounded-lg p-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a guess..."
        className="flex-1 bg-white/10 rounded px-3 py-2 outline-none text-white placeholder-white/40"
      />
      <button
        type="submit"
        className="bg-seafoam text-deep font-semibold px-4 py-2 rounded hover:bg-white transition"
      >
        Guess
      </button>
    </form>
  );
}
