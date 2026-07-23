export interface TimeInterval {
  start: Date;
  end: Date;
}

export function mergeBusyIntervals(
  intervals: readonly TimeInterval[],
  window: TimeInterval,
): TimeInterval[] {
  const clipped = intervals
    .map((interval) => ({
      start: interval.start < window.start ? window.start : interval.start,
      end: interval.end > window.end ? window.end : interval.end,
    }))
    .filter((interval) => interval.start < interval.end)
    .sort((left, right) => left.start.getTime() - right.start.getTime());
  const merged: TimeInterval[] = [];
  for (const interval of clipped) {
    const previous = merged.at(-1);
    if (!previous || interval.start > previous.end)
      merged.push({ ...interval });
    else if (interval.end > previous.end) previous.end = interval.end;
  }
  return merged;
}

export function freeIntervals(
  busy: readonly TimeInterval[],
  window: TimeInterval,
): TimeInterval[] {
  const free: TimeInterval[] = [];
  let cursor = window.start;
  for (const interval of mergeBusyIntervals(busy, window)) {
    if (cursor < interval.start)
      free.push({ start: cursor, end: interval.start });
    if (interval.end > cursor) cursor = interval.end;
  }
  if (cursor < window.end) free.push({ start: cursor, end: window.end });
  return free;
}

function ceilToStep(value: Date, stepMinutes: number): Date {
  const step = stepMinutes * 60_000;
  return new Date(Math.ceil(value.getTime() / step) * step);
}

export function generateCandidateIntervals(input: {
  free: readonly TimeInterval[];
  durationMinutes: number;
  stepMinutes?: number;
  limit?: number;
}): TimeInterval[] {
  const duration = input.durationMinutes * 60_000;
  const stepMinutes = input.stepMinutes ?? 15;
  const limit = input.limit ?? 60;
  const candidates: TimeInterval[] = [];
  for (const interval of input.free) {
    for (
      let start = ceilToStep(interval.start, stepMinutes);
      start.getTime() + duration <= interval.end.getTime();
      start = new Date(start.getTime() + stepMinutes * 60_000)
    ) {
      candidates.push({ start, end: new Date(start.getTime() + duration) });
      if (candidates.length >= limit) return candidates;
    }
  }
  return candidates;
}

export function balanceCandidateIntervals(
  free: readonly TimeInterval[],
  durationMinutes: number,
  stepMinutes = 15,
): TimeInterval[] {
  const groups = free.map((interval) =>
    generateCandidateIntervals({
      free: [interval],
      durationMinutes,
      stepMinutes,
      limit: Number.MAX_SAFE_INTEGER,
    }),
  );
  const balanced: TimeInterval[] = [];
  const largest = Math.max(0, ...groups.map((group) => group.length));
  for (let index = 0; index < largest; index += 1) {
    groups.forEach((group) => {
      const candidate = group[index];
      if (candidate) balanced.push(candidate);
    });
  }
  return balanced;
}
