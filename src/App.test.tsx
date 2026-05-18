import React from "react";
import ReactDOM from "react-dom";
import { Simulate, act } from "react-dom/test-utils";
import App from "./App";

function findButton(container: HTMLElement, label: string): HTMLButtonElement {
  const btn = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(label)
  );
  if (!btn) throw new Error(`Button not found: ${label}`);
  return btn as HTMLButtonElement;
}

function getCount(container: HTMLElement): number {
  const span = container.querySelector(".header-count span");
  if (!span) throw new Error("Count span not found");
  return Number(span.textContent);
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

  test("clicking 开始 starts the countdown ticking down", () => {
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      ReactDOM.render(<App />, container);
    });

    expect(getCount(container)).toBe(180);

    const startBtn = findButton(container, "开始");
    act(() => {
      Simulate.click(startBtn);
    });

    // Advance 3 seconds of fake time; useInterval should tick three times.
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const after = getCount(container);
    expect(after).toBeLessThan(180);
    expect(after).toBeGreaterThanOrEqual(176);
  });

  test("pressing 暂停 halts the countdown", () => {
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      ReactDOM.render(<App />, container);
    });

    act(() => {
      Simulate.click(findButton(container, "开始"));
    });
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    const mid = getCount(container);
    expect(mid).toBeLessThan(180);

    act(() => {
      Simulate.click(findButton(container, "暂停"));
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

    const before = container.querySelector(".main span")?.textContent;
    expect(before).toBeTruthy();

    act(() => {
      Simulate.click(findButton(container, "正确"));
    });

    const after = container.querySelector(".main span")?.textContent;
    expect(after).toBeTruthy();
    expect(after).not.toBe(before);

    const stored = JSON.parse(localStorage.getItem("LIB_RECORDS") || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual({ word: before, pass: true });
  });
});
