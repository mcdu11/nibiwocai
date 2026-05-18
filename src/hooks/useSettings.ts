import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

export type ThemeMode = "auto" | "light" | "dark";

export interface Settings {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
  vibrationOn: boolean;
  setVibrationOn: (v: boolean) => void;
}

export function useSettings(): Settings {
  const [theme, setTheme] = useLocalStorage<ThemeMode>("THEME", "auto");
  const [soundOn, setSoundOn] = useLocalStorage<boolean>("SOUND_ON", true);
  const [vibrationOn, setVibrationOn] = useLocalStorage<boolean>(
    "VIBRATION_ON",
    true
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return {
    theme,
    setTheme,
    soundOn,
    setSoundOn,
    vibrationOn,
    setVibrationOn,
  };
}
