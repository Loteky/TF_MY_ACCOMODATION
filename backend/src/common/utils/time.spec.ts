import { durationToSeconds } from './time';

describe('durationToSeconds', () => {
  it('converts seconds', () => {
    expect(durationToSeconds('30s')).toBe(30);
  });

  it('converts minutes', () => {
    expect(durationToSeconds('2m')).toBe(120);
  });

  it('throws on invalid duration', () => {
    expect(() => durationToSeconds('abc')).toThrow('Unsupported duration format');
  });
});
