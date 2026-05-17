import {
  Button,
  Drawer,
  Grid,
  LinearProgress,
  Snackbar,
  TextField,
  TextareaAutosize,
} from "@material-ui/core";
import { ArrowForward, CheckCircle, Undo } from "@material-ui/icons";
import React, { useCallback, useEffect, useRef } from "react";
import { useCountdown, useLocalStorage } from "usehooks-ts";
import "./App.css";
import { useRandomWord } from "./hooks/useRandomWord";

const MIN_SECONDS = 1;
const MAX_SECONDS = 999;

// Word card font size scales with character length and viewport (mobile-friendly).
function fontSizeFor(len: number): string {
  if (len <= 4) return "clamp(64px, 18vmin, 160px)";
  if (len <= 6) return "clamp(54px, 14vmin, 130px)";
  if (len <= 8) return "clamp(44px, 11vmin, 100px)";
  if (len <= 12) return "clamp(34px, 9vmin, 76px)";
  if (len <= 18) return "clamp(28px, 7vmin, 56px)";
  return "clamp(22px, 6vmin, 42px)";
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

  // useCountdown's reset is re-created every render (no useCallback inside the
  // library). Hide that behind a ref so our `reset` keeps a stable identity
  // and is safe to put in effect dependency arrays.
  const originResetRef = useRef(originReset);
  originResetRef.current = originReset;

  const start = useCallback(() => {
    originStart();
    isCountingRef.current = true;
  }, [originStart]);

  const stop = useCallback(() => {
    originStop();
    isCountingRef.current = false;
  }, [originStop]);

  const reset = useCallback(() => {
    originResetRef.current();
    isCountingRef.current = false;
  }, []);

  const [showRecords, setShowRecords] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState("");

  const {
    word,
    remaining,
    total,
    canUndo,
    isCustomLib,
    next,
    undo,
    resetDeck,
    applyCustomLib,
    libRecords,
    clearRecords,
  } = useRandomWord();

  const [customLibInput, setCustomLibInput] = React.useState("");
  const [importMsg, setImportMsg] = React.useState<string>("");

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
      if (!word || count === 0) {
        setSnackbarMsg("请先开始计时后再操作词条");
        return;
      }
      next(pass);
      setSnackbarMsg(pass ? "已标记为正确" : "已跳过，进入下一题");
    },
    [word, count, next]
  );

  const handleUndo = useCallback(() => {
    if (!canUndo) {
      setSnackbarMsg("暂无可撤销操作");
      return;
    }
    undo();
    setSnackbarMsg("已撤销上一步");
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
    setImportMsg("");
  };

  const handleApplyCustomLib = () => {
    const n = applyCustomLib(customLibInput);
    if (n === 0) {
      setImportMsg("请粘贴至少一个词条（按行、逗号或空格分隔）");
      return;
    }
    reset();
    setCustomLibInput("");
    setImportMsg(`已应用自定义词库，共 ${n} 个词条`);
    setSnackbarMsg(`自定义词库已生效（${n} 词）`);
  };

  const hasRecords = libRecords.length > 0;
  const isIdle = !isCountingRef.current;
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
          <span
            style={{
              fontSize: word ? fontSizeFor(word.length) : "clamp(44px, 11vmin, 80px)",
            }}
          >
            {word || "没有词条了"}
          </span>
          <div className="remaining-hint">
            剩余词条 {remaining} / {total}
          </div>
        </div>

        <Grid
          container
          className="operation"
          spacing={2}
          justifyContent="center"
          style={{ flexGrow: 0, width: "100%", margin: 0 }}
        >
          <Grid item xs={12} sm={5}>
            <div className="timer-ctrl">
              <Button
                size="large"
                variant="contained"
                color="primary"
                onClick={start}
                disabled={!word || !isIdle}
              >
                开始
              </Button>
              <Button
                size="large"
                variant="contained"
                color="secondary"
                onClick={stop}
                disabled={isIdle}
              >
                暂停
              </Button>
              <Button size="large" variant="contained" onClick={reset}>
                重置
              </Button>
            </div>
          </Grid>
          <Grid item xs={12} sm={5}>
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
              onClick={() => {
                clearRecords();
                setSnackbarMsg("记录已清除");
              }}
            >
              清除记录
            </Button>
          </>
        ) : (
          <div style={{ width: 250, padding: "20px" }}>暂无记录</div>
        )}
        <div className="lib-import">
          <div className="lib-import-title">
            词库 · 当前：{isCustomLib ? "自定义" : "默认"}（共 {total} 词）
          </div>
          <TextareaAutosize
            minRows={4}
            placeholder="粘贴自定义词库：每行一个，或用逗号 / 空格分隔"
            value={customLibInput}
            onChange={(e) => setCustomLibInput(e.target.value)}
            className="lib-import-textarea"
          />
          {importMsg && <div className="lib-import-msg">{importMsg}</div>}
          <div className="lib-import-actions">
            <Button
              variant="contained"
              color="primary"
              onClick={handleApplyCustomLib}
              disabled={!customLibInput.trim()}
            >
              应用自定义
            </Button>
            <Button variant="contained" onClick={recoverLib}>
              恢复默认词库
            </Button>
          </div>
        </div>
      </Drawer>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={Boolean(snackbarMsg)}
        autoHideDuration={1600}
        onClose={() => setSnackbarMsg("")}
        message={snackbarMsg}
      />
    </div>
  );
}

export default App;
