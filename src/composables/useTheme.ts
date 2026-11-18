// Theme resolution. Precedence: the host's choice (`options.theme`,
// `controller.setTheme`), else the reader's last manual choice (stored), else
// the system preference, followed live.
import { computed, onScopeDispose, ref, watch } from 'vue';
import { readPreference, writePreference } from '@/core/storage/preferences';

export type Theme = 'dark' | 'light';

export const useTheme = (initial: Theme | null | undefined, onChange?: (theme: Theme) => void) => {
  const system =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
  let hostTheme: Theme | null = initial ?? null;

  const stored = (): Theme | null => {
    const value = readPreference('theme');
    return value === 'dark' || value === 'light' ? value : null;
  };
  const resolve = () => {
    if (hostTheme) return hostTheme === 'dark';
    const choice = stored();
    if (choice) return choice === 'dark';
    return system?.matches ?? false;
  };

  const isDark = ref(resolve());
  // Mirror the CSS tokens (--efv-viewer-bg / --efv-topbar-bg) for inline styles.
  const viewerBg = computed(() => (isDark.value ? '#1A1A1A' : '#EDEDED'));
  const topbarBg = computed(() => (isDark.value ? '#111111' : '#FFFFFF'));

  /** The reader's toggle: remembered for next time. */
  const toggle = () => {
    isDark.value = !isDark.value;
    writePreference('theme', isDark.value ? 'dark' : 'light');
  };

  /** The host's choice; null hands the decision back to the reader / system. */
  const setHostTheme = (theme: Theme | null) => {
    hostTheme = theme;
    isDark.value = resolve();
  };

  const onSystemChange = (event: MediaQueryListEvent) => {
    if (!hostTheme && !stored()) isDark.value = event.matches;
  };
  system?.addEventListener('change', onSystemChange);
  onScopeDispose(() => system?.removeEventListener('change', onSystemChange));

  if (onChange) watch(isDark, (dark) => onChange(dark ? 'dark' : 'light'));

  return { isDark, viewerBg, topbarBg, toggle, setHostTheme };
};
