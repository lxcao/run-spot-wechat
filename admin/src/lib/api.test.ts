import { describe, expect, it } from 'vitest';
import { unwrapFunctionResult } from './api';

describe('unwrapFunctionResult', () => {
  it('returns msg from cloud function body', () => {
    const r = unwrapFunctionResult({ result: { code: -1, msg: '活动不存在' } });
    expect(r.ok).toBe(false);
    expect(r.msg).toBe('活动不存在');
  });
  it('ok when code is 0', () => {
    const r = unwrapFunctionResult({ result: { code: 0, msg: 'ok', data: { a: 1 } } });
    expect(r.ok).toBe(true);
    expect(r.data).toEqual({ a: 1 });
  });
});
