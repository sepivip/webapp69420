/**
 * Telegram Mini App utilities
 *
 * Provides detection and wrapper functions for Telegram Web App SDK.
 * Safe to import on web - functions gracefully handle non-Telegram environment.
 */

import WebApp from '@twa-dev/sdk';

/**
 * Check if the app is running inside Telegram Mini App
 */
export function isTelegramWebApp(): boolean {
  try {
    return WebApp.initData !== '' && WebApp.platform !== 'unknown';
  } catch {
    return false;
  }
}

/**
 * Initialize Telegram Mini App
 * Call this early in app lifecycle
 */
export function initTelegramApp(): void {
  if (!isTelegramWebApp()) return;

  try {
    // Signal that the app is ready
    WebApp.ready();

    // Expand to full height
    WebApp.expand();

    // Enable closing confirmation if user has unsaved data
    WebApp.enableClosingConfirmation();
  } catch (error) {
    console.warn('Failed to initialize Telegram app:', error);
  }
}

/**
 * Trigger haptic feedback (vibration)
 */
export function hapticFeedback(
  type: 'impact' | 'notification' | 'selection' = 'impact',
  style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
): void {
  if (!isTelegramWebApp()) return;

  try {
    if (type === 'impact') {
      WebApp.HapticFeedback.impactOccurred(style || 'medium');
    } else if (type === 'notification') {
      WebApp.HapticFeedback.notificationOccurred('success');
    } else if (type === 'selection') {
      WebApp.HapticFeedback.selectionChanged();
    }
  } catch (error) {
    // Haptic feedback not available
  }
}

/**
 * Get Telegram user info (if available)
 */
export function getTelegramUser(): { id: number; firstName: string; lastName?: string; username?: string } | null {
  if (!isTelegramWebApp()) return null;

  try {
    const user = WebApp.initDataUnsafe.user;
    if (user) {
      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
      };
    }
  } catch {
    // User data not available
  }
  return null;
}

/**
 * Get Telegram theme colors
 */
export function getTelegramTheme(): {
  bgColor: string;
  textColor: string;
  hintColor: string;
  linkColor: string;
  buttonColor: string;
  buttonTextColor: string;
  secondaryBgColor: string;
} | null {
  if (!isTelegramWebApp()) return null;

  try {
    const theme = WebApp.themeParams;
    return {
      bgColor: theme.bg_color || '#ffffff',
      textColor: theme.text_color || '#000000',
      hintColor: theme.hint_color || '#999999',
      linkColor: theme.link_color || '#2678b6',
      buttonColor: theme.button_color || '#2678b6',
      buttonTextColor: theme.button_text_color || '#ffffff',
      secondaryBgColor: theme.secondary_bg_color || '#f0f0f0',
    };
  } catch {
    return null;
  }
}

/**
 * Get the Telegram color scheme (light/dark)
 */
export function getTelegramColorScheme(): 'light' | 'dark' {
  if (!isTelegramWebApp()) return 'dark';

  try {
    return WebApp.colorScheme || 'dark';
  } catch {
    return 'dark';
  }
}

/**
 * Close the Mini App
 */
export function closeTelegramApp(): void {
  if (!isTelegramWebApp()) return;

  try {
    WebApp.close();
  } catch {
    // Cannot close
  }
}
