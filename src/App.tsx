import {
  Button,
  Drawer,
  Grid,
  LinearProgress,
  TextField,
} from "@material-ui/core";
import { ArrowForward, CheckCircle, Undo } from "@material-ui/icons";
import React, { useCallback, useEffect, useRef } from "react";
import { useCountdown, useLocalStorage } from "usehooks-ts";
import "./App.css";
import { useRandomWord } from "./hooks/useRandomWord";

const MIN_SECONDS = 1;
const MAX_SECONDS = 999;

// Word card font size scales down with character length so long entries fit.
function fontSizeFor(len: number): number {
  if (len <= 4) return 160;
  if (len <= 6) return 130;
  if (len <= 8) return 100;
  if (len <= 12) return 76;
  if (len <= 18) return 56;
  return 42;
}

function App() {
  const [seconds, setSeconds] = useLocalStorage<number>(
    "COUNTDOWN_SECONDS",
    180
  );
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

  const [showRecords, setShowRecords] = React.useState(false);

  const {
    word,
    remaining,
    total,
    canUndo,
    next,
    undo,
    resetDeck,
    libRecords,
    clearRecords,
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
      // best-effort; ignore failures (e.g. blocked autoplay)
    }
  }, []);

  useEffect(() => {
    if (count === 0 && isCountingRef.current) {
      stop();
      playBeep();
    }
  }, [count, stop, playBeep]);

  useEffect(() => {
    reset();
  }, [seconds, reset]);

  const handleOperate = useCallback(
    (pass?: boolean) => {
      if (!word || count === 0) return;
      next(pass);
    },
    [word, count, next]
  );

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    undo();
  }, [canUndo, undo]);

  // Refs so the document-level key handler always sees the freshest closures.
  const handlersRef = useRef({
    toggleTimer: () => {},
    correct: () => {},
    skip: () => {},
    undo: () => {},
    pause: () => {},
  });
  handlersRef.current.toggleTimer = () => {
    if (isCountingRef.current) stop();
    else start();
  };
  handlersRef.current.correct = () => handleOperate(true);
  handlersRef.current.skip = () => handleOperate(undefined);
  handlersRef.current.undo = handleUndo;
  handlersRef.current.pause = stop;

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      // Don't hijack typing in the seconds input.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }
      const map: Record<string, (() => void) | undefined> = {
        " ": handlersRef.current.toggleTimer,
        ArrowRight: handlersRef.current.correct,
        ArrowUp: handlersRef.current.correct,
        ArrowDown: handlersRef.current.skip,
        ArrowLeft: handlersRef.current.undo,
        Escape: handlersRef.current.pause,
      };
      const fn = map[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    document.addEventListener("keyup", onKeyUp);
    return () => document.removeEventListener("keyup", onKeyUp);
  }, []);

  const recoverLib = () => {
    reset();
    resetDeck();
  };

  const hasRecords = libRecords.length > 0;
  const progress = seconds > 0 ? (count / seconds) * 100 : 0;
  const lowTime = count > 0 && count <= Math.min(10, Math.ceil(seconds * 0.2));

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-count">
          <span className={lowTime ? "count-low" : ""}>{count}</span>
          <TextField
            id="standard-number"
            label="设置倒计时时长"
            type="number"
            value={seconds}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              setSeconds(
                Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.floor(v)))
              );
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: MIN_SECONDS, max: MAX_SECONDS }}
          />
        </div>

        <LinearProgress
          className="countdown-bar"
          variant="determinate"
          value={progress}
          color={lowTime ? "secondary" : "primary"}
        />

        <div className="main">
          <span style={{ fontSize: word ? fontSizeFor(word.length) : 80 }}>
            {word || "没有词条了"}
          </span>
          <div className="remaining-hint">
            剩余词条 {remaining} / {total}
          </div>
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
                disabled={!word || count === 0}
              >
                正确
              </Button>
              <Button
                size="large"
                variant="contained"
                onClick={() => handleOperate(undefined)}
                disabled={!word || count === 0}
              >
                跳过
              </Button>
              <Button
                size="large"
                variant="contained"
                startIcon={<Undo />}
                onClick={handleUndo}
                disabled={!canUndo}
              >
                撤销
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

        <div className="shortcut-hint">
          快捷键：空格 开始/暂停 · → 正确 · ↓ 跳过 · ← 撤销 · Esc 暂停
        </div>
      </header>
      <Drawer
        anchor="right"
        open={showRecords}
        onClose={() => setShowRecords(false)}
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
            {libRecords.map((record, idx) => (
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
                {record.pass ? (
                  <CheckCircle color="primary" />
                ) : (
                  <ArrowForward color="primary" />
                )}
              </div>
            ))}
            <Button
              size="large"
              variant="contained"
              color="secondary"
              style={{ width: "50%", marginLeft: 20 }}
              onClick={clearRecords}
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
          onClick={recoverLib}
        >
          恢复词库
        </Button>
      </Drawer>
    </div>
  );
}

export default App;
