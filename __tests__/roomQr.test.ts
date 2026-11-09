import { QR_MAX_BYTES, parseRoomQr, roomQrValue } from '../src/utils/roomQr';
import { decodeRoomCode, encodeRoomCode } from '../src/utils/roomCode';
import { requestScanPermission, scanRoomFromImage } from '../src/services/roomScan';
import { copyRoomLayout, syncRooms } from '../src/utils/rooms';
import { createInitialGameState } from '../src/utils/initialState';
import { createCompanion } from '../src/utils/gameplay';
import { getAppCopy } from '../src/constants/appCopy';

const layout = {
  styleId: 'wooden-bedroom',
  items: [
    { kind: 'decoration' as const, type: 'flower-pot', x: 0.31, y: 0.77, scale: 1.2, flip: true },
    { kind: 'companion' as const, type: 'sprout', x: 0.5, y: 0.5, scale: 1, flip: false },
  ],
};

describe('room QR payload (#41 part B)', () => {
  it('is exactly the Part A room code, and reads back to the same layout', () => {
    const value = roomQrValue(layout);
    expect(value).toBe(encodeRoomCode(layout));
    const read = parseRoomQr(value);
    const pasted = decodeRoomCode(value);
    expect(read).toEqual(pasted);
    if (!('layout' in read)) throw new Error('expected a layout');
    expect(read.layout.styleId).toBe('wooden-bedroom');
    expect(read.layout.items.map((item) => [item.kind, item.type, item.flip])).toEqual([
      ['decoration', 'flower-pot', true],
      ['companion', 'sprout', false],
    ]);
  });

  it('finds the code inside surrounding text, such as a pasted share message', () => {
    const value = roomQrValue(layout);
    expect(parseRoomQr(`My room in Growra. Code: ${value}\nthanks`)).toEqual(decodeRoomCode(value));
  });

  it('fits a QR code even with the maximum 30 items and long type ids', () => {
    const items = Array.from({ length: 30 }, (_, index) => ({
      kind: 'decoration' as const,
      type: `a-rather-long-decoration-type-id-${index}`,
      x: 0.9,
      y: 0.1,
      scale: 1.4,
      flip: index % 2 === 0,
    }));
    const value = roomQrValue({ styleId: 'a-long-style-id', items: items.concat(items) });
    expect(value.length).toBeLessThan(QR_MAX_BYTES);
    const read = parseRoomQr(value);
    if (!('layout' in read)) throw new Error('expected a layout');
    expect(read.layout.items).toHaveLength(30);
  });

  it('rejects a tampered code (checksum), a newer version, and things that are not room codes', () => {
    const value = roomQrValue(layout);
    const body = value.split('-')[3];
    const flipped = body.slice(0, 5) + (body[5] === 'A' ? 'B' : 'A') + body.slice(6);
    expect(parseRoomQr(value.replace(body, flipped))).toEqual({ error: 'checksum' });
    expect(parseRoomQr(value.slice(0, -3))).toEqual({ error: 'format' }); // truncated checksum
    expect(parseRoomQr(value.replace('GROWRA-ROOM-1-', 'GROWRA-ROOM-2-'))).toEqual({ error: 'newer' });
    expect(parseRoomQr('https://example.com/qr')).toEqual({ error: 'format' });
    expect(parseRoomQr('')).toEqual({ error: 'format' });
  });

  it('a crafted but correctly checksummed code cannot add items beyond the limit or invent positions', () => {
    // Build a code by hand with a valid checksum, 100 items and wild numbers.
    const { encodeShareCode } = jest.requireActual('../src/utils/shareCode');
    const item = ['d', 'flower-pot', 99999, -5, 99999, 1];
    const code = encodeShareCode('GROWRA-ROOM-', 1, JSON.stringify(['wooden-bedroom', Array.from({ length: 100 }, () => item)]));
    const read = parseRoomQr(code);
    if (!('layout' in read)) throw new Error('expected a layout');
    expect(read.layout.items).toHaveLength(30);
    for (const entry of read.layout.items) {
      expect(entry.x).toBeLessThanOrEqual(1.25);
      expect(entry.y).toBeGreaterThanOrEqual(-0.25);
      expect(entry.scale).toBeLessThanOrEqual(3);
    }
  });

  it('a scanned code that is applied never moves owned items or breaks the room limit', () => {
    const state = syncRooms({ ...createInitialGameState(), pets: [createCompanion('sprout')] });
    const roomId = state.rooms[0].id;
    const read = parseRoomQr(roomQrValue(layout));
    if (!('layout' in read)) throw new Error('expected a layout');
    const { state: next } = copyRoomLayout(state, roomId, read.layout);
    const room = next.rooms.find((candidate) => candidate.id === roomId)!;
    expect(room.items.length).toBeLessThanOrEqual(30);
    // The flower pot is not owned, so it can only be a ghost.
    expect(next.decorations).toEqual(state.decorations);
    expect(room.items.filter((item) => item.kind === 'ghost').length).toBeGreaterThan(0);
  });
});

describe('camera permission (#41 part B)', () => {
  it('reports granted when the player allows it', async () => {
    const request = jest.fn().mockResolvedValue({ granted: true });
    await expect(requestScanPermission({ requestCameraPermissionsAsync: request })).resolves.toBe('granted');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('reports denied when the player refuses, and when the request itself fails', async () => {
    await expect(requestScanPermission({ requestCameraPermissionsAsync: async () => ({ granted: false }) })).resolves.toBe('denied');
    await expect(
      requestScanPermission({
        requestCameraPermissionsAsync: async () => {
          throw new Error('native module missing');
        },
      }),
    ).resolves.toBe('denied');
  });

  it('has a message for every scan outcome in every language', () => {
    for (const language of ['en', 'pt', 'de', 'es', 'fr', 'id', 'it', 'ja', 'ko', 'ru', 'tr', 'zh'] as const) {
      const copy = getAppCopy(language);
      for (const text of [copy.roomScanDenied, copy.roomScanNoQr, copy.roomScanUnreadable, copy.roomScanHint, copy.roomScanCamera, copy.roomScanPicture]) {
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('scan from a picture (#41 part B)', () => {
  const valid = roomQrValue(layout);

  it('returns the layout from a picture holding a valid room QR', async () => {
    const scan = jest.fn().mockResolvedValue([{ data: valid }]);
    const result = await scanRoomFromImage('file:///cache/pic.png', { scanFromURLAsync: scan });
    expect(scan).toHaveBeenCalledWith('file:///cache/pic.png', ['qr']);
    expect(result).toEqual(decodeRoomCode(valid));
  });

  it('says there is no QR when none is found', async () => {
    await expect(scanRoomFromImage('x', { scanFromURLAsync: async () => [] })).resolves.toEqual({ error: 'noQr' });
  });

  it('skips unrelated QR codes and uses a valid room one in the same picture', async () => {
    const result = await scanRoomFromImage('x', { scanFromURLAsync: async () => [{ data: 'https://example.com' }, { data: valid }] });
    expect(result).toEqual(decodeRoomCode(valid));
  });

  it('rejects a picture whose only QR is tampered, with that code error', async () => {
    const tampered = valid.slice(0, -1) + (valid.endsWith('0') ? '1' : '0');
    await expect(scanRoomFromImage('x', { scanFromURLAsync: async () => [{ data: tampered }] })).resolves.toEqual({ error: 'checksum' });
  });

  it('reports unreadable when the native scanner fails (e.g. ML Kit unavailable)', async () => {
    const result = await scanRoomFromImage('x', {
      scanFromURLAsync: async () => {
        throw new Error('MLKitUnavailable');
      },
    });
    expect(result).toEqual({ error: 'unreadable' });
  });
});
