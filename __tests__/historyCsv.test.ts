import { buildCompletionsCsv, buildTasksCsv, csvField } from '../src/utils/historyCsv';
import { createCustomTask } from '../src/utils/taskFactory';
import { TaskFrequency } from '../src/types';

describe('history CSV', () => {
  it('escapes commas, quotes and newlines (RFC 4180)', () => {
    expect(csvField('plain')).toBe('plain');
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('two\nlines')).toBe('"two\nlines"');
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
});
