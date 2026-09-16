export type FnResult<T> = { ok: true; data: T; msg: string } | { ok: false; data: null; msg: string };

export function unwrapFunctionResult<T>(res: { result?: { code?: number; msg?: string; data?: T } }): FnResult<T> {
  const body = res.result;
  if (!body) return { ok: false, data: null, msg: '云函数无返回' };
  if (body.code === 0) return { ok: true, data: body.data as T, msg: body.msg || 'ok' };
  return { ok: false, data: null, msg: body.msg || '请求失败' };
}

function toResultShape<T>(res: unknown): { result?: { code?: number; msg?: string; data?: T } } {
  if (!res || typeof res !== 'object') return {};
  const obj = res as { result?: { code?: number; msg?: string; data?: T }; data?: { code?: number; msg?: string; data?: T } };
  if (obj.result && typeof obj.result === 'object') {
    return { result: obj.result };
  }
  if (obj.data && typeof obj.data === 'object' && 'code' in obj.data) {
    return { result: obj.data };
  }
  return {};
}

export async function callFn<T>(name: string, data?: Record<string, unknown>): Promise<FnResult<T>> {
  const { app } = await import('./cloudbase');
  const res = await app.callFunction({ name, data: data || {} });
  return unwrapFunctionResult<T>(toResultShape<T>(res));
}
