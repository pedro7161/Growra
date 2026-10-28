import { buildCompletionsCsv, buildTasksCsv, buildWorkCsv, csvField } from '../src/utils/historyCsv';
import { createCustomTask } from '../src/utils/taskFactory';
import { TaskFrequency, WorkItem } from '../src/types';

describe('history CSV', () => {
  it('escapes commas, quotes and newlines (RFC 4180)', () => {
    expect(csvField('plain')).toBe('plain');
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('two\nlines')).toBe('"two\nlines"');
  });

  it('neutralises cells a spreadsheet would run as a formula (#43)', () => {
    expect(csvField('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvField('+call mum')).toBe("'+call mum");
    expect(csvField('-gym')).toBe("'-gym");
    expect(csvField('@home')).toBe("'@home");
    expect(csvField('=1,2')).toBe('"\'=1,2"');
    expect(csvField(-5)).toBe('-5');
    expect(csvField('a=b')).toBe('a=b');
  });

  it('writes a header and one row per task', () => {
    const task = createCustomTask('Buy milk, eggs', '', 'Shopping', TaskFrequency.ONCE);
    const lines = buildTasksCsv([task]).trimEnd().split('\r\n');
    expect(lines[0]).toBe('name,category,frequency,priority,due_date,status');
    expect(lines[1].startsWith('"Buy milk, eggs",')).toBe(true);
    expect(lines).toHaveLength(2);
  });

  it('writes completions with local date and time, oldest first', () => {
    const day = new Date(2026, 9, 1).getTime();
    const csv = buildCompletionsCsv([
      {
        date: day, done: 2, recurringDone: 0, customDone: 0, highPriorityDone: 0, timersFinished: 0, scheduledAhead: 0,
        completions: [
          { name: 'Late', at: new Date(2026, 9, 1, 21, 5).getTime() },
          { name: 'Early', at: new Date(2026, 9, 1, 8, 0).getTime() },
        ],
      },
    ]);
    expect(csv).toBe('date,time,task\r\n2026-10-01,08:00,Early\r\n2026-10-01,21:05,Late\r\n');
  });

  it('buildWorkCsv lists occurrences with completion', () => {
    const shift: WorkItem = {
      id: 'w1', name: 'Shift, early', description: '', calendarColor: '#123456',
      startMinutes: 9 * 60 + 5, endMinutes: 17 * 60, startDateKey: '2026-10-05',
      repeat: { kind: 'days', interval: 1 }, end: { kind: 'never' },
      exceptions: { '2026-10-06': { kind: 'skip' } }, completedDateKeys: ['2026-10-05'], createdAt: 0,
    };
    const csv = buildWorkCsv([shift], '2026-10-05', '2026-10-07');
    expect(csv).toBe(
      'date,start,end,name,completed\r\n' +
        '2026-10-05,09:05,17:00,"Shift, early",yes\r\n' +
        '2026-10-07,09:05,17:00,"Shift, early",no\r\n',
    );
    const night = { ...shift, startMinutes: 22 * 60, endMinutes: 6 * 60, exceptions: {}, completedDateKeys: [] };
    expect(buildWorkCsv([night], '2026-10-05', '2026-10-05')).toBe(
      'date,start,end,name,completed\r\n2026-10-05,22:00,06:00 (+1),"Shift, early",no\r\n',
    );
    expect(buildWorkCsv([], '2026-10-05', '2026-10-07')).toBe('date,start,end,name,completed\r\n');
  });
});
