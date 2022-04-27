import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { lib } from "../constants";

const libCopy: string[] = JSON.parse(JSON.stringify(lib));

export function useRandomWord() {
  const [word, setWord] = useState<string>();
  const [libRecords, setLibRecords] = useLocalStorage<
    Array<{
      word: string;
      pass: boolean;
    }>
  >("LIB_RECORDS", []);

  const getRandomWord = () => {
    // 可选择的 lib 列表
    const libAvailable = libCopy.filter(
      (item) => !libRecords.some((a) => a.word === item)
    );

    console.log(libAvailable);
    if (!libAvailable.length) {
      return;
    }
    const idx = Math.floor(Math.random() * libAvailable.length);

    const word = libAvailable[idx];

    // console.log(word);

    return word;
  };

  return { word, setWord, getRandomWord, libRecords, setLibRecords };
}
