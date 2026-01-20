/**
 * React hook for Telegram Mini App features
 *
 * Provides reactive state for Telegram environment detection and features.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isTelegramWebApp,
  initTelegramApp,
  hapticFeedback,
  getTelegramUser,
  getTelegramTheme,
  getTelegramColorScheme,
} from '../utils/telegram';

interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
}

interface TelegramTheme {
  bgColor: string;
  textColor: string;
  hintColor: string;
  linkColor: string;
  buttonColor: string;
  buttonTextColor: string;
  secondaryBgColor: string;
}

interface UseTelegramResult {
  /** Whether the app is running inside Telegram */
  isTelegram: boolean;
  /** Telegram user info (if available) */
  user: TelegramUser | null;
  /** Telegram theme colors */
  theme: TelegramTheme | null;
  /** Color scheme: 'light' or 'dark' */
  colorScheme: 'light' | 'dark';
  /** Trigger haptic feedback */
  haptic: (type?: 'impact' | 'notification' | 'selection', style?: 'light' | 'medium' | 'heavy') => void;
}

export function useTelegram(): UseTelegramResult {
  const [isTelegram] = useState(() => isTelegramWebApp());
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [theme, setTheme] = useState<TelegramTheme | null>(null);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    if (!isTelegram) return;

    // Initialize Telegram app
    initTelegramApp();

    // Get user info
    const telegramUser = getTelegramUser();
    if (telegramUser) {
      setUser(telegramUser);
    }

    // Get theme
    const telegramTheme = getTelegramTheme();
    if (telegramTheme) {
      setTheme(telegramTheme);
    }

    // Get color scheme
    setColorScheme(getTelegramColorScheme());
  }, [isTelegram]);

  const haptic = useCallback(
    (type: 'impact' | 'notification' | 'selection' = 'impact', style?: 'light' | 'medium' | 'heavy') => {
      hapticFeedback(type, style);
    },
    []
  );

  return {
    isTelegram,
    user,
    theme,
    colorScheme,
    haptic,
  };
}
