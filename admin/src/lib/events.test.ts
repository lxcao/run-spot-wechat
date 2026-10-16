import { describe, expect, it } from 'vitest';
import { annotateEventStatus, splitEvents, checkWebAdmin, isCreateRoute, todayISO } from './events';

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

  it('sorts two upcoming asc and two past desc', () => {
    const mixed = [
      { id: 'b', date: '2026-10-04', _status: 'upcoming' },
      { id: 'd', date: '2026-08-01', _status: 'past' },
      { id: 'a', date: '2026-09-20', _status: 'upcoming' },
      { id: 'c', date: '2026-09-12', _status: 'past' },
    ];
    const { upcoming, past } = splitEvents(mixed as never);
    expect(upcoming.map((e) => e.id)).toEqual(['a', 'b']);
    expect(past.map((e) => e.id)).toEqual(['c', 'd']);
  });
});

describe('todayISO', () => {
  it('uses the Shanghai calendar date', () => {
    expect(todayISO(new Date('2026-09-30T00:30:00+08:00'))).toBe('2026-09-30');
    expect(todayISO(new Date('2026-09-30T16:00:00Z'))).toBe('2026-10-01');
  });
});

describe('annotateEventStatus', () => {
  const today = '2026-09-30';

  it('treats a past date as past even if stored status is upcoming', () => {
    expect(annotateEventStatus({ date: '2026-09-19', status: 'upcoming' }, today)._status).toBe('past');
  });

  it('keeps a future date as past when handwritten past', () => {
    expect(annotateEventStatus({ date: '2030-01-01', status: 'past' }, today)._status).toBe('past');
  });

  it('uses date vs today when status is not set', () => {
    expect(annotateEventStatus({ date: '2026-09-30' }, today)._status).toBe('upcoming');
    expect(annotateEventStatus({ date: '2026-09-15' }, today)._status).toBe('past');
  });
});

describe('checkWebAdmin', () => {
  it('matches uid', () => {
    expect(checkWebAdmin({ webAdmins: ['u1'] }, 'u1')).toBe(true);
    expect(checkWebAdmin({ webAdmins: ['u1'] }, 'u2')).toBe(false);
  });
});

describe('isCreateRoute', () => {
  it('is true for /events/new and false for an event id', () => {
    expect(isCreateRoute('/events/new')).toBe(true);
    expect(isCreateRoute('#/events/new')).toBe(true);
    expect(isCreateRoute('/events/2026-09-26')).toBe(false);
  });
});
