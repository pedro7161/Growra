import { SHARE_SIZE, buildRoomShareMessage, shareMessageFor } from '../src/utils/roomShare';
import { getAppCopy } from '../src/constants/appCopy';

jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));

describe('room share', () => {
  it('shares at 1080x1350', () => {
    expect(SHARE_SIZE).toEqual({ width: 1080, height: 1350 });
  });

  it('names the companion, or says "my room" for Plus rooms', () => {
    const copy = getAppCopy('en');
    expect(buildRoomShareMessage(copy, 'Sprout')).toBe("My Sprout's room in Growra");
    expect(buildRoomShareMessage(copy, null)).toBe('My room in Growra');
  });

  describe('shareMessageFor', () => {
    const code = 'GROWRA-ROOM-abc123_-';

    it('adds no code text while the footer QR carries it', () => {
      expect(shareMessageFor(true, code, getAppCopy('en'))).toBeUndefined();
    });

    it('puts the code in the message when the footer is off', () => {
      const message = shareMessageFor(false, code, getAppCopy('en'));
      expect(message).toBe(getAppCopy('en').roomCodeShareMessage.replace('{code}', code));
      expect(message).toContain(code);
      expect(message).not.toContain('{code}');
    });

    it('uses the player language', () => {
      const pt = shareMessageFor(false, code, getAppCopy('pt'));
      expect(pt).toContain('O meu quarto no Growra');
      expect(pt).toContain(code);
      expect(pt).not.toBe(shareMessageFor(false, code, getAppCopy('en')));
    });
  });
});
