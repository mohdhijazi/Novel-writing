import { requireAccessToken } from './auth';

const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const JSON_MIME_TYPE = 'application/json';
const MULTIPART_BOUNDARY = 'worlds-boundary';

export interface DriveFile {
  id: string;
  name: string;
}

/** Escapes a value used inside a Drive query string literal. */
function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Builds a search URL. The whole `q` filter must go through
 * encodeURIComponent — partially encoded filters are silently ignored by Drive,
 * which makes searches return nothing and devices create duplicate files.
 */
function searchUrl(filters: string[]): string {
  const query = encodeURIComponent(filters.join(' and '));
  return `${FILES_URL}?q=${query}&spaces=drive&fields=files(id,name)&pageSize=100`;
}

async function driveFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${requireAccessToken()}`);
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    throw new Error(`Google Drive request failed (${String(response.status)}).`);
  }
  return response;
}

async function readJson<T>(response: Response): Promise<T> {
  const data: unknown = await response.json();
  return data as T;
}

function multipartBody(metadata: object, content: unknown): string {
  return [
    `--${MULTIPART_BOUNDARY}`,
    `Content-Type: ${JSON_MIME_TYPE}; charset=UTF-8`,
    '',
    JSON.stringify(metadata),
    `--${MULTIPART_BOUNDARY}`,
    `Content-Type: ${JSON_MIME_TYPE}; charset=UTF-8`,
    '',
    JSON.stringify(content, null, 2),
    `--${MULTIPART_BOUNDARY}--`,
    '',
  ].join('\r\n');
}

export async function findFolder(name: string, parentId?: string): Promise<DriveFile | null> {
  return findChild(name, FOLDER_MIME_TYPE, parentId);
}

export async function findJsonFile(name: string, parentId: string): Promise<DriveFile | null> {
  return findChild(name, JSON_MIME_TYPE, parentId);
}

async function findChild(
  name: string,
  mimeType: string,
  parentId: string | undefined,
): Promise<DriveFile | null> {
  const filters = [
    `name = '${escapeQueryValue(name)}'`,
    `mimeType = '${mimeType}'`,
    'trashed = false',
    parentId ? `'${escapeQueryValue(parentId)}' in parents` : "'root' in parents",
  ];
  const response = await driveFetch(searchUrl(filters));
  const { files } = await readJson<{ files: DriveFile[] }>(response);
  return files[0] ?? null;
}

export async function listSubfolders(parentId: string): Promise<DriveFile[]> {
  const filters = [
    `mimeType = '${FOLDER_MIME_TYPE}'`,
    'trashed = false',
    `'${escapeQueryValue(parentId)}' in parents`,
  ];
  const response = await driveFetch(searchUrl(filters));
  const { files } = await readJson<{ files: DriveFile[] }>(response);
  return files;
}

export async function createFolder(name: string, parentId?: string): Promise<DriveFile> {
  const response = await driveFetch(`${FILES_URL}?fields=id,name`, {
    method: 'POST',
    headers: { 'Content-Type': JSON_MIME_TYPE },
    body: JSON.stringify({
      name,
      mimeType: FOLDER_MIME_TYPE,
      parents: [parentId ?? 'root'],
    }),
  });
  return readJson<DriveFile>(response);
}

export async function createJsonFile(
  name: string,
  parentId: string,
  content: unknown,
): Promise<DriveFile> {
  const response = await driveFetch(`${UPLOAD_URL}?uploadType=multipart&fields=id,name`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${MULTIPART_BOUNDARY}` },
    body: multipartBody({ name, mimeType: JSON_MIME_TYPE, parents: [parentId] }, content),
  });
  return readJson<DriveFile>(response);
}

export async function updateJsonFile(fileId: string, content: unknown): Promise<void> {
  await driveFetch(`${UPLOAD_URL}/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': JSON_MIME_TYPE },
    body: JSON.stringify(content, null, 2),
  });
}

export async function downloadJsonFile<T>(fileId: string): Promise<T> {
  const response = await driveFetch(`${FILES_URL}/${fileId}?alt=media`);
  return readJson<T>(response);
}
