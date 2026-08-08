import AsyncStorage from '@react-native-async-storage/async-storage';
import { presentLocalNotification } from './push-notifications';

/**
 * Daily reward reminder — a scheduled local notification each day to bring
 * users back to claim their daily reward / keep their streak alive.
 * Reminder time is configurable; defaults to 6:00 PM local.
 */

const REMINDER_ENABLED_KEY = 'NOOD_DAILY_REMINDER_ENABLED_V1';
const REMINDER_HOUR_KEY = 'NOOD_DAILY_REMINDER_HOUR_V1';
const REMINDER_MINUTE_KEY = 'NOOD_DAILY_REMINDER_MINUTE_V1';
const LAST_FIRED_KEY = 'NOOD_DAILY_REMINDER_LAST_FIRED_V1';

export const DEFAULT_REMINDER_HOUR = 18;
export const DEFAULT_REMINDER_MINUTE = 0;

export async function isDailyReminderEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(REMINDER_ENABLED_KEY)) !== 'false';
  } catch {
    return true;
  }
}

export async function setDailyReminderEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY, String(enabled));
}

export async function getReminderTime(): Promise<{ hour: number; minute: number }> {
  try {
    const hour = Number(await AsyncStorage.getItem(REMINDER_HOUR_KEY));
    const minute = Number(await AsyncStorage.getItem(REMINDER_MINUTE_KEY));
    return {
      hour: Number.isFinite(hour) ? hour : DEFAULT_REMINDER_HOUR,
      minute: Number.isFinite(minute) ? minute : DEFAULT_REMINDER_MINUTE,
    };
  } catch {
    return { hour: DEFAULT_REMINDER_HOUR, minute: DEFAULT_REMINDER_MINUTE };
  }
}

export async function setReminderTime(hour: number, minute: number): Promise<void> {
  await AsyncStorage.setItem(REMINDER_HOUR_KEY, String(hour));
  await AsyncStorage.setItem(REMINDER_MINUTE_KEY, String(minute));
}

/**
 * Called on app launch — if the reminder is enabled and hasn't fired today,
 * schedule it for today's reminder time.
 */
export async function armDailyReminder(): Promise<void> {
  try {
    const enabled = await isDailyReminderEnabled();
    if (!enabled) return;

    const { hour, minute } = await getReminderTime();
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    const lastFired = await AsyncStorage.getItem(LAST_FIRED_KEY);
    if (lastFired === todayKey) return; // already fired today

    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);

    // If the target time already passed today, fire shortly (they're active now).
    const delayMs = target.getTime() > now.getTime()
      ? target.getTime() - now.getTime()
      : 5 * 60 * 1000;

    setTimeout(() => {
      void presentLocalNotification({
        title: 'Your daily reward is waiting 🎁',
        body: 'Claim your NOOD reward and keep your streak alive!',
        data: { type: 'daily-reward-reminder' },
      }).then(() => {
        void AsyncStorage.setItem(LAST_FIRED_KEY, todayKey);
      });
    }, Math.min(delayMs, 24 * 60 * 60 * 1000));
  } catch {
    // non-fatal
  }
}

if (__DEV__) {
  const globalScope = globalThis as typeof globalThis & {
    fireDailyReminderNow?: () => Promise<void>;
  };

  globalScope.fireDailyReminderNow = async () => {
    await AsyncStorage.removeItem(LAST_FIRED_KEY);
    await armDailyReminder();
  };
}
