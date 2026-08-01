import { createContext, useContext, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

type ThemeModeContextValue = {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  return (
    <ThemeModeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }

  return context;
}
