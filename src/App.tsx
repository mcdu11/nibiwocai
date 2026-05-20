import {
  Button,
  Drawer,
  FormControlLabel,
  Switch,
  TextField,
  TextareaAutosize,
} from "@material-ui/core";
import React, { useCallback, useEffect, useRef } from "react";
import { useCountdown, useLocalStorage } from "usehooks-ts";
import "./App.css";
import { ActionBar } from "./components/ActionBar";
import { GameOverModal } from "./components/GameOverModal";
import { TimerRing } from "./components/TimerRing";
import { WordCard } from "./components/WordCard";
import {
  playCorrect,
  playSkip,
  playTimeUp,
  playUndo,
  vibrate,
} from "./feedback";
import { useRandomWord } from "./hooks/useRandomWord";
import { ThemeMode, useSettings } from "./hooks/useSettings";

const MIN_SECONDS = 1;
const MAX_SECONDS = 999;
const SECONDS_PRESETS = [60, 120, 180, 300];

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
  const originResetRef = useRef(originReset);
  originResetRef.current = originReset;

  // refs let us peek the latest count/seconds/libRecords inside callbacks
  // without forcing them into useCallback deps.
  const countRef = useRef(count);
  countRef.current = count;
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;

  const [roundStartLen, setRoundStartLen] = React.useState(0);
  const [showGameOver, setShowGameOver] = React.useState(false);

  const start = useCallback(() => {
    // Snapshot the records position when the player starts a *fresh* round
    // (timer at full). Pausing & resuming doesn't count.
    if (countRef.current === secondsRef.current) {
      // libRecords.length is read via libRecordsRef below; setRoundStartLen
      // captures it indirectly by reading inside the callback body.
      setRoundStartLen(libRecordsLenRef.current);
    }
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

  const [showSettings, setShowSettings] = React.useState(false);
  const [showRecords, setShowRecords] = React.useState(false);

  const {
    theme,
    setTheme,
    soundOn,
    setSoundOn,
    vibrationOn,
    setVibrationOn,
  } = useSettings();

  const settingsRef = useRef({ soundOn, vibrationOn });
  settingsRef.current = { soundOn, vibrationOn };

  const {
    word,
    idx,
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
  const [importMsg, setImportMsg] = React.useState("");
  const [exportMsg, setExportMsg] = React.useState("");

  const libRecordsLenRef = useRef(libRecords.length);
  libRecordsLenRef.current = libRecords.length;

  useEffect(() => {
    if (count === 0 && isCountingRef.current) {
      stop();
      if (settingsRef.current.soundOn) playTimeUp();
      if (settingsRef.current.vibrationOn) vibrate([200, 100, 200]);
      setShowGameOver(true);
    }
  }, [count, stop]);

  useEffect(() => {
    reset();
  }, [seconds, reset]);

  const handleOperate = useCallback(
    (pass?: boolean) => {
      if (!word || count === 0) return;
      next(pass);
      if (settingsRef.current.soundOn) {
        if (pass) playCorrect();
        else playSkip();
      }
      if (settingsRef.current.vibrationOn) {
        vibrate(pass ? 30 : 20);
      }
    },
    [word, count, next]
  );

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    undo();
    if (settingsRef.current.soundOn) playUndo();
    if (settingsRef.current.vibrationOn) vibrate(15);
  }, [canUndo, undo]);

  const toggleTimer = useCallback(() => {
    if (count === 0) return;
    if (isCountingRef.current) stop();
    else start();
  }, [count, start, stop]);

  const endRoundEarly = useCallback(() => {
    // Only when actually mid-round: timer not at full, not at zero.
    if (countRef.current >= secondsRef.current || countRef.current === 0) return;
    stop();
    if (settingsRef.current.vibrationOn) vibrate(40);
    setShowGameOver(true);
  }, [stop]);

  // Keep latest closures in a ref so the document-level key handler stays
  // registered once.
  const handlersRef = useRef({
    toggle: () => {},
    correct: () => {},
    skip: () => {},
    undo: () => {},
    pause: () => {},
  });
  handlersRef.current.toggle = toggleTimer;
  handlersRef.current.correct = () => handleOperate(true);
  handlersRef.current.skip = () => handleOperate(undefined);
  handlersRef.current.undo = handleUndo;
  handlersRef.current.pause = stop;

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }
      const map: Record<string, (() => void) | undefined> = {
        " ": handlersRef.current.toggle,
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
  };

  const handleClearRecords = () => {
    if (libRecords.length === 0) return;
    if (window.confirm("确认清除所有记录吗？")) {
      clearRecords();
      setExportMsg("");
    }
  };

  const handleExportRecords = async () => {
    if (libRecords.length === 0) return;
    const correct = libRecords.filter((r) => r.pass === true).length;
    const skip = libRecords.filter((r) => r.pass === undefined).length;
    const text = [
      "你比我猜 · 记录",
      `正确 ${correct} · 跳过 ${skip} · 合计 ${libRecords.length}`,
      "",
      ...libRecords.map((r) => `${r.pass ? "✓" : "↷"} ${r.word}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setExportMsg("已复制到剪贴板");
    } catch {
      setExportMsg("复制失败，请手动复制");
    }
    window.setTimeout(() => setExportMsg(""), 2200);
  };

  const isRunning = isCountingRef.current;
  const lowTime =
    count > 0 && count <= Math.min(10, Math.ceil(seconds * 0.2));
  const wordStatus: React.ComponentProps<typeof WordCard>["status"] =
    !word
      ? "exhausted"
      : count === 0
      ? "ended"
      : isRunning
      ? "running"
      : "idle";

  const correctCount = libRecords.filter((r) => r.pass === true).length;
  const skipCount = libRecords.filter((r) => r.pass === undefined).length;

  const roundRecords = libRecords.slice(roundStartLen);
  const roundCorrect = roundRecords.filter((r) => r.pass === true).length;
  const roundSkip = roundRecords.filter((r) => r.pass === undefined).length;

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: "auto", label: "跟随系统" },
    { value: "light", label: "浅色" },
    { value: "dark", label: "深色" },
  ];

  return (
    <div className="app">
      <header className="app__header">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setShowSettings(true)}
          aria-label="设置"
        >
          ⚙
        </button>
        <div className="app__title">你比我猜</div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setShowRecords(true)}
          aria-label="查看记录"
        >
          <span className="icon-btn__badge" data-testid="record-count">
            {libRecords.length}
          </span>
          📋
        </button>
      </header>

      <main className="app__main">
        <TimerRing
          count={count}
          total={seconds}
          lowTime={lowTime}
          running={isRunning}
          onToggle={toggleTimer}
        />

        <WordCard
          word={word}
          remaining={remaining}
          total={total}
          status={wordStatus}
          wordKey={idx}
        />
      </main>

      <ActionBar
        canAct={!!word && count > 0}
        canUndo={canUndo}
        onCorrect={() => handleOperate(true)}
        onSkip={() => handleOperate(undefined)}
        onUndo={handleUndo}
      />

      {count < seconds && count > 0 && (
        <button
          type="button"
          className="end-round"
          onClick={endRoundEarly}
          data-testid="end-round"
        >
          提前结束本轮 →
        </button>
      )}

      <div className="app__shortcuts" aria-hidden>
        空格 开始/暂停 · → 正确 · ↓ 跳过 · ← 撤销 · Esc 暂停
      </div>

      <Drawer
        anchor="right"
        open={showSettings}
        onClose={() => setShowSettings(false)}
        PaperProps={{ className: "drawer-paper" }}
      >
        <div className="drawer">
          <div className="drawer__title">设置</div>

          <section className="drawer__section">
            <div className="drawer__section-title">倒计时时长</div>
            <div className="time-presets" role="group" aria-label="时长预设">
              {SECONDS_PRESETS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="time-preset"
                  data-active={seconds === s}
                  onClick={() => setSeconds(s)}
                >
                  {s < 60 ? `${s} 秒` : `${s / 60} 分`}
                </button>
              ))}
            </div>
            <TextField
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
              variant="outlined"
              size="small"
              fullWidth
              helperText={`当前 ${seconds} 秒，修改后将自动重置`}
            />
          </section>

          <section className="drawer__section">
            <div className="drawer__section-title">外观</div>
            <div className="segmented" role="radiogroup" aria-label="主题">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={theme === opt.value}
                  className="segmented__item"
                  data-active={theme === opt.value}
                  onClick={() => setTheme(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section className="drawer__section">
            <div className="drawer__section-title">反馈</div>
            <FormControlLabel
              control={
                <Switch
                  checked={soundOn}
                  onChange={(e) => setSoundOn(e.target.checked)}
                  color="primary"
                />
              }
              label="声音提示"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={vibrationOn}
                  onChange={(e) => setVibrationOn(e.target.checked)}
                  color="primary"
                />
              }
              label="震动反馈"
            />
          </section>

          <section className="drawer__section">
            <div className="drawer__section-title">
              词库
              <span className="drawer__chip">
                {isCustomLib ? "自定义" : "默认"} · {total} 词
              </span>
            </div>
            <TextareaAutosize
              minRows={4}
              placeholder="粘贴自定义词库：每行一个，或用逗号 / 空格分隔"
              value={customLibInput}
              onChange={(e) => setCustomLibInput(e.target.value)}
              className="drawer__textarea"
            />
            {importMsg && <div className="drawer__msg">{importMsg}</div>}
            <div className="drawer__actions">
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplyCustomLib}
                disabled={!customLibInput.trim()}
              >
                应用自定义
              </Button>
              <Button variant="outlined" onClick={recoverLib}>
                恢复默认
              </Button>
            </div>
          </section>
        </div>
      </Drawer>

      <Drawer
        anchor="right"
        open={showRecords}
        onClose={() => setShowRecords(false)}
        PaperProps={{ className: "drawer-paper" }}
      >
        <div className="drawer">
          <div className="drawer__title">本局记录</div>

          <div className="stats">
            <div className="stats__card stats__card--correct">
              <div className="stats__num">{correctCount}</div>
              <div className="stats__label">正确</div>
            </div>
            <div className="stats__card stats__card--skip">
              <div className="stats__num">{skipCount}</div>
              <div className="stats__label">跳过</div>
            </div>
            <div className="stats__card">
              <div className="stats__num">{libRecords.length}</div>
              <div className="stats__label">合计</div>
            </div>
          </div>

          {libRecords.length === 0 ? (
            <div className="drawer__empty">暂无记录</div>
          ) : (
            <ul className="record-list">
              {libRecords.map((record, idx) => (
                <li
                  key={idx}
                  className={`record-list__item record-list__item--${
                    record.pass ? "correct" : "skip"
                  }`}
                >
                  <span className="record-list__word">{record.word}</span>
                  <span className="record-list__tag">
                    {record.pass ? "✓ 正确" : "↷ 跳过"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {exportMsg && <div className="drawer__msg">{exportMsg}</div>}

          <div className="drawer__actions drawer__actions--sticky">
            <Button
              variant="contained"
              color="primary"
              onClick={handleExportRecords}
              disabled={libRecords.length === 0}
            >
              导出
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClearRecords}
              disabled={libRecords.length === 0}
            >
              清除记录
            </Button>
          </div>
        </div>
      </Drawer>

      <GameOverModal
        open={showGameOver}
        correct={roundCorrect}
        skip={roundSkip}
        durationSeconds={seconds}
        onNewRound={() => {
          setShowGameOver(false);
          reset();
        }}
        onViewRecords={() => {
          setShowGameOver(false);
          setShowRecords(true);
        }}
        onClose={() => setShowGameOver(false)}
      />
    </div>
  );
}

export default App;
