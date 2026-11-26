import JSZip from 'jszip';

export interface DriveUploadProgress {
  uploaded: number;
  total: number;
  currentPath: string;
}

export interface DriveUploadResult {
  folderId: string;
  folderName: string;
  folderUrl: string;
  uploadedFilesCount: number;
}

function guessMimeType(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.html')) return 'text/html; charset=utf-8';
  if (lower.endsWith('.css')) return 'text/css; charset=utf-8';
  if (lower.endsWith('.json')) return 'application/json; charset=utf-8';
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'application/javascript; charset=utf-8';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'text/plain; charset=utf-8';
  if (lower.endsWith('.md')) return 'text/markdown; charset=utf-8';
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return 'text/yaml; charset=utf-8';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.zip')) return 'application/zip';
  return 'text/plain; charset=utf-8';
}

async function createDriveFolder(
  accessToken: string,
  name: string,
  parentId?: string,
): Promise<{id: string; name: string; webViewLink?: string}> {
  const body: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    body.parents = [parentId];
  }

  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );

  if (res.status === 401) {
    throw new Error('AUTH_EXPIRED');
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`فشل إنشاء المجلد "${name}" على Drive (${res.status}): ${errText.slice(0, 120)}`);
  }

  return (await res.json()) as {id: string; name: string; webViewLink?: string};
}

async function uploadMultipartFileToDrive(
  accessToken: string,
  fileName: string,
  parentId: string,
  mimeType: string,
  content: Uint8Array,
): Promise<void> {
  const boundary = `-------josourDriveBoundary${Math.random().toString(36).slice(2)}`;
  const metadataJson = JSON.stringify({
    name: fileName,
    parents: [parentId],
    mimeType,
  });

  const encoder = new TextEncoder();
  const preamble = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataJson}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  );
  const closing = encoder.encode(`\r\n--${boundary}--`);

  const payloadBlob = new Blob([preamble, content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength) as ArrayBuffer, closing], {
    type: `multipart/related; boundary=${boundary}`,
  });

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: payloadBlob,
    },
  );

  if (res.status === 401) {
    throw new Error('AUTH_EXPIRED');
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`فشل رفع الملف "${fileName}" (${res.status}): ${errText.slice(0, 120)}`);
  }
}

export async function listBundleProjectFiles(): Promise<string[]> {
  const res = await fetch('./gesour-github-pages.zip');
  if (!res.ok) {
    throw new Error('تعذر تحميل حزمة ملفات المشروع للرفع');
  }
  const zip = await JSZip.loadAsync(await res.arrayBuffer());
  return Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export async function uploadProjectToGoogleDriveFolder(opts: {
  accessToken: string;
  folderName: string;
  includeZipArchive: boolean;
  onProgress?: (progress: DriveUploadProgress) => void;
  signal?: AbortSignal;
}): Promise<DriveUploadResult> {
  const {accessToken, folderName, includeZipArchive, onProgress, signal} = opts;
  const cleanFolderName = folderName.trim() || 'Josour-Website-Project';

  const archiveRes = await fetch('./gesour-github-pages.zip', {signal});
  if (!archiveRes.ok) {
    throw new Error('تعذر قراءة أرشيف ملفات المشروع');
  }
  const archiveBytes = new Uint8Array(await archiveRes.arrayBuffer());
  const zip = await JSZip.loadAsync(archiveBytes);

  const fileEntries = Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalUploads = fileEntries.length + (includeZipArchive ? 1 : 0);
  onProgress?.({uploaded: 0, total: totalUploads, currentPath: `إنشاء مجلد ${cleanFolderName}...`});

  const rootFolder = await createDriveFolder(accessToken, cleanFolderName);
  const folderCache = new Map<string, string>();
  folderCache.set('', rootFolder.id);

  const ensureSubfolder = async (dirRelPath: string): Promise<string> => {
    if (folderCache.has(dirRelPath)) {
      return folderCache.get(dirRelPath)!;
    }
    const parts = dirRelPath.split('/').filter(Boolean);
    let currentKey = '';
    let parentId = rootFolder.id;

    for (const part of parts) {
      currentKey = currentKey ? `${currentKey}/${part}` : part;
      if (folderCache.has(currentKey)) {
        parentId = folderCache.get(currentKey)!;
      } else {
        const created = await createDriveFolder(accessToken, part, parentId);
        folderCache.set(currentKey, created.id);
        parentId = created.id;
      }
    }
    return parentId;
  };

  let uploadedCount = 0;

  for (const entry of fileEntries) {
    if (signal?.aborted) {
      throw new Error('تم إيقاف عملية الرفع');
    }

    const segments = entry.name.split('/');
    const fileName = segments.pop() || entry.name;
    const parentRel = segments.join('/');
    const parentId = await ensureSubfolder(parentRel);

    onProgress?.({
      uploaded: uploadedCount,
      total: totalUploads,
      currentPath: entry.name,
    });

    const bytes = await entry.async('uint8array');
    await uploadMultipartFileToDrive(
      accessToken,
      fileName,
      parentId,
      guessMimeType(entry.name),
      bytes,
    );

    uploadedCount += 1;
    onProgress?.({
      uploaded: uploadedCount,
      total: totalUploads,
      currentPath: entry.name,
    });
  }

  if (includeZipArchive && !signal?.aborted) {
    onProgress?.({
      uploaded: uploadedCount,
      total: totalUploads,
      currentPath: 'gesour-github-pages.zip',
    });
    await uploadMultipartFileToDrive(
      accessToken,
      'gesour-github-pages.zip',
      rootFolder.id,
      'application/zip',
      archiveBytes,
    );
    uploadedCount += 1;
    onProgress?.({
      uploaded: uploadedCount,
      total: totalUploads,
      currentPath: 'gesour-github-pages.zip',
    });
  }

  return {
    folderId: rootFolder.id,
    folderName: rootFolder.name,
    folderUrl: rootFolder.webViewLink || `https://drive.google.com/drive/folders/${rootFolder.id}`,
    uploadedFilesCount: uploadedCount,
  };
}
