import React from "react";
import ReactDOM from "react-dom";
import { Simulate, act } from "react-dom/test-utils";
import App from "./App";

function byTestId(container: HTMLElement, id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!el) throw new Error(`Element not found: data-testid=${id}`);
  return el as HTMLElement;
}

function getCount(container: HTMLElement): number {
  return Number(byTestId(container, "count").textContent);
}

function getWord(container: HTMLElement): string {
  return byTestId(container, "word").textContent || "";
}

describe("App integration", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      ReactDOM.unmountComponentAtNode(container);
    });
    container.remove();
    jest.useRealTimers();
  });

  test("clicking the timer toggles the countdown", () => {
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      ReactDOM.render(<App />, container);
    });

    expect(getCount(container)).toBe(180);

    act(() => {
      Simulate.click(byTestId(container, "timer-toggle"));
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const ticked = getCount(container);
    expect(ticked).toBeLessThan(180);
    expect(ticked).toBeGreaterThanOrEqual(176);
  });

  test("pressing the timer again halts the countdown", () => {
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      ReactDOM.render(<App />, container);
    });

    const toggle = byTestId(container, "timer-toggle");
    act(() => {
      Simulate.click(toggle);
    });
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    const mid = getCount(container);
    expect(mid).toBeLessThan(180);

    act(() => {
      Simulate.click(byTestId(container, "timer-toggle"));
    });
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(getCount(container)).toBe(mid);
  });

  test("clicking 正确 records the current word and advances", () => {
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      ReactDOM.render(<App />, container);
    });

    const before = getWord(container);
    expect(before).toBeTruthy();

    act(() => {
      Simulate.click(byTestId(container, "btn-correct"));
    });

    const after = getWord(container);
    expect(after).toBeTruthy();
    expect(after).not.toBe(before);

    const stored = JSON.parse(localStorage.getItem("LIB_RECORDS") || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual({ word: before, pass: true });
  });

  test("clicking 跳过 records pass=undefined", () => {
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      ReactDOM.render(<App />, container);
    });

    const before = getWord(container);
    act(() => {
      Simulate.click(byTestId(container, "btn-skip"));
    });

    const stored = JSON.parse(localStorage.getItem("LIB_RECORDS") || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].word).toBe(before);
    expect(stored[0].pass).toBeUndefined();
  });

  test("game-over modal appears when the timer runs out", () => {
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      ReactDOM.render(<App />, container);
    });

    expect(container.querySelector('[data-testid="game-over"]')).toBeNull();

    act(() => {
      Simulate.click(byTestId(container, "timer-toggle"));
    });

    act(() => {
      jest.advanceTimersByTime(180_000);
    });

    expect(getCount(container)).toBe(0);
    expect(
      container.querySelector('[data-testid="game-over"]')
    ).not.toBeNull();
  });

  test("undo restores the previous word", () => {
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      ReactDOM.render(<App />, container);
    });
    const first = getWord(container);

    act(() => {
      Simulate.click(byTestId(container, "btn-correct"));
    });
    const second = getWord(container);
    expect(second).not.toBe(first);

    act(() => {
      Simulate.click(byTestId(container, "btn-undo"));
    });
    expect(getWord(container)).toBe(first);

    const stored = JSON.parse(localStorage.getItem("LIB_RECORDS") || "[]");
    expect(stored).toHaveLength(0);
  });
});
