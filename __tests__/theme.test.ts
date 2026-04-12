import { Colors } from '../constants/theme';

describe('Colors constant', () => {
  it('has expected light colors', () => {
    expect(Colors).toHaveProperty('light');
    expect(Colors.light.text).toBe('#11181C');
    expect(Colors.light.background).toBe('#fff');
    expect(Colors.light.tint).toBe('#0a7ea4');
  });

  it('has expected dark colors', () => {
    expect(Colors).toHaveProperty('dark');
    expect(Colors.dark.background).toBe('#151718');
  });
});
