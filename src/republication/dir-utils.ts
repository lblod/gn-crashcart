import { readdirSync } from 'fs';
import { makeMigrationTimestamp } from '../make-migration-timestamp';
import {
  REPUBLICATION_OUTPUT_GN,
  REPUBLICATION_OUTPUT_PUBLI,
} from './constants';

export function findDirForMeeting(
  meetingUuid: string,
  gnOrPubli: 'gn' | 'publi',
  { forceNew }: { forceNew: boolean } = { forceNew: false }
) {
  const baseDir =
    gnOrPubli === 'gn' ? REPUBLICATION_OUTPUT_GN : REPUBLICATION_OUTPUT_PUBLI;

  const timestamp = makeMigrationTimestamp(new Date());
  if (forceNew) {
    return `${baseDir}/${timestamp}-fix-meeting-${meetingUuid}`;
  }

  const meetingDirs = readdirSync(REPUBLICATION_OUTPUT_GN, {
    withFileTypes: true,
  })
    .concat(readdirSync(REPUBLICATION_OUTPUT_PUBLI, { withFileTypes: true }))
    .filter(
      (dirent) => dirent.isDirectory() && dirent.name.includes(meetingUuid)
    )
    .map((dirent) => dirent.name)
    .sort();

  const existingDir = meetingDirs.at(-1);
  if (existingDir) {
    const existingTimestamp = existingDir.split('-')[0];
    // some safety heuristic, probably overkill
    if (existingTimestamp.startsWith('2025')) {
      return `${baseDir}/${existingTimestamp}-fix-meeting-${meetingUuid}`;
    } else {
      throw new Error(
        `Parsed invalid date ${existingTimestamp} from dir ${existingDir}`
      );
    }
  }

  return `${baseDir}/${timestamp}-fix-meeting-${meetingUuid}`;
}
