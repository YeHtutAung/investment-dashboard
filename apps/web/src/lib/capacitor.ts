import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

// Haptic feedback
export async function hapticLight() {
  if (isNative) {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
}

export async function hapticMedium() {
  if (isNative) {
    await Haptics.impact({ style: ImpactStyle.Medium });
  }
}

export async function hapticSuccess() {
  if (isNative) {
    await Haptics.notification({ type: NotificationType.Success });
  }
}

// Keyboard
export async function hideKeyboard() {
  if (isNative) {
    await Keyboard.hide();
  }
}

// Status bar
export async function setStatusBarLight() {
  if (isNative) {
    await StatusBar.setStyle({ style: Style.Light });
  }
}

export async function setStatusBarDark() {
  if (isNative) {
    await StatusBar.setStyle({ style: Style.Dark });
  }
}
