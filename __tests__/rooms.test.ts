import {
  MAX_ROOM_ITEMS,
  PLUS_ROOM_COUNT,
  addCompanionToRoom,
  addDecorationToRoom,
  bringItemForward,
  clampItemPosition,
  flipRoomItem,
  getRoomBag,
  getVisibleRooms,
  moveRoomItem,
  removeRoomItem,
  resizeRoomItem,
  sendItemBack,
  setRoomStyle,
  syncRooms,
} from '../src/utils/rooms';
import { isPlaced } from '../src/utils/journey';
import { createInitialGameState } from '../src/utils/initialState';
import { createCompanion } from '../src/utils/gameplay';
import { GameState } from '../src/types';

function withPets(...templateIds: string[]): GameState {
  return syncRooms({ ...createInitialGameState(), pets: templateIds.map((id) => createCompanion(id)) });
}

function withDecoration(state: GameState, typeId: string): GameState {
  return { ...state, decorations: [...state.decorations, { id: `d-${typeId}-${state.decorations.length}`, typeId, camp: -1, spot: -1 }] };
}

describe('syncRooms', () => {
  it('creates one room per companion with the starter style', () => {
    const state = withPets('sprout', 'ripple');
    expect(state.rooms).toHaveLength(2);
    expect(state.rooms.map((room) => room.ownerPetId).sort()).toEqual(state.pets.map((pet) => pet.id).sort());
    state.rooms.forEach((room) => expect(room.styleId).toBe('wooden-bedroom'));
  });

  it('returns the same object when nothing changes', () => {
    const state = withPets('sprout');
    expect(syncRooms(state)).toBe(state);
  });

  it('adds 3 Plus rooms with Plus and hides them without', () => {
    const base = withPets('sprout');
    const plus = syncRooms({ ...base, plus: { owned: true, lastCheckedAt: 1 } });
    expect(plus.rooms.filter((room) => room.ownerPetId === null)).toHaveLength(PLUS_ROOM_COUNT);
    expect(getVisibleRooms(plus)).toHaveLength(1 + PLUS_ROOM_COUNT);
    const lost = syncRooms({ ...plus, plus: { owned: false, lastCheckedAt: 2 } });
    expect(lost.rooms).toHaveLength(1 + PLUS_ROOM_COUNT); // kept in the save
    expect(getVisibleRooms(lost)).toHaveLength(1);
  });

  it('syncRooms strips Plus content without Plus', () => {
    let state = syncRooms({ ...withPets('sprout'), plus: { owned: true, lastCheckedAt: 1 } });
    state = withDecoration(state, 'futon');
    state = withDecoration(state, 'shell');
    const companionRoom = state.rooms.find((room) => room.ownerPetId !== null)!;
    const plusRoom = state.rooms.find((room) => room.ownerPetId === null)!;
    state = addDecorationToRoom(state, companionRoom.id, state.decorations[0].id);
    state = addDecorationToRoom(state, plusRoom.id, state.decorations[1].id);
    state = { ...state, ownedRoomStyles: [...state.ownedRoomStyles, 'japanese-room'] };
    state = setRoomStyle(state, companionRoom.id, 'japanese-room');
    const lost = syncRooms({ ...state, plus: { owned: false, lastCheckedAt: 2 } });
    expect(lost.rooms.find((room) => room.id === companionRoom.id)!.items).toHaveLength(0);
    expect(lost.rooms.find((room) => room.id === companionRoom.id)!.styleId).toBe('wooden-bedroom');
    expect(lost.rooms.find((room) => room.id === plusRoom.id)!.items).toHaveLength(0);
    expect(lost.decorations.every((decoration) => !isPlaced(decoration))).toBe(true);
    expect(lost.ownedRoomStyles).toContain('japanese-room'); // still owned for when Plus returns
  });

  it('syncRooms drops items whose ref no longer exists', () => {
    let state = withDecoration(withPets('sprout'), 'shell');
    const room = state.rooms[0];
    state = addDecorationToRoom(state, room.id, state.decorations[0].id);
    state = addCompanionToRoom(state, room.id, state.pets[0].id);
    const broken = { ...state, decorations: [], pets: state.pets };
    expect(syncRooms(broken).rooms[0].items.map((item) => item.kind)).toEqual(['companion']);
  });
});

describe('placing items', () => {
  it('isPlaced is true for room decorations, and they leave the camp bag', () => {
    let state = withDecoration(withPets('sprout'), 'shell');
    state = addDecorationToRoom(state, state.rooms[0].id, state.decorations[0].id);
    expect(isPlaced(state.decorations[0])).toBe(true);
    expect(getRoomBag(state)).toHaveLength(0);
  });

  it('a decoration already in a room or camp cannot be added again', () => {
    let state = withDecoration(withPets('sprout', 'ripple'), 'shell');
    state = addDecorationToRoom(state, state.rooms[0].id, state.decorations[0].id);
    expect(addDecorationToRoom(state, state.rooms[1].id, state.decorations[0].id)).toBe(state);
    const inCamp = { ...withDecoration(withPets('sprout'), 'acorn') };
    inCamp.decorations = [{ ...inCamp.decorations[0], camp: 0, spot: 0 }];
    expect(addDecorationToRoom(inCamp, inCamp.rooms[0].id, inCamp.decorations[0].id)).toBe(inCamp);
  });

  it('adds a companion at most once per room', () => {
    let state = withPets('sprout', 'ripple');
    const room = state.rooms[0];
    state = addCompanionToRoom(state, room.id, state.pets[1].id);
    expect(addCompanionToRoom(state, room.id, state.pets[1].id)).toBe(state);
  });

  it('stops at 30 items', () => {
    let state = withPets('sprout');
    for (let i = 0; i < MAX_ROOM_ITEMS + 2; i += 1) state = withDecoration(state, 'shell');
    for (const decoration of state.decorations) state = addDecorationToRoom(state, state.rooms[0].id, decoration.id);
    expect(state.rooms[0].items).toHaveLength(MAX_ROOM_ITEMS);
  });

  it('removing returns the decoration to the bag', () => {
    let state = withDecoration(withPets('sprout'), 'shell');
    state = addDecorationToRoom(state, state.rooms[0].id, state.decorations[0].id);
    state = removeRoomItem(state, state.rooms[0].id, state.rooms[0].items[0].id);
    expect(state.rooms[0].items).toHaveLength(0);
    expect(isPlaced(state.decorations[0])).toBe(false);
  });
});

describe('editing', () => {
  function oneItem() {
    let state = withDecoration(withPets('sprout'), 'shell');
    state = addDecorationToRoom(state, state.rooms[0].id, state.decorations[0].id);
    return { state, roomId: state.rooms[0].id, itemId: state.rooms[0].items[0].id };
  }

  it('keeps at least a quarter of the item inside the canvas', () => {
    expect(clampItemPosition(-1, 2, 0.2)).toEqual({ x: -0.05, y: 1 + 0.05 * 0.8 });
    expect(clampItemPosition(0.5, 0.5, 0.2)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('clamps the move and the scale', () => {
    const { state, roomId, itemId } = oneItem();
    const moved = moveRoomItem(state, roomId, itemId, 5, -5);
    expect(moved.rooms[0].items[0].x).toBeCloseTo(1.05);
    expect(resizeRoomItem(state, roomId, itemId, 9).rooms[0].items[0].scale).toBe(1.5);
    expect(resizeRoomItem(state, roomId, itemId, 0.1).rooms[0].items[0].scale).toBe(0.5);
  });

  it('flips and reorders layers', () => {
    let state = withDecoration(withDecoration(withPets('sprout'), 'shell'), 'acorn');
    const roomId = state.rooms[0].id;
    state = addDecorationToRoom(state, roomId, state.decorations[0].id);
    state = addDecorationToRoom(state, roomId, state.decorations[1].id);
    const [back, front] = state.rooms[0].items;
    expect(flipRoomItem(state, roomId, back.id).rooms[0].items[0].flip).toBe(true);
    expect(bringItemForward(state, roomId, back.id).rooms[0].items.map((i) => i.id)).toEqual([front.id, back.id]);
    expect(sendItemBack(state, roomId, front.id).rooms[0].items.map((i) => i.id)).toEqual([front.id, back.id]);
    expect(bringItemForward(state, roomId, front.id)).toBe(state); // already in front
  });

  it('only sets an owned style', () => {
    const { state, roomId } = oneItem();
    expect(setRoomStyle(state, roomId, 'library')).toBe(state);
  });

  it('never touches coins, Bond or XP', () => {
    const { state, roomId, itemId } = oneItem();
    const next = flipRoomItem(moveRoomItem(state, roomId, itemId, 0.3, 0.3), roomId, itemId);
    expect(next.coins).toBe(state.coins);
    expect(next.totalExperience).toBe(state.totalExperience);
    expect(next.pets).toBe(state.pets);
  });
});

import { gameStateService } from '../src/services/gameStateService';
import { createSaveData } from '../src/utils/initialState';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('migration creates rooms for existing companions', () => {
  it('gives a pre-rooms save one room per companion after load + sync', async () => {
    await AsyncStorage.clear();
    const legacy = createSaveData({ ...createInitialGameState(), pets: [createCompanion('sprout'), createCompanion('moss')] }) as any;
    delete legacy.gameState.rooms;
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(legacy));
    const result = await gameStateService.loadGame();
    if (result.status !== 'loaded') throw new Error('not loaded');
    expect(syncRooms(result.saveData.gameState).rooms).toHaveLength(2);
  });
});
