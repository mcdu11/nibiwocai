import { Button, Drawer, Grid, TextField } from "@material-ui/core";
import { ArrowForward, Cancel, CheckCircle } from "@material-ui/icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCountdown } from "usehooks-ts";
import "./App.css";
import { useRandomWord } from "./hooks/useRandomWord";

function App() {
  const [seconds, setSeconds] = useState<number>(180);
  const [count, { start: originStart, stop: originStop, reset: originReset }] =
    useCountdown({
      seconds,
      interval: 1000,
      isIncrement: false,
    });

  const isCountingRef = useRef(false);

  const start = useCallback(() => {
    originStart();
    isCountingRef.current = true;
  }, [originStart]);

  const stop = useCallback(() => {
    originStop();
    isCountingRef.current = false;
  }, [originStop]);

  const reset = useCallback(() => {
    originReset();
    isCountingRef.current = false;
  }, [originReset]);

  const [showRecords, setShowRecords] = useState(false);

  const {
    word,
    setWord,
    getRandomWord,
    resetWords,
    libRecords,
    setLibRecords,
  } = useRandomWord();

  const playBeep = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio is best-effort; ignore failures (e.g. blocked autoplay).
    }
  }, []);

  // Stop the timer and beep when the countdown reaches zero during a round.
  useEffect(() => {
    if (count === 0 && isCountingRef.current) {
      stop();
      playBeep();
    }
  }, [count, stop, playBeep]);

  useEffect(() => {
    reset();
  }, [seconds, reset]);

  useEffect(() => {
    setWord(getRandomWord());
  }, [getRandomWord, setWord]);

  const handleOperate = useCallback(
    (pass?: boolean) => {
      if (!word || count === 0) {
        return;
      }
      setLibRecords((pre) => [...pre, { word, pass }]);
      setWord(getRandomWord());
    },
    [word, count, setLibRecords, setWord, getRandomWord]
  );

  // Keep the latest handlers in refs so the global key listener (registered
  // once) always invokes the freshest closures.
  const toggleTimerRef = useRef<() => void>(() => {});
  const nextWordRef = useRef<() => void>(() => {});
  toggleTimerRef.current = () => {
    if (isCountingRef.current) {
      stop();
    } else {
      start();
    }
  };
  nextWordRef.current = () => handleOperate(undefined);

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        toggleTimerRef.current();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        nextWordRef.current();
      }
    };
    document.addEventListener("keyup", onKeyUp);
    return () => document.removeEventListener("keyup", onKeyUp);
  }, []);

  const clearRecord = () => setLibRecords([]);

  const recoverLib = () => {
    setLibRecords([]);
    reset();
    resetWords();
  };

  const hasRecords = !!libRecords.length;

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
              const v = Number(e.target.value);
              setSeconds(Number.isFinite(v) && v > 0 ? Math.floor(v) : 1);
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: 1 }}
          />
        </div>

        <div className="main">
          <span>{word || "没有词条了"}</span>
        </div>

        <Grid
          container
          className="operation"
          spacing={3}
          style={{ flexGrow: 0, width: "100%", margin: 0 }}
        >
          <Grid item xs={3}></Grid>
          <Grid item xs={4}>
            <div className="timer-ctrl">
              <Button
                size="large"
                variant="contained"
                color="primary"
                onClick={start}
              >
                开始
              </Button>
              <Button
                size="large"
                variant="contained"
                color="secondary"
                onClick={stop}
              >
                暂停
              </Button>
              <Button size="large" variant="contained" onClick={reset}>
                重置
              </Button>
            </div>
          </Grid>
          <Grid item xs={4}>
            <div className="word-ctrl">
              <Button
                size="large"
                variant="contained"
                color="primary"
                onClick={() => handleOperate(true)}
              >
                正确
              </Button>
              <Button
                size="large"
                variant="contained"
                onClick={() => handleOperate(undefined)}
              >
                跳过
              </Button>
              <Button
                size="large"
                variant="contained"
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
        {hasRecords ? (
          <>
            <div style={{ marginLeft: 20 }}>
              <div>
                正确：{libRecords.filter((item) => item.pass === true).length}
              </div>
              <div>
                跳过：
                {libRecords.filter((item) => item.pass === undefined).length}
              </div>
            </div>
            {libRecords.map((record, idx) => {
              return (
                <div
                  key={idx}
                  style={{
                    width: 250,
                    padding: "10px 20px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span style={{ display: "inline-block", width: "150px" }}>
                    {record.word}:
                  </span>
                  {record.pass && <CheckCircle color="primary" />}
                  {record.pass === false && <Cancel color="error" />}
                  {record.pass === undefined && (
                    <ArrowForward color="primary" />
                  )}
                </div>
              );
            })}
            <Button
              size="large"
              variant="contained"
              color="secondary"
              style={{ width: "50%", marginLeft: 20 }}
              onClick={() => clearRecord()}
            >
              清除记录
            </Button>
          </>
        ) : (
          <div style={{ width: 250, padding: "20px" }}>暂无记录</div>
        )}
        <Button
          size="large"
          variant="contained"
          color="primary"
          style={{ marginTop: 20, width: "50%", marginLeft: 20 }}
          onClick={() => recoverLib()}
        >
          恢复词库
        </Button>
      </Drawer>
    </div>
  );
}

export default App;
