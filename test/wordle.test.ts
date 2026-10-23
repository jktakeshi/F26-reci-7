import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Step 1: a generator for five-letter uppercase words.
// const word = ...
const wordFrom = (letters: string) => 
  fc.array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5 }).map(cs => cs.join(''));
const word = wordFrom("ABC");

describe('matchGuess', () => {
  // Pattern: invariant. The result always has exactly five colors.
  it('returns exactly five colors', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        expect(matchGuess(secret, guess)).toHaveLength(5);
      }),
    );
  });

  // Pattern: invariant. Every color is G, Y, or B.
  it('only uses the colors G, Y, B', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        for (const c of matchGuess(secret, guess)) expect(['G', 'Y', 'B']).toContain(c);
      }),
    );
  });
  
  // Pattern: conditional. Guessing the secret gives all greens.
  it('guessing the secret gives all greens', () => {
    fc.assert(
      fc.property(word, w => {
        expect(matchGuess(w, w)).toEqual(['G', 'G', 'G', 'G', 'G']);
      }),
    );
  });

  // Pattern: invariant. A letter is never credited more times than it appears in the secret.
  it('never credits a letter more times than the secret contains it', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const credited = [...guess].filter((c, i) => c === letter && result[i] !== 'B').length;
          const inSecret = [...secret].filter(c => c === letter).length;
          expect(credited).toBeLessThanOrEqual(inSecret);
        }
      })
    )
  })


  // Pattern: conditional. A letter from the secret in the wrong place is yellow, not black.
  it('marks a swapped letter yellow', () => {
    fc.assert(
      fc.property(word, w => {
        const a = w[0];
        const b = w[1] === a ? (a === 'A' ? 'B' : 'A') : w[1];
        const secret = a + b + w.slice(2);
        const guess = b + a + w.slice(2);
        const result = matchGuess(secret, guess);
        expect(result[0]).toBe('Y');
        expect(result[1]).toBe('Y');
      }),
    );
  });

  // Pattern: metamorphic. Renaming letters in both words does not change the colors.
  it('renaming letters in the secret and guess does not change the colors', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const shift = (s: string) =>
          [...s].map(c => String.fromCharCode((c.charCodeAt(0) - 65 + 1) % 26 + 65)).join('');
        expect(matchGuess(shift(secret), shift(guess))).toEqual(matchGuess(secret, guess));
      }),
    );
  });

});
