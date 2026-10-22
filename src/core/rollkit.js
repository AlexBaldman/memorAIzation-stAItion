/** ROLL//99 headless percentile dice. No DOM, framework or PAO dependencies. */
export const ROLL_KIND = 'percentile-d10';
export function secureDigit(rng = globalThis.crypto) {
  if (!rng?.getRandomValues) throw new Error('Secure random source unavailable');
  // Rejection sampling avoids modulo bias in the 2**32 uniform range.
  const limit = Math.floor(0x100000000 / 10) * 10;
  const sample = new Uint32Array(1);
  do { rng.getRandomValues(sample); } while (sample[0] >= limit);
  return sample[0] % 10;
}
export function formatPercentile(tens, ones) {
  if (![tens, ones].every(n => Number.isInteger(n) && n >= 0 && n <= 9)) {
    throw new RangeError('Expected two digits between 0 and 9');
  }
  return `${tens}${ones}`;
}
export function rollPercentile({rng = globalThis.crypto, clock = () => new Date(), id = () => globalThis.crypto.randomUUID()} = {}) {
  const tens = secureDigit(rng);
  const ones = secureDigit(rng);
  return Object.freeze({
    id: id(), kind: ROLL_KIND, tens, ones,
    value: tens * 10 + ones,
    display: formatPercentile(tens, ones),
    source: 'digital', occurredAt: clock().toISOString(),
  });
}
/** Physical rolls use the same contract, but must never be mislabeled as digital RNG. */
export function enterPhysicalRoll(tens, ones, {clock = () => new Date(), id = () => globalThis.crypto.randomUUID()} = {}) {
  const display = formatPercentile(tens, ones);
  return Object.freeze({id:id(), kind:ROLL_KIND, tens, ones, value:Number(display), display, source:'physical-entry',occurredAt:clock().toISOString()});
}