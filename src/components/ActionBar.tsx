import React from "react";

interface ActionBarProps {
  canAct: boolean;
  canUndo: boolean;
  onCorrect: () => void;
  onSkip: () => void;
  onUndo: () => void;
}

export function ActionBar({
  canAct,
  canUndo,
  onCorrect,
  onSkip,
  onUndo,
}: ActionBarProps) {
  return (
    <nav className="action-bar" aria-label="操作">
      <button
        type="button"
        className="action-bar__btn action-bar__btn--correct"
        onClick={onCorrect}
        disabled={!canAct}
        data-testid="btn-correct"
      >
        <span className="action-bar__label">正确</span>
        <span className="action-bar__shortcut" aria-hidden>
          →
        </span>
      </button>
      <button
        type="button"
        className="action-bar__btn action-bar__btn--skip"
        onClick={onSkip}
        disabled={!canAct}
        data-testid="btn-skip"
      >
        <span className="action-bar__label">跳过</span>
        <span className="action-bar__shortcut" aria-hidden>
          ↓
        </span>
      </button>
      <button
        type="button"
        className="action-bar__undo"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="撤销上一题"
        title="撤销 (←)"
        data-testid="btn-undo"
      >
        ↺
      </button>
    </nav>
  );
}
