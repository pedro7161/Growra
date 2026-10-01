import { SHARE_SIZE, buildRoomShareMessage } from '../src/utils/roomShare';
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
});
