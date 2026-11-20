import AsyncStorage from '@react-native-async-storage/async-storage';

/** Set once the first-run welcome has been seen; until then nothing asks for a permission. */
export const WELCOME_KEY = 'athar.welcomed.v1';

export async function hasBeenWelcomed(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(WELCOME_KEY)) === '1';
  } catch {
    return true; // storage broken: never trap the user in the welcome
  }
}

export function markWelcomed(): Promise<void> {
  return AsyncStorage.setItem(WELCOME_KEY, '1').catch(() => undefined);
}
