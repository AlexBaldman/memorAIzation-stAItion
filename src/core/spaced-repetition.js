/**
 * Spaced Repetition System (SuperMemo-2 Algorithm)
 *
 * This module implements the SM-2 algorithm for spaced repetition learning.
 *
 * Based on the description at: https://super-memory.com/english/ol/sm2.htm
 */

const DEFAULT_EASINESS = 2.5;
const MIN_EASINESS = 1.3;

/**
 * Calculates the next repetition interval and easiness factor based on the SM-2 algorithm.
 *
 * @param {number} quality - The quality of the response (0-5).
 * @param {number} repetitions - The number of times the item has been repeated.
 * @param {number} easiness - The current easiness factor for the item.
 * @param {number} interval - The previous interval for the item.
 * @returns {object} An object containing the new interval, repetitions, and easiness.
 */
export function sm2(quality, repetitions, easiness, interval) {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5.');
  }

  if (quality < 3) {
    repetitions = 0;
  } else {
    repetitions += 1;
  }

  if (repetitions === 1) {
    interval = 1;
  } else if (repetitions === 2) {
    interval = 6;
  } else {
    interval = Math.ceil(interval * easiness);
  }

  easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (easiness < MIN_EASINESS) {
    easiness = MIN_EASINESS;
  }

  return {
    interval,
    repetitions,
    easiness,
  };
}

/**
 * Creates a new spaced repetition item.
 *
 * @returns {object} A new spaced repetition item with default values.
 */
export function createSpacedRepetitionItem() {
  return {
    repetitions: 0,
    easiness: DEFAULT_EASINESS,
    interval: 0,
  };
}
