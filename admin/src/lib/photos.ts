export type Photo = {
  fileID: string;
  uploader?: string;
  uploaderName?: string;
  uploadedAt?: string;
  size?: number;
};

export type UploadFail = { ok: false; index: number; msg: string };
export type UploadOk = { ok: true; photo: Photo };
export type UploadResult = UploadOk | UploadFail;

export function mergeUploadResults(
  existing: Photo[],
  results: UploadResult[],
): { photos: Photo[]; failed: { index: number; msg: string }[] } {
  const photos = [...existing];
  const failed: { index: number; msg: string }[] = [];
  for (const result of results) {
    if (result.ok) photos.push(result.photo);
    else failed.push({ index: result.index, msg: result.msg });
  }
  return { photos, failed };
}
