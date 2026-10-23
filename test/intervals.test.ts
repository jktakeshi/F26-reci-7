import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const interval: fc.Arbitrary<Interval> = fc
  .tuple(fc.integer({ min: -20, max: 20 }), fc.nat(10))
  .map(([start, len]) => [start, start + len]);
const intervalList = fc.array(interval, { maxLength: 8 });

const covers = (intervals: Interval[], p: number) =>
  intervals.some(([a, b]) => a <= p && p <= b);

// Already-disjoint intervals with a gap between neighbors, built in order.
const disjointList: fc.Arbitrary<Interval[]> = fc
  .array(fc.nat(10), { maxLength: 6 })
  .map(lengths => {
    const xs: Interval[] = [];
    let nextStart = 0;
    for (const len of lengths) {
      xs.push([nextStart, nextStart + len]);
      nextStart += len + 2;
    }
    return xs;
  });

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });


  // Add your properties here. Aim for at least one of each pattern:
  // invariant, algebraic, metamorphic, differential, conditional.
  // Pattern: invariant. The output is sorted, and consecutive intervals neither overlap nor touch.
  it('returns sorted intervals that do not overlap or touch', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (let i = 0; i < out.length - 1; i++) {
          expect(out[i][0]).toBeLessThanOrEqual(out[i + 1][0]);
          expect(out[i][1]).toBeLessThan(out[i + 1][0]);
        }
      }),
    );
  });

  // Pattern: algebraic. Merging an already-merged list does not change it.
  it('merging twice is the same as merging once', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: metamorphic. Shuffling the input does not change the merged output.
  it('shuffling the input does not change the output', () => {
    fc.assert(
      fc.property(
        intervalList.chain(xs =>
          fc.shuffledSubarray(xs, { minLength: xs.length, maxLength: xs.length }).map(shuffled => [xs, shuffled]),
        ),
        ([xs, shuffled]) => {
          expect(mergeIntervals(shuffled)).toEqual(mergeIntervals(xs));
        },
      ),
    );
  });

  // Pattern: differential. A point is covered by the output iff it is covered by the input.
  it('covers a point exactly when the input covers it', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const lo = Math.min(-1, ...xs.flat()) - 1;
        const hi = Math.max(1, ...xs.flat()) + 1;
        for (let n = lo; n <= hi; n++) {
          expect(covers(out, n)).toBe(covers(xs, n));
          expect(covers(out, n + 0.5)).toBe(covers(xs, n + 0.5));
        }
      }),
    );
  });

  // Pattern: conditional. Already-disjoint input is returned sorted and unchanged.
  it('already-disjoint intervals come back sorted', () => {
    fc.assert(
      fc.property(
        disjointList.chain(xs =>
          fc.shuffledSubarray(xs, { minLength: xs.length, maxLength: xs.length }),
        ),
        xs => {
          const expected = [...xs].sort((a, b) => a[0] - b[0]);
          expect(mergeIntervals(xs)).toEqual(expected);
        },
      ),
    );
  });

  // Pattern: invariant. The input array and the intervals in it are not modified.
  it('does not modify the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const snapshot = xs.map(([s, e]) => [s, e]);
        mergeIntervals(xs);
        expect(xs).toEqual(snapshot);
      }),
    );
  });
});
