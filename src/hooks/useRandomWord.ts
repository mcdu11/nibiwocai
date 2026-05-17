import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import { lib } from "../constants";

export interface LibRecord {
  word: string;
  pass?: boolean;
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Computed once per page load; only used the first time localStorage is empty.
const initialDeck = shuffle(lib);

// Deck-based draw: shuffle once, advance an index. Persist both so a refresh
// resumes where the player left off; supports cheap undo by decrementing the
// index and popping the matching record.
export function useRandomWord() {
  const [deck, setDeck] = useLocalStorage<string[]>("WORD_DECK", initialDeck);
  const [idx, setIdx] = useLocalStorage<number>("WORD_DECK_IDX", 0);
  const [libRecords, setLibRecords] = useLocalStorage<LibRecord[]>(
    "LIB_RECORDS",
    []
  );

  const word = idx < deck.length ? deck[idx] : undefined;

  const next = useCallback(
    (pass?: boolean) => {
      if (idx >= deck.length) return;
      setLibRecords((prev) => [...prev, { word: deck[idx], pass }]);
      setIdx((i) => i + 1);
    },
    [idx, deck, setLibRecords, setIdx]
  );

  const undo = useCallback(() => {
    if (idx === 0) return;
    setLibRecords((prev) => prev.slice(0, -1));
    setIdx((i) => Math.max(0, i - 1));
  }, [idx, setLibRecords, setIdx]);

  const resetDeck = useCallback(() => {
    setDeck(shuffle(lib));
    setIdx(0);
    setLibRecords([]);
  }, [setDeck, setIdx, setLibRecords]);

  const clearRecords = useCallback(() => {
    setLibRecords([]);
  }, [setLibRecords]);

  return {
    word,
    remaining: Math.max(0, deck.length - idx),
    total: deck.length,
    canUndo: idx > 0,
    next,
    undo,
    resetDeck,
    libRecords,
    clearRecords,
  };
}
