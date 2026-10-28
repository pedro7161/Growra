import { readableTextColor } from '../src/utils/colorContrast';

describe('readableTextColor', () => {
  it('picks black on light colours and white on dark ones', () => {
    expect(readableTextColor('#ffffff')).toBe('#000000');
    expect(readableTextColor('#f4d35e')).toBe('#000000');
    expect(readableTextColor('#000000')).toBe('#ffffff');
    expect(readableTextColor('#3d5a80')).toBe('#ffffff');
    expect(readableTextColor('#7b5ea7')).toBe('#ffffff');
  });

  it('accepts short hex and falls back to white for anything else', () => {
    expect(readableTextColor('#fff')).toBe('#000000');
    expect(readableTextColor('red')).toBe('#ffffff');
  });
});
