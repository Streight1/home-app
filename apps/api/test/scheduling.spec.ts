import { describe, expect, it } from 'vitest';
import {
  freeIntervals,
  generateCandidateIntervals,
  mergeBusyIntervals,
} from '../src/modules/scheduling/domain/scheduling-window.js';

const at = (hour: number, minute = 0) =>
  new Date(Date.UTC(2026, 6, 20, hour, minute));
const window = { start: at(6), end: at(22) };

describe('scheduling availability', () => {
  it('returns a slot for an empty day', () => {
    const candidates = generateCandidateIntervals({
      free: freeIntervals([], window),
      durationMinutes: 60,
    });
    expect(candidates[0]).toEqual({ start: at(6), end: at(7) });
  });

  it('uses the intersection of two participants by merging all busy time', () => {
    const busy = mergeBusyIntervals(
      [
        { start: at(8), end: at(10) },
        { start: at(9), end: at(11) },
      ],
      window,
    );
    expect(busy).toEqual([{ start: at(8), end: at(11) }]);
  });

  it('does not return a slot when one participant blocks the whole window', () => {
    const free = freeIntervals([{ start: at(6), end: at(22) }], window);
    expect(generateCandidateIntervals({ free, durationMinutes: 30 })).toEqual(
      [],
    );
  });

  it('fits a task exactly into a free interval', () => {
    expect(
      generateCandidateIntervals({
        free: [{ start: at(12), end: at(13) }],
        durationMinutes: 60,
      }),
    ).toEqual([{ start: at(12), end: at(13) }]);
  });

  it('rejects a task longer than the free interval', () => {
    expect(
      generateCandidateIntervals({
        free: [{ start: at(12), end: at(13) }],
        durationMinutes: 61,
      }),
    ).toEqual([]);
  });

  it('uses 15-minute candidate boundaries', () => {
    const candidates = generateCandidateIntervals({
      free: [{ start: at(8, 7), end: at(10) }],
      durationMinutes: 30,
    });
    expect(candidates[0]?.start).toEqual(at(8, 15));
    expect(candidates[1]?.start).toEqual(at(8, 30));
  });

  it('merges nested and touching intervals deterministically', () => {
    expect(
      mergeBusyIntervals(
        [
          { start: at(10), end: at(12) },
          { start: at(8), end: at(11) },
          { start: at(12), end: at(13) },
        ],
        window,
      ),
    ).toEqual([{ start: at(8), end: at(13) }]);
  });

  it('clips a night event to the requested window', () => {
    expect(
      mergeBusyIntervals(
        [
          {
            start: new Date(Date.UTC(2026, 6, 19, 20)),
            end: at(8),
          },
        ],
        window,
      ),
    ).toEqual([{ start: at(6), end: at(8) }]);
  });

  it('keeps a stable maximum candidate limit', () => {
    expect(
      generateCandidateIntervals({
        free: [{ start: at(6), end: at(22) }],
        durationMinutes: 30,
        limit: 3,
      }),
    ).toHaveLength(3);
  });

  it('finds free intervals before and after a long event', () => {
    expect(freeIntervals([{ start: at(8), end: at(20) }], window)).toEqual([
      { start: at(6), end: at(8) },
      { start: at(20), end: at(22) },
    ]);
  });
});
