import { useContext } from 'react';
import { ThemeContext } from '../providers/ThemeProvider.js';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error('useTheme musí být použit uvnitř ThemeProvider.');
  return context;
}
