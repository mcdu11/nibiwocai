import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { lib } from "../constants";
import { useRandomWord } from "./useRandomWord";

type HookResult = ReturnType<typeof useRandomWord>;

function renderHook(): { result: { current: HookResult }; unmount: () => void } {
  const result = { current: undefined as unknown as HookResult };
  function HookHost() {
    result.current = useRandomWord();
    return null;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  // eslint-disable-next-line testing-library/no-unnecessary-act
  act(() => {
    ReactDOM.render(<HookHost />, container);
  });
  return {
    result,
    unmount: () => {
      // eslint-disable-next-line testing-library/no-unnecessary-act
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    },
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("useRandomWord", () => {
  test("starts with a full deck and a current word", () => {
    const { result, unmount } = renderHook();
    expect(result.current.word).toBeDefined();
    expect(result.current.total).toBe(lib.length);
    expect(result.current.remaining).toBe(lib.length);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.libRecords).toEqual([]);
    unmount();
  });

  test("next() records the current word and advances", () => {
    const { result, unmount } = renderHook();
    const first = result.current.word!;
    act(() => result.current.next(true));
    expect(result.current.libRecords).toEqual([{ word: first, pass: true }]);
    expect(result.current.word).not.toBe(first);
    expect(result.current.remaining).toBe(lib.length - 1);
    expect(result.current.canUndo).toBe(true);
    unmount();
  });

  test("undo() restores the previous word and pops the record", () => {
    const { result, unmount } = renderHook();
    const first = result.current.word!;
    act(() => result.current.next(true));
    act(() => result.current.undo());
    expect(result.current.word).toBe(first);
    expect(result.current.libRecords).toEqual([]);
    expect(result.current.canUndo).toBe(false);
    unmount();
  });

  test("undo() at the start is a no-op", () => {
    const { result, unmount } = renderHook();
    const first = result.current.word!;
    act(() => result.current.undo());
    expect(result.current.word).toBe(first);
    expect(result.current.libRecords).toEqual([]);
    unmount();
  });

  test("consumes the whole deck without repeats and stops at the end", () => {
    const { result, unmount } = renderHook();
    const seen = new Set<string>();
    while (result.current.word) {
      seen.add(result.current.word);
      act(() => result.current.next(undefined));
    }
    expect(seen.size).toBe(lib.length);
    expect(result.current.remaining).toBe(0);

    const recordsBefore = result.current.libRecords.length;
    act(() => result.current.next(true));
    expect(result.current.libRecords.length).toBe(recordsBefore);
    unmount();
  });

  test("resetDeck() reshuffles, clears records, and picks a fresh word", () => {
    const { result, unmount } = renderHook();
    act(() => result.current.next(true));
    act(() => result.current.next(undefined));
    expect(result.current.libRecords.length).toBe(2);

    act(() => result.current.resetDeck());
    expect(result.current.libRecords).toEqual([]);
    expect(result.current.remaining).toBe(lib.length);
    expect(result.current.word).toBeDefined();
    expect(result.current.canUndo).toBe(false);
    unmount();
  });

  test("applyCustomLib() replaces the deck and flips isCustomLib", () => {
    const { result, unmount } = renderHook();
    let applied = 0;
    act(() => {
      applied = result.current.applyCustomLib("aaa, bbb\nccc ddd\nbbb");
    });
    expect(applied).toBe(4);
    expect(result.current.total).toBe(4);
    expect(result.current.remaining).toBe(4);
    expect(result.current.isCustomLib).toBe(true);
    expect(["aaa", "bbb", "ccc", "ddd"]).toContain(result.current.word);
    unmount();
  });

  test("applyCustomLib() rejects empty input and returns 0", () => {
    const { result, unmount } = renderHook();
    const beforeTotal = result.current.total;
    let applied = -1;
    act(() => {
      applied = result.current.applyCustomLib("   \n , ; ");
    });
    expect(applied).toBe(0);
    expect(result.current.total).toBe(beforeTotal);
    expect(result.current.isCustomLib).toBe(false);
    unmount();
  });

  test("resetDeck() also clears isCustomLib", () => {
    const { result, unmount } = renderHook();
    act(() => {
      result.current.applyCustomLib("a b c");
    });
    expect(result.current.isCustomLib).toBe(true);
    act(() => result.current.resetDeck());
    expect(result.current.isCustomLib).toBe(false);
    expect(result.current.total).toBe(lib.length);
    unmount();
  });

  test("clearRecords() empties history without touching the deck", () => {
    const { result, unmount } = renderHook();
    act(() => result.current.next(true));
    act(() => result.current.next(undefined));
    const remainingBefore = result.current.remaining;
    act(() => result.current.clearRecords());
    expect(result.current.libRecords).toEqual([]);
    expect(result.current.remaining).toBe(remainingBefore);
    unmount();
  });
});
