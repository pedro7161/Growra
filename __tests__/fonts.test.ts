import { Fonts } from '../constants/theme';

describe('Fonts constant', () => {
  it('exposes font fallbacks for web', () => {
    expect(Fonts).toBeTruthy();
    expect(typeof Fonts.sans).toBe('string');
    expect(Fonts.sans.length).toBeGreaterThan(0);
  });
});
