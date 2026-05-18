import React, { useEffect, useRef, useState } from "react";

interface WordCardProps {
  word: string | undefined;
  remaining: number;
  total: number;
  status: "idle" | "running" | "ended" | "exhausted";
  wordKey: number;
}

// Font size scales with character length and viewport so long entries fit.
function fontSizeFor(len: number): string {
  if (len <= 4) return "clamp(56px, 16vmin, 144px)";
  if (len <= 6) return "clamp(48px, 13vmin, 116px)";
  if (len <= 8) return "clamp(40px, 10vmin, 92px)";
  if (len <= 12) return "clamp(30px, 8vmin, 68px)";
  if (len <= 18) return "clamp(24px, 6vmin, 50px)";
  return "clamp(20px, 5vmin, 40px)";
}

const STATUS_LABEL: Record<WordCardProps["status"], string> = {
  idle: "已暂停 · 点击计时器开始",
  running: "倒计时进行中",
  ended: "时间到 · 重置或调整时长后继续",
  exhausted: "本副牌已抽完 · 在设置里恢复词库",
};

type Direction = "next" | "back" | "initial";

export function WordCard({
  word,
  remaining,
  total,
  status,
  wordKey,
}: WordCardProps) {
  const prevKeyRef = useRef(wordKey);
  const [direction, setDirection] = useState<Direction>("initial");
  // Bump key per word change so the entrance animation restarts.
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const prev = prevKeyRef.current;
    if (wordKey === prev) return;
    setDirection(wordKey > prev ? "next" : "back");
    setAnimKey((k) => k + 1);
    prevKeyRef.current = wordKey;
  }, [wordKey]);

  return (
    <section className="word-card" data-testid="word-card">
      <div
        key={animKey}
        className={`word-card__word word-card__word--${direction}`}
        data-testid="word"
        style={{
          fontSize: word ? fontSizeFor(word.length) : "clamp(36px, 9vmin, 64px)",
        }}
      >
        {word || "没有词条了"}
      </div>
      <div className="word-card__meta">
        <span className="word-card__remaining" data-testid="remaining">
          剩余 {remaining} / {total}
        </span>
        <span className={`word-card__status word-card__status--${status}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>
    </section>
  );
}
