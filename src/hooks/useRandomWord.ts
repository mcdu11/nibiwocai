import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { lib } from "../constants";

const libCopy: string[] = JSON.parse(JSON.stringify(lib));

export function useRandomWord() {
  const [word, setWord] = useState<string>();
  const [libRecords, setLibRecords] = useLocalStorage<
    Array<{
      word: string;
      pass?: boolean;
    }>
  >("LIB_RECORDS", []);

  const [usedWords, setUsedWords] = useLocalStorage<string[]>("USED_WORD", []);

  const getRandomWord = () => {
    // 可选择的 lib 列表
    const libAvailable = libCopy.filter(
      (item) => !usedWords.some((a) => a === item)
    );

    // console.log(libAvailable);
    if (!libAvailable.length) {
      return;
    }
    const idx = Math.floor(Math.random() * libAvailable.length);

    const word = libAvailable[idx];

    setUsedWords((pre) => {
      pre.push(word);
      return pre;
    });

    // console.log(word);

    return word;
  };

  return { word, setWord, getRandomWord, libRecords, setLibRecords, setUsedWords };
}
