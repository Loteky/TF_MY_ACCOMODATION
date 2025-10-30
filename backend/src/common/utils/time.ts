export function durationToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)([smhdw])$/i);
  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    case 'w':
      return value * 60 * 60 * 24 * 7;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}
