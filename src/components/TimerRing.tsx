import React from "react";

interface TimerRingProps {
  count: number;
  total: number;
  lowTime: boolean;
  running: boolean;
  onToggle: () => void;
}

const SIZE = 168;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerRing({
  count,
  total,
  lowTime,
  running,
  onToggle,
}: TimerRingProps) {
  const progress = total > 0 ? Math.max(0, Math.min(1, count / total)) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const stroke = lowTime ? "var(--color-danger)" : "var(--color-accent)";

  return (
    <button
      type="button"
      className={`timer-ring ${lowTime ? "timer-ring--low" : ""}`}
      onClick={onToggle}
      aria-label={running ? "暂停" : "开始"}
      data-testid="timer-toggle"
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="var(--color-track)"
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={stroke}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.2s" }}
        />
      </svg>
      <div className="timer-ring__inner">
        <span className="timer-ring__count" data-testid="count">
          {count}
        </span>
        <span className="timer-ring__icon" aria-hidden>
          {running ? "❚❚" : "▶"}
        </span>
      </div>
    </button>
  );
}
