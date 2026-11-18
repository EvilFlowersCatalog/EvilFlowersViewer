// The reader's small preferences (theme, citation style), kept in
// localStorage under `efv-<key>`. Storage may be blocked (private mode, a
// sandboxed iframe): reads then return null and writes do nothing.

export type PreferenceKey = 'theme' | 'cite-style';

export const readPreference = (key: PreferenceKey): string | null => {
  try {
    return window.localStorage.getItem(`efv-${key}`);
  } catch {
    return null;
  }
};

export const writePreference = (key: PreferenceKey, value: string): void => {
  try {
    window.localStorage.setItem(`efv-${key}`, value);
  } catch {
    // a preference is a nicety
  }
};
