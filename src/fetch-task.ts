import { setTimeout } from 'timers/promises';

const TASK_ENDPOINT = 'http://prepublish/publication-tasks';
export const TASK_STATUS_FAILURE =
  'http://lblod.data.gift/besluit-publicatie-melding-statuses/failure';
export const TASK_STATUS_CREATED =
  'http://lblod.data.gift/besluit-publicatie-melding-statuses/created';
export const TASK_STATUS_SUCCESS =
  'http://lblod.data.gift/besluit-publicatie-melding-statuses/success';
export const TASK_STATUS_RUNNING =
  'http://lblod.data.gift/besluit-publicatie-melding-statuses/ongoing';

export async function fetchMuTask(
  taskId: string,

  fetchOptions: RequestInit
) {
  return fetch(`${TASK_ENDPOINT}/${taskId}`, fetchOptions);
}

/**
 * @param taskId
 * @param [pollDelayMs] time to wait between each status poll
 * @param [timeoutMs] maximum time to wait before throwing
 * */
export async function waitForMuTask(
  taskId: string,
  fetchOptions: RequestInit,
  pollDelayMs: number = 1000,
  timeoutMs: number = 300000
): Promise<Record<string, string>> {
  let resp;
  let jsonBody;
  let currentStatus;
  const startTime = Date.now();
  do {
    await setTimeout(pollDelayMs, undefined);
    resp = await fetchMuTask(taskId, fetchOptions);
    if (resp.ok) {
      jsonBody = await resp.json();
      currentStatus = jsonBody.data.status;
    } else {
      currentStatus = null;
    }
  } while (
    resp.ok &&
    (currentStatus === TASK_STATUS_RUNNING ||
      currentStatus === TASK_STATUS_CREATED) &&
    Date.now() - startTime < timeoutMs
  );

  if (!resp.ok) {
    const reason = await resp.text();
    throw new Error(reason);
  }

  if (currentStatus === TASK_STATUS_SUCCESS) {
    return jsonBody;
  } else if (currentStatus === TASK_STATUS_FAILURE) {
    throw new Error('Task failed.');
  } else if (currentStatus === TASK_STATUS_RUNNING) {
    throw new Error('Task timed out.');
  } else {
    throw new Error('Task in unexpected state');
  }
}

export async function fetchTaskifiedEndpoint(
  url: string,
  fetchOptions: RequestInit
): Promise<string> {
  const res = await fetch(url, fetchOptions);
  if (res.ok) {
    const json = await res.json();
    console.log('json task data', json.data)
    return json.data.id;
  } else {
    throw new Error(await res.text());
  }
}
