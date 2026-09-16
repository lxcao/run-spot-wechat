import { describe, expect, it } from 'vitest';
import { splitEvents, checkWebAdmin } from './events';

const events = [
  { id: '2026-09-26', date: '2026-09-26', _status: 'upcoming', title: 'A' },
  { id: '2026-09-12', date: '2026-09-12', _status: 'past', title: 'B' },
];

describe('splitEvents', () => {
  it('sorts upcoming asc and past desc', () => {
    const { upcoming, past } = splitEvents(events as never);
    expect(upcoming.map((e) => e.id)).toEqual(['2026-09-26']);
    expect(past.map((e) => e.id)).toEqual(['2026-09-12']);
  });
});

describe('checkWebAdmin', () => {
  it('matches uid', () => {
    expect(checkWebAdmin({ webAdmins: ['u1'] }, 'u1')).toBe(true);
    expect(checkWebAdmin({ webAdmins: ['u1'] }, 'u2')).toBe(false);
  });
});
