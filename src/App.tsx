import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { useCountdown, useLocalStorage } from "usehooks-ts";
import {
  Button,
  Checkbox,
  Container,
  Drawer,
  Grid,
  Paper,
  TextField,
} from "@material-ui/core";
import { useRandomWord } from "./hooks/useRandomWord";

function App() {
  const [intervalValue, setIntervalValue] = useState<number>(1000);
  const [seconds, setSeconds] = useState<number>(60);
  const [count, { start, stop, reset }] = useCountdown({
    seconds,
    interval: intervalValue,
    isIncrement: false,
  });

  const [showRecords, setShowRecords] = useState(false);

  const { word, setWord, getRandomWord, libRecords, setLibRecords } =
    useRandomWord();

  useEffect(() => {
    if (count === 0) {
      stop();
    }
  }, [count]);

  useEffect(() => {
    reset();
  }, [seconds]);

  useEffect(() => {
    const w = getRandomWord();
    setWord(w);
  }, []);

  const handleNext = () => {
    const w = getRandomWord();
    setWord(w);
  };

  const handleCorrect = () => {
    if (!word) {
      return;
    }
    // 记录当前的 词条
    setLibRecords((pre) => {
      pre.push({
        word: word || "",
        pass: true,
      });

      return pre;
    });

    setTimeout(() => {
      handleNext();
    }, 10);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-count">
          <span>{count}</span>
          <TextField
            id="standard-number"
            label="设置倒计时时长"
            type="number"
            value={seconds}
            onChange={(e) => {
              console.log(e.target.value);
              setSeconds(Number(e.target.value));
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </div>

        <div className="main">
          <span>{word || "没有词条了"}</span>
        </div>

        <Grid
          container
          spacing={3}
          style={{ flexGrow: 0, width: "100%", margin: 0 }}
        >
          <Grid item xs={4}></Grid>
          <Grid item xs={4}>
            <div className="timer-ctrl">
              <Button variant="contained" color="primary" onClick={start}>
                开始
              </Button>
              <Button variant="contained" onClick={stop}>
                暂停
              </Button>
              <Button variant="contained" onClick={reset}>
                重置
              </Button>
            </div>
          </Grid>
          <Grid item xs={4}>
            <div className="word-ctrl">
              <Button
                variant="contained"
                color="primary"
                onClick={handleCorrect}
              >
                正确
              </Button>
              <Button variant="contained" onClick={handleNext}>
                下一个
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowRecords(true)}
              >
                查看记录
              </Button>
            </div>
          </Grid>
        </Grid>
      </header>
      <Drawer
        anchor={"right"}
        open={showRecords}
        onClose={() => {
          setShowRecords(false);
        }}
      >
        {libRecords.map((record) => {
          return (
            <div style={{ width: 250, padding: "0 20px" }}>
              {record.word}:{" "}
              <Checkbox
                checked={record.pass}
                color="primary"
                inputProps={{ "aria-label": "secondary checkbox" }}
              />
            </div>
          );
        })}
      </Drawer>
    </div>
  );
}

export default App;
