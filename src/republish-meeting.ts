import { sparqlEscapeUri } from 'mu';

interface FileContent {
  contentType: 'file';
  path: string;
}
interface TextContent {
  contentType: 'text';
  value: string;
}
interface PublishedResource {
  uri: string;
  uuid: string;
  content: FileContent | TextContent;
  kind: 'notulen' | 'agenda' | 'uittreksel' | 'besluitenlijst';
}
interface MeetingData {
  uri: string;
}

async function republishMeeting(meetingUri: string) {
  const publishedResources = await getAllPublishedResources(meetingUri);
  const meetingData = await getMeetingData(meetingUri);
  for (const pr of publishedResources) {
    const deleteMigration = makeDeleteMigration(pr);
    await makeInsertMigration(pr);
  }
}
async function getMeetingData(meetingUri: string): MeetingData {}
async function getPublishedResourceData(prUri: string): PublishedResource {
  const pr = sparqlEscapeUri(prUri);
  const queryStr = `
  SELECT * WHERE {
    ${pr} ?p ?v.
  }`;

}

async function getAllPublishedResources(
  meetingUri: string
): PublishedResource[] {
  const meeting = sparqlEscapeUri(meetingUri);
  const queryStr = `
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  SELECT ?pr WHERE {
    ${meeting} ext:hasPublishingLog ?log.
      ?log a ext:PublishingLog.
      ?log ext:publishingAction "publish".
      ?log ext:hasPublishedResource ?pr.
  }
  `;
}
function makeDeleteMigration(publishedResource: PublishedResource): string {
  const queryStr = `
  DELETE {
      ?publishedResource ?p ?v.
      ?owner ?ownerP ?publishedResource.
  } WHERE {
      BIND(${sparqlEscapeUri(publishedResource.uri)} as ?publishedResource)
      ?publishedResource ?p ?v.
      ?owner ?ownerP ?publishedResource.
  }
  `;
  return queryStr;
}

async function makeInsertMigration(
  publishedResource: PublishedResource,
  meetingData: MeetingData
) {}
