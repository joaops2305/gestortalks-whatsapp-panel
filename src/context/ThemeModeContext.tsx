'use client';

import { createContext, useContext } from 'react';

export type ThemeMode = 'light' | 'dark';

type ThemeModeContextValue = {
  mode: ThemeMode;
  toggleMode: () => void;
};

export const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'light',
  toggleMode: () => undefined,
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
