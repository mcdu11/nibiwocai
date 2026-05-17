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

// Module-level constants so useLocalStorage's readValue/handleStorageChange
// callbacks keep stable identities across renders (initialValue is part of
// their dep list).
const initialDeck = shuffle(lib);
const EMPTY_RECORDS: LibRecord[] = [];

// Deck-based draw: shuffle once, advance an index. Persist both so a refresh
// resumes where the player left off; supports cheap undo by decrementing the
// index and popping the matching record.
export function useRandomWord() {
  const [deck, setDeck] = useLocalStorage<string[]>("WORD_DECK", initialDeck);
  const [idx, setIdx] = useLocalStorage<number>("WORD_DECK_IDX", 0);
  const [libRecords, setLibRecords] = useLocalStorage<LibRecord[]>(
    "LIB_RECORDS",
    EMPTY_RECORDS
  );
  const [isCustomLib, setIsCustomLib] = useLocalStorage<boolean>(
    "IS_CUSTOM_LIB",
    false
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
    setIsCustomLib(false);
  }, [setDeck, setIdx, setLibRecords, setIsCustomLib]);

  const clearRecords = useCallback(() => {
    setLibRecords([]);
  }, [setLibRecords]);

  // Parse a pasted/uploaded string into a deduped list of trimmed entries.
  // Accepts newline, comma, or whitespace as separators.
  const applyCustomLib = useCallback(
    (raw: string): number => {
      const words = Array.from(
        new Set(
          raw
            .split(/[\n,，、;；\s]+/)
            .map((w) => w.trim())
            .filter(Boolean)
        )
      );
      if (!words.length) return 0;
      setDeck(shuffle(words));
      setIdx(0);
      setLibRecords([]);
      setIsCustomLib(true);
      return words.length;
    },
    [setDeck, setIdx, setLibRecords, setIsCustomLib]
  );

  return {
    word,
    remaining: Math.max(0, deck.length - idx),
    total: deck.length,
    canUndo: idx > 0,
    isCustomLib,
    next,
    undo,
    resetDeck,
    applyCustomLib,
    libRecords,
    clearRecords,
  };
}
