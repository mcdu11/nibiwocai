import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { lib } from "../constants";

export interface LibRecord {
  word: string;
  pass?: boolean;
}

export function useRandomWord() {
  const [word, setWord] = useState<string>();
  const [libRecords, setLibRecords] = useLocalStorage<LibRecord[]>(
    "LIB_RECORDS",
    []
  );
  const [usedWords, setUsedWords] = useLocalStorage<string[]>("USED_WORD", []);

  // Mirror usedWords in a ref so getRandomWord always sees the latest value
  // without changing its identity on every render.
  const usedWordsRef = useRef(usedWords);
  useEffect(() => {
    usedWordsRef.current = usedWords;
  }, [usedWords]);

  const getRandomWord = useCallback(() => {
    const used = usedWordsRef.current;
    const available = lib.filter((item) => !used.includes(item));
    if (!available.length) return undefined;
    const next = available[Math.floor(Math.random() * available.length)];
    const nextUsed = [...used, next];
    usedWordsRef.current = nextUsed;
    setUsedWords(nextUsed);
    return next;
  }, [setUsedWords]);

  // Clear the "used" set and immediately pick a fresh word from the full lib.
  const resetWords = useCallback(() => {
    const next = lib[Math.floor(Math.random() * lib.length)];
    const nextUsed = [next];
    usedWordsRef.current = nextUsed;
    setUsedWords(nextUsed);
    setWord(next);
  }, [setUsedWords]);

  return {
    word,
    setWord,
    getRandomWord,
    resetWords,
    libRecords,
    setLibRecords,
    usedWords,
    setUsedWords,
  };
}
