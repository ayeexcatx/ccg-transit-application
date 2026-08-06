import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

type DesiredFile = {
  truckNumber: string;
  fileName: string;
  companyFolderName: string;
  truckFolderName: string;
  pathKey: string;
  htmlContent: string;
};

type ExistingDriveRecord = {
  dispatch_id?: string;
  truck_number?: string;
  file_name?: string;
  company_folder_name?: string;
  truck_folder_name?: string;
  path_key?: string;
  root_folder_id?: string;
  file_id?: string;
  status?: string;
  finalizationMode?: boolean;
  synced_at?: string;
};

type SyncPayload = {
  dispatchId: string;
  rootFolderId: string;
  companyName?: string;
  desiredFiles: DesiredFile[];
  previousFiles?: ExistingDriveRecord[];
  updatedAt?: string;
  status?: string;
};

type DriveFile = {
  id: string;
  name: string;
  parents?: string[];
  mimeType?: string;
};

type SyncStage = 'parse_payload' | 'get_connector_token' | 'ensure_company_folder' |
  'ensure_truck_folder' | 'upsert_file' | 'delete_stale_file';

class DriveRequestError extends Error {
  driveHttpStatus: number;
  driveResponseBody: string;

  constructor(status: number, responseBody: string) {
    super(`Google Drive API request failed (${status}).`);
    this.driveHttpStatus = status;
    this.driveResponseBody = responseBody.slice(0, 4000);
  }
}

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

function escapeDriveQueryValue(value: string): string {
  return value.replace(/'/g, "\\'");
}

async function getGoogleDriveAccessToken(req: Request): Promise<string> {
  const base44 = createClientFromRequest(req);
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
  return accessToken;
}

async function driveRequest<T>(
  token: string,
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new DriveRequestError(response.status, text);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function findFileByNameInParent(
  token: string,
  name: string,
  parentId: string,
  mimeType?: string
): Promise<DriveFile | null> {
  const mimeFilter = mimeType ? ` and mimeType='${mimeType}'` : '';
  const q = `name='${escapeDriveQueryValue(name)}' and '${parentId}' in parents and trashed=false${mimeFilter}`;

  const url = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(
    'files(id,name,mimeType,parents)'
  )}&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const data = await driveRequest<{ files?: DriveFile[] }>(token, url);
  return data.files?.[0] ?? null;
}

async function ensureFolder(token: string, parentId: string, folderName: string): Promise<DriveFile> {
  const existing = await findFileByNameInParent(
    token,
    folderName,
    parentId,
    'application/vnd.google-apps.folder'
  );

  if (existing) return existing;

  return driveRequest<DriveFile>(token, `${DRIVE_API}/files?supportsAllDrives=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });
}

async function upsertHtmlFile(
  token: string,
  parentId: string,
  fileName: string,
  htmlContent: string
): Promise<DriveFile> {
  const existing = await findFileByNameInParent(token, fileName, parentId);

  if (existing) {
    await driveRequest<DriveFile>(
      token,
      `${DRIVE_UPLOAD_API}/files/${existing.id}?uploadType=media&supportsAllDrives=true`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: htmlContent,
      }
    );

    return existing;
  }

  const boundary = `syncDispatchHtmlToDrive_${crypto.randomUUID()}`;
  const metadata = {
    name: fileName,
    parents: [parentId],
    mimeType: 'text/html',
  };

  const multipartBody =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
    `${htmlContent}\r\n` +
    `--${boundary}--`;

  return driveRequest<DriveFile>(
    token,
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&supportsAllDrives=true`,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );
}

async function deleteFile(token: string, fileId: string): Promise<void> {
  await driveRequest<void>(token, `${DRIVE_API}/files/${fileId}?supportsAllDrives=true`, {
    method: 'DELETE',
  });
}

async function getPayload(req: Request): Promise<SyncPayload> {
  const body = await req.json();

  if (!body || typeof body !== 'object' || !('dispatchId' in body)) {
    throw new Error('Invalid payload for syncDispatchHtmlToDrive.');
  }

  return body as SyncPayload;
}

Deno.serve(async (req: Request) => {
  console.log('syncDispatchHtmlToDrive invoked');
  let stage: SyncStage = 'parse_payload';
  let payloadContext: Partial<SyncPayload> = {};

  try {
    const payload = await getPayload(req);
    payloadContext = payload;
    const {
      dispatchId,
      rootFolderId,
      desiredFiles = [],
      previousFiles = [],
      updatedAt = new Date().toISOString(),
      status = 'synced',
    } = payload;
    console.log('syncDispatchHtmlToDrive payload summary', {
      dispatchId: payload.dispatchId,
      rootFolderId: payload.rootFolderId,
      desiredFilesCount: payload.desiredFiles?.length ?? 0,
      previousFilesCount: payload.previousFiles?.length ?? 0,
      status: payload.status ?? 'synced',
    });

    if (!dispatchId) throw new Error('dispatchId is required.');
    if (!rootFolderId) throw new Error('rootFolderId is required.');

    console.log('syncDispatchHtmlToDrive before getting connector token');
    stage = 'get_connector_token';
    const token = await getGoogleDriveAccessToken(req);
    console.log('syncDispatchHtmlToDrive after token received');
    const syncedFiles: ExistingDriveRecord[] = [];

    const desiredPathKeys = new Set(desiredFiles.map((file) => file.pathKey));
    const staleFiles = previousFiles.filter(
      (file) => file.path_key && !desiredPathKeys.has(file.path_key)
    );
    const removedFiles: ExistingDriveRecord[] = [];

    for (const stale of staleFiles) {
      if (!stale.file_id) continue;

      stage = 'delete_stale_file';
      await deleteFile(token, stale.file_id);
      removedFiles.push(stale);
    }

    for (const target of desiredFiles) {
      console.log('syncDispatchHtmlToDrive before syncing each file', {
        dispatchId,
        truckNumber: target.truckNumber,
        fileName: target.fileName,
        pathKey: target.pathKey,
      });

      stage = 'ensure_company_folder';
      const companyFolder = await ensureFolder(token, rootFolderId, target.companyFolderName);
      stage = 'ensure_truck_folder';
      const truckFolder = await ensureFolder(token, companyFolder.id, target.truckFolderName);
      stage = 'upsert_file';
      const uploaded = await upsertHtmlFile(token, truckFolder.id, target.fileName, target.htmlContent);

      syncedFiles.push({
        dispatch_id: dispatchId,
        truck_number: target.truckNumber,
        file_name: target.fileName,
        company_folder_name: target.companyFolderName,
        truck_folder_name: target.truckFolderName,
        path_key: target.pathKey,
        root_folder_id: rootFolderId,
        file_id: uploaded.id,
        status,
        synced_at: updatedAt,
      });
    }

    return Response.json({
      files: syncedFiles,
      removedFiles,
    });
  } catch (error) {
    const diagnostic = {
      invocationStage: 'function_execution',
      stage,
      dispatchId: payloadContext.dispatchId || null,
      dispatchStatus: payloadContext.status || null,
      finalizeAfterSync: Boolean(payloadContext.finalizationMode),
      desiredFileCount: payloadContext.desiredFiles?.length ?? 0,
      rootFolderId: payloadContext.rootFolderId || null,
      connectorTokenRetrievalFailed: stage === 'get_connector_token',
      driveHttpStatus: error instanceof DriveRequestError ? error.driveHttpStatus : null,
      driveResponseBody: error instanceof DriveRequestError ? error.driveResponseBody : null,
      error: error instanceof Error ? error.message : String(error),
    };
    console.error('syncDispatchHtmlToDrive failed.', diagnostic);
    return Response.json(diagnostic, { status: 500 });
  }
});
