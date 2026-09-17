import { describe, expect, it } from 'vitest';
import { mergeUploadResults } from './photos';

describe('mergeUploadResults', () => {
  it('keeps successes and lists failed indexes', () => {
    const r = mergeUploadResults(
      [{ fileID: 'cloud://a' }],
      [{ ok: true, photo: { fileID: 'cloud://b' } }, { ok: false, index: 1, msg: '太大' }],
    );
    expect(r.photos.map((p) => p.fileID)).toEqual(['cloud://a', 'cloud://b']);
    expect(r.failed).toEqual([{ index: 1, msg: '太大' }]);
  });
});
