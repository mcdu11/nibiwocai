import React, { useEffect } from "react";

interface GameOverModalProps {
  open: boolean;
  correct: number;
  skip: number;
  durationSeconds: number;
  onNewRound: () => void;
  onViewRecords: () => void;
  onClose: () => void;
}

export function GameOverModal({
  open,
  correct,
  skip,
  durationSeconds,
  onNewRound,
  onViewRecords,
  onClose,
}: GameOverModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const total = correct + skip;
  return (
    <div
      className="game-over"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      data-testid="game-over"
      onClick={onClose}
    >
      <div
        className="game-over__card"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="game-over-title" className="game-over__title">
          时间到！
        </div>
        <div className="game-over__stats">
          <div className="game-over__stat">
            <div className="game-over__num game-over__num--correct">
              {correct}
            </div>
            <div className="game-over__label">正确</div>
          </div>
          <div className="game-over__stat">
            <div className="game-over__num game-over__num--skip">{skip}</div>
            <div className="game-over__label">跳过</div>
          </div>
          <div className="game-over__stat">
            <div className="game-over__num">{total}</div>
            <div className="game-over__label">合计</div>
          </div>
        </div>
        <div className="game-over__meta">用时 {durationSeconds} 秒</div>
        <div className="game-over__actions">
          <button
            type="button"
            className="game-over__btn game-over__btn--primary"
            onClick={onNewRound}
            data-testid="game-over-new"
          >
            开新一轮
          </button>
          <button
            type="button"
            className="game-over__btn"
            onClick={onViewRecords}
          >
            查看记录
          </button>
          <button
            type="button"
            className="game-over__btn game-over__btn--ghost"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
