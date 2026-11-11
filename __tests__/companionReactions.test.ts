import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAppCopy } from '../src/constants/appCopy';
import { gameStateService } from '../src/services/gameStateService';
import { GameState, Task, TaskStatus } from '../src/types';
import { BIG_DAY_TASKS, CompanionMood } from '../src/utils/companions';
import { companionLine, pickPraiseLine, praiseKindForTick, textSeed } from '../src/utils/companionText';
import { createInitialGameState, createSaveData } from '../src/utils/initialState';

const at = (month: number, day: number, hour = 12) => new Date(2026, month - 1, day, hour).getTime();
const NOW = at(6, 10);
const MOODS: CompanionMood[] = ['hello', 'happy', 'glowing', 'sleepy'];

const task = (id: string, status: TaskStatus, dueDate: number): Task => ({ id, status, dueDate } as unknown as Task);

function stateWith(todayDone: number, tasks: Task[]): GameState {
  const base = createInitialGameState();
  return {
    ...base,
    tasks,
    usage: { ...base.usage, todayDone, todayDay: new Date(NOW).setHours(0, 0, 0, 0) } as GameState['usage'],
  };
}

describe('varied daily companion line', () => {
  const en = getAppCopy('en');

  it('has a pool of several lines per mood in English and Portuguese, each naming the companion', () => {
    for (const copy of [en, getAppCopy('pt')]) {
      for (const mood of MOODS) {
        expect(copy.companionMoodMore[mood].length).toBeGreaterThanOrEqual(2);
        for (const line of [copy.companionMood[mood], ...copy.companionMoodMore[mood]]) expect(line).toContain('{name}');
      }
    }
  });

  it('is deterministic: the same day, name and mood always give the same line', () => {
    for (const mood of MOODS) {
      expect(companionLine(en, mood, 'Moss', at(6, 10, 8))).toBe(companionLine(en, mood, 'Moss', at(6, 10, 23)));
    }
  });

  it('reaches every line of the pool across days, and never leaves {name} unreplaced', () => {
    for (const mood of MOODS) {
      const seen = new Set<string>();
      for (let day = 1; day <= 28; day++) {
        const line = companionLine(en, mood, 'Moss', at(6, day));
        expect(line).not.toContain('{name}');
        seen.add(line);
      }
      expect(seen.size).toBe(1 + en.companionMoodMore[mood].length);
    }
  });

  it('never repeats the same line two days in a row, across a month end', () => {
    const days = [...Array.from({ length: 30 }, (_, i) => at(6, i + 1)), at(7, 1), at(7, 2)];
    for (const mood of MOODS) {
      for (let i = 1; i < days.length; i++) {
        expect(companionLine(en, mood, 'Moss', days[i])).not.toBe(companionLine(en, mood, 'Moss', days[i - 1]));
      }
    }
  });

  it('with reactions off always gives the original single line', () => {
    for (const mood of MOODS) {
      for (let day = 1; day <= 28; day++) {
        expect(companionLine(en, mood, 'Moss', at(6, day), false)).toBe(en.companionMood[mood].replace('{name}', 'Moss'));
      }
    }
  });

  it('keeps holiday greetings and seasonal lines (not varied away) and never shames a sleepy companion', () => {
    expect(companionLine(en, 'happy', 'Moss', at(10, 31))).toBe('Moss says: Happy Halloween! 🎃');
    expect(companionLine(en, 'glowing', 'Moss', at(10, 20))).toContain('jack-o');
    const shaming = /\b(lazy|failed|missed|disappoint|should have|neglect|abandon|guilt)\b/i;
    for (const lang of ['en', 'pt'] as const) {
      const copy = getAppCopy(lang);
      for (const line of [...copy.companionMoodMore.sleepy, copy.companionMood.sleepy]) expect(line).not.toMatch(shaming);
    }
  });

  it('textSeed is stable', () => {
    expect(textSeed('Moss|hello')).toBe(textSeed('Moss|hello'));
    expect(textSeed('a')).not.toBe(textSeed('b'));
  });
});

describe('praise kind for a tick', () => {
  const day = NOW;
  it('is a plain task while tasks are still due', () => {
    expect(praiseKindForTick(stateWith(1, [task('a', TaskStatus.PENDING, day)]), NOW)).toBe('task');
  });

  it('is rest when the last task due today was just done', () => {
    expect(praiseKindForTick(stateWith(2, [task('a', TaskStatus.COMPLETED, day)]), NOW)).toBe('rest');
  });

  it('counts overdue pending tasks as still due, but not tasks due tomorrow', () => {
    const yesterday = day - 24 * 3600 * 1000;
    const tomorrow = day + 24 * 3600 * 1000;
    expect(praiseKindForTick(stateWith(1, [task('a', TaskStatus.PENDING, yesterday)]), NOW)).toBe('task');
    expect(praiseKindForTick(stateWith(1, [task('a', TaskStatus.PENDING, tomorrow)]), NOW)).toBe('rest');
  });

  it('is big-day exactly when BIG_DAY_TASKS are done, ahead of rest', () => {
    expect(praiseKindForTick(stateWith(BIG_DAY_TASKS, []), NOW)).toBe('big-day');
    expect(praiseKindForTick(stateWith(BIG_DAY_TASKS + 1, []), NOW)).toBe('rest');
    expect(praiseKindForTick(stateWith(BIG_DAY_TASKS - 1, [task('a', TaskStatus.PENDING, day)]), NOW)).toBe('task');
  });
});

describe('rest and big-day praise lines', () => {
  for (const lang of ['en', 'pt'] as const) {
    const copy = getAppCopy(lang);
    it(`has several ${lang} lines, no leftover placeholder, no repeat of the previous line`, () => {
      for (const kind of ['rest', 'big-day'] as const) {
        const pool = kind === 'rest' ? copy.praiseRestLines : copy.praiseBigDayLines;
        expect(pool.length).toBeGreaterThanOrEqual(3);
        expect(pool).not.toEqual(copy.praiseLines);
        for (let i = 0; i < 30; i++) {
          const first = pickPraiseLine(copy, kind, 'Pip', null, () => i / 30);
          expect(first).not.toContain('{name}');
          expect(pickPraiseLine(copy, kind, 'Pip', first, () => (i * 7 % 30) / 30)).not.toBe(first);
        }
      }
    });
  }

  it('rest lines point to resting, not to more work', () => {
    const lines = getAppCopy('en').praiseRestLines.join(' ').toLowerCase();
    expect(lines).toMatch(/rest|break|nothing left|all clear/);
    expect(lines).not.toMatch(/another|more tasks|keep going/);
  });
});

describe('companionReactions setting persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  const oldSave = () => {
    const base = createInitialGameState();
    const { companionReactions: _flag, ...settings } = base.settings;
    return JSON.stringify({ ...createSaveData({ ...base, settings, coins: 55 } as never), version: 23 });
  };

  it('defaults to on', () => {
    expect(createInitialGameState().settings.companionReactions).toBe(true);
  });

  it('an old save without it loads with reactions on and keeps its other fields', async () => {
    await AsyncStorage.setItem('growra_save_data', oldSave());
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    expect(result.saveData.gameState.settings.companionReactions).toBe(true);
    expect(result.saveData.gameState.coins).toBe(55);
  });

  it('a switched-off setting survives a restart, and garbage values load as on', async () => {
    const base = createInitialGameState();
    await gameStateService.saveGame(createSaveData({ ...base, settings: { ...base.settings, companionReactions: false } }));
    const off = await gameStateService.loadGame();
    expect(off.status === 'loaded' && off.saveData.gameState.settings.companionReactions).toBe(false);

    const parsed = JSON.parse(oldSave());
    parsed.gameState.settings.companionReactions = 'nope';
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(parsed));
    const garbage = await gameStateService.loadGame();
    expect(garbage.status === 'loaded' && garbage.saveData.gameState.settings.companionReactions).toBe(true);
  });

  it('a backup code round trip keeps the setting, and an old backup restores with it on', () => {
    const base = createInitialGameState();
    const code = gameStateService.exportSaveCode(createSaveData({ ...base, settings: { ...base.settings, companionReactions: false } }));
    expect(gameStateService.importSaveCode(code).gameState.settings.companionReactions).toBe(false);

    const old = gameStateService.importSaveCode(gameStateService.exportSaveCode(JSON.parse(oldSave())));
    expect(old.gameState.settings.companionReactions).toBe(true);
    expect(old.gameState.coins).toBe(55);
  });
});
