import { addCompanionToRoom, addDecorationToRoom, copyRoomLayout, fillGhost, ghostWhere, getRoomBag, syncRooms } from '../src/utils/rooms';
import { decodeRoomCode, encodeRoomCode, roomLayout } from '../src/utils/roomCode';
import { createInitialGameState } from '../src/utils/initialState';
import { createCompanion } from '../src/utils/gameplay';
import { GameState } from '../src/types';

function withPets(...templateIds: string[]): GameState {
  return syncRooms({ ...createInitialGameState(), pets: templateIds.map((id) => createCompanion(id)) });
}

function withDecoration(state: GameState, typeId: string, camp = -1): GameState {
  return { ...state, decorations: [...state.decorations, { id: `d-${typeId}-${state.decorations.length}`, typeId, camp, spot: camp >= 0 ? 0 : -1 }] };
}

/** A friend's room: sprout + flower pot + lantern, in the starter style. */
function friendCode(): string {
  let friend = withDecoration(withDecoration(withPets('sprout'), 'flower-pot'), 'paper-lantern');
  const room = friend.rooms[0];
  friend = addDecorationToRoom(friend, room.id, friend.decorations[0].id);
  friend = addDecorationToRoom(friend, room.id, friend.decorations[1].id);
  return encodeRoomCode(roomLayout(friend, friend.rooms[0]));
}

describe('room codes (#41)', () => {
  it('round-trips a layout, with positions within one quantisation step', () => {
    const layout = { styleId: 'wooden-bedroom', items: [{ kind: 'decoration' as const, type: 'flower-pot', x: 0.31, y: 0.77, scale: 1.2, flip: true }] };
    const code = encodeRoomCode(layout);
    expect(code).toMatch(/^GROWRA-ROOM-1-[A-Za-z0-9_-]+-[0-9a-f]{8}$/);
    const decoded = decodeRoomCode(`  ${code}\n`);
    if (!('layout' in decoded)) throw new Error('expected a layout');
    const [item] = decoded.layout.items;
    expect(item).toMatchObject({ kind: 'decoration', type: 'flower-pot', flip: true });
    expect(Math.abs(item.x - 0.31)).toBeLessThan(0.01);
    expect(Math.abs(item.scale - 1.2)).toBeLessThan(0.01);
  });

  it('has no names or ids in it', () => {
    const body = friendCode().match(/^GROWRA-ROOM-1-(.+)-[0-9a-f]{8}$/)![1];
    const decoded = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
    expect(decoded).toContain('flower-pot');
    expect(decoded).not.toMatch(/d-flower-pot|Sprout|"id"/);
  });

  it('rejects a broken, tampered or newer code without changing anything', () => {
    const code = friendCode();
    expect(decodeRoomCode('hello')).toEqual({ error: 'format' });
    expect(decodeRoomCode(code.slice(0, -1) + (code.endsWith('0') ? '1' : '0'))).toEqual({ error: 'checksum' });
    expect(decodeRoomCode(code.replace('GROWRA-ROOM-1-', 'GROWRA-ROOM-9-'))).toEqual({ error: 'newer' });
  });
});

describe('copying a room (#41)', () => {
  it('fills from the bag by type and makes ghosts for the rest, with a summary', () => {
    let state = withDecoration(withPets('ripple'), 'flower-pot');
    const decoded = decodeRoomCode(friendCode());
    if (!('layout' in decoded)) throw new Error('expected a layout');
    const { state: next, report } = copyRoomLayout(state, state.rooms[0].id, decoded.layout);
    const items = next.rooms[0].items;
    expect(items.map((item) => item.kind)).toEqual(['ghost', 'decoration', 'ghost']);
    expect(report.unmetCompanions).toEqual(['sprout']);
    expect(report.missing).toEqual(['paper-lantern']);
    expect(next.decorations[0].roomId).toBe(next.rooms[0].id);
    expect(getRoomBag(next)).toHaveLength(0);
    state = next;
  });

  it("returns the room's own decorations to the bag first, and never moves items from a camp", () => {
    let state = withDecoration(withDecoration(withPets('sprout'), 'snowman'), 'paper-lantern', 2);
    state = addDecorationToRoom(state, state.rooms[0].id, state.decorations[0].id);
    const decoded = decodeRoomCode(friendCode());
    if (!('layout' in decoded)) throw new Error('expected a layout');
    const { state: next } = copyRoomLayout(state, state.rooms[0].id, decoded.layout);
    expect(next.decorations[0].roomId).toBeUndefined(); // snowman back in the bag
    expect(next.decorations[1].camp).toBe(2); // the camp lantern stays put
    const lanternGhost = next.rooms[0].items.find((item) => item.kind === 'ghost' && item.ref === 'paper-lantern')!;
    expect(ghostWhere(next, lanternGhost)).toEqual({ where: 'camp', camp: 2 });
    expect(next.rooms[0].items[0]).toMatchObject({ kind: 'companion', ref: next.pets[0].id });
  });

  it('a ghost becomes the real item once the player has one free', () => {
    let state = withPets('sprout');
    const decoded = decodeRoomCode(friendCode());
    if (!('layout' in decoded)) throw new Error('expected a layout');
    state = copyRoomLayout(state, state.rooms[0].id, decoded.layout).state;
    const ghost = state.rooms[0].items.find((item) => item.kind === 'ghost' && item.ref === 'flower-pot')!;
    expect(fillGhost(state, state.rooms[0].id, ghost.id)).toBe(state); // nothing in the bag yet
    state = withDecoration(state, 'flower-pot');
    const filled = fillGhost(state, state.rooms[0].id, ghost.id);
    const item = filled.rooms[0].items.find((candidate) => candidate.id === ghost.id)!;
    expect(item).toMatchObject({ kind: 'decoration', x: ghost.x, y: ghost.y });
    expect(filled.decorations.at(-1)?.roomId).toBe(filled.rooms[0].id);
  });

  it('syncRooms keeps ghosts, and a copied code reproduces the ghosts too', () => {
    let state = withPets('ripple');
    const decoded = decodeRoomCode(friendCode());
    if (!('layout' in decoded)) throw new Error('expected a layout');
    state = copyRoomLayout(state, state.rooms[0].id, decoded.layout).state;
    expect(syncRooms(state)).toBe(state);
    const again = decodeRoomCode(encodeRoomCode(roomLayout(state, state.rooms[0])));
    if (!('layout' in again)) throw new Error('expected a layout');
    expect(again.layout.items.map((item) => item.type)).toEqual(['sprout', 'flower-pot', 'paper-lantern']);
  });

  it('skips decorations and companions this version does not know', () => {
    const state = withPets('sprout');
    const layout = {
      styleId: 'wooden-bedroom',
      items: [
        { kind: 'companion' as const, type: 'no-such-pet', x: 0.5, y: 0.5, scale: 1, flip: false },
        { kind: 'decoration' as const, type: 'no-such-thing', x: 0.5, y: 0.5, scale: 1, flip: false },
      ],
    };
    expect(copyRoomLayout(state, state.rooms[0].id, layout).state.rooms[0].items).toHaveLength(0);
  });

  it('does not place the same companion twice', () => {
    const state = withPets('sprout');
    const layout = { styleId: 'wooden-bedroom', items: [0, 1].map(() => ({ kind: 'companion' as const, type: 'sprout', x: 0.5, y: 0.5, scale: 1, flip: false })) };
    const { state: next } = copyRoomLayout(addCompanionToRoom(state, state.rooms[0].id, state.pets[0].id), state.rooms[0].id, layout);
    expect(next.rooms[0].items).toHaveLength(1);
  });
});
