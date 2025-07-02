export function makeMigrationTimestamp(date: Date): string {
  return date
    .toISOString()
    .split('.')[0]
    .replaceAll('-', '')
    .replaceAll(':', '')
    .replaceAll('T', '');
}
