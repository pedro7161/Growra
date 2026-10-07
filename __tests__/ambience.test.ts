import { ambienceFor } from '../src/utils/ambience';

describe('ambienceFor', () => {
  it('is silent when music is off', () => {
    expect(ambienceFor('journey', false, false)).toBeNull();
    expect(ambienceFor('dashboard', true, false)).toBeNull();
  });

  it('plays the journey ambience on the Journey', () => {
    expect(ambienceFor('journey', false, true)).toBe('journey');
  });

  it('plays the calm home ambience everywhere else', () => {
    for (const screen of ['dashboard', 'tasks', 'task-calendar', 'companions'] as const) {
      expect(ambienceFor(screen, false, true)).toBe('home');
    }
  });

  it('plays the room loop while the room editor is open, on any screen', () => {
    expect(ambienceFor('companions', true, true)).toBe('room');
    expect(ambienceFor('journey', true, true)).toBe('room');
  });
});
