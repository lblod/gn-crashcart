export function makeMigrationTimestamp(date: Date): string {
  return date
    .toISOString()
    .split(/[ZT:.-]/)
    .join('');
}
