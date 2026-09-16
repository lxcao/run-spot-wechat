import { useEffect, useRef, useState } from 'react';
import { callFn } from '../lib/api';
import { mergeUploadResults, type Photo, type UploadResult } from '../lib/photos';

type PhotoGridProps = {
  eventId: string;
  photos?: Photo[];
};

function failMsg(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function PhotoGrid({ eventId, photos: initialPhotos = [] }: PhotoGridProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<{ index: number; msg: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  useEffect(() => {
    let cancelled = false;
    const ids = photos.map((photo) => photo.fileID).filter(Boolean);
    if (ids.length === 0) {
      setUrls({});
      return;
    }
    (async () => {
      try {
        const { app } = await import('../lib/cloudbase');
        const res = await app.getTempFileURL({ fileList: ids });
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const item of res.fileList || []) {
          if (item.tempFileURL) next[item.fileID] = item.tempFileURL;
        }
        setUrls(next);
      } catch {
        if (!cancelled) setUrls({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photos]);

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setFailed([]);
    const results: UploadResult[] = [];
    const date = new Date().toISOString().slice(0, 10);
    const rand = Math.random().toString(36).slice(2, 8);
    try {
      const { app } = await import('../lib/cloudbase');
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const cloudPath = `events/${eventId}/${date}_${rand}_${i}.jpg`;
          const uploaded = await app.uploadFile({
            cloudPath,
            filePath: file as unknown as string,
            fileContent: file,
          });
          const fileID = uploaded.fileID;
          if (!fileID) {
            results.push({ ok: false, index: i, msg: '上传失败' });
            continue;
          }
          const res = await callFn<{ photo: Photo }>('updateEventPhotos', {
            eventId,
            fileID,
            uploaderName: '后台管理员',
          });
          if (res.ok && res.data?.photo) {
            results.push({ ok: true, photo: res.data.photo });
          } else {
            results.push({ ok: false, index: i, msg: res.msg });
          }
        } catch (err) {
          results.push({ ok: false, index: i, msg: failMsg(err, '上传失败') });
        }
      }
      const merged = mergeUploadResults(photos, results);
      setPhotos(merged.photos);
      setFailed(merged.failed);
    } catch (err) {
      setFailed([{ index: 0, msg: failMsg(err, '上传失败') }]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onDelete(fileID: string) {
    if (!window.confirm('确定删除该照片？')) return;
    setBusy(true);
    try {
      const res = await callFn<{ photos?: Photo[] }>('deletePhoto', { eventId, fileID });
      if (!res.ok) {
        setFailed([{ index: 0, msg: res.msg }]);
        return;
      }
      setPhotos(res.data?.photos ?? photos.filter((photo) => photo.fileID !== fileID));
      setFailed([]);
    } catch (err) {
      setFailed([{ index: 0, msg: failMsg(err, '删除失败') }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="photo-grid">
      <h2>活动照片</h2>
      <label className="photo-upload">
        上传照片
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          disabled={busy}
          onChange={(e) => onUpload(e.target.files)}
        />
      </label>
      {busy ? <p>处理中...</p> : null}
      {failed.length > 0 ? (
        <ul className="photo-failed" role="alert">
          {failed.map((item) => (
            <li key={`${item.index}-${item.msg}`}>
              {item.index}: {item.msg}
            </li>
          ))}
        </ul>
      ) : null}
      {photos.length === 0 ? <p className="photo-empty">暂无照片</p> : null}
      <ul className="photo-list">
        {photos.map((photo) => {
          const src = urls[photo.fileID];
          return (
            <li key={photo.fileID} className="photo-item">
              {src ? (
                <img src={src} alt={photo.uploaderName || '活动照片'} />
              ) : (
                <span className="photo-fileid">{photo.fileID}</span>
              )}
              <button type="button" onClick={() => onDelete(photo.fileID)} disabled={busy}>
                删除
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
