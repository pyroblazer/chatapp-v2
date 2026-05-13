import settingsReducer, { setTheme, type SettingsState } from '../settings/settingsSlice';

describe('settingsSlice', () => {
  it('should have theme "dark" in initial state', () => {
    const state: SettingsState = { theme: 'dark' };
    const result = settingsReducer(undefined, { type: 'unknown' });
    expect(result).toEqual(state);
  });

  it('should change theme to "light" via setTheme', () => {
    const initial: SettingsState = { theme: 'dark' };
    const result = settingsReducer(initial, setTheme('light'));
    expect(result.theme).toBe('light');
  });

  it('should change theme back to "dark" via setTheme', () => {
    const state: SettingsState = { theme: 'light' };
    const result = settingsReducer(state, setTheme('dark'));
    expect(result.theme).toBe('dark');
  });
});
