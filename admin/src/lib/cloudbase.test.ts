import { describe, expect, it } from 'vitest';
import { buildInitConfig } from './cloudbase-config';

describe('buildInitConfig', () => {
  it('always passes env; SDK throws INVALID_PARAMS when env is missing', () => {
    const config = buildInitConfig({
      env: 'run-spot-prod-d1gb2jd1j3ce2e7fb',
      region: 'ap-shanghai',
      accessKey: 'pk_test',
    });
    expect(config.env).toBe('run-spot-prod-d1gb2jd1j3ce2e7fb');
    expect(config.accessKey).toBe('pk_test');
  });

  it('throws if env is empty so a hosting build cannot ship without it', () => {
    expect(() => buildInitConfig({ env: '' })).toThrow(/VITE_CLOUDBASE_ENV_ID/);
  });
});

