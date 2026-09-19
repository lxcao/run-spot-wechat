import { describe, expect, it } from 'vitest';
import { buildInitConfig, hostingInfersEnv } from './cloudbase-config';

describe('hostingInfersEnv', () => {
  it('is true on CloudBase static hosting hosts', () => {
    expect(hostingInfersEnv('run-spot-prod-d1gb2jd1j3ce2e7fb-1486717042.tcloudbaseapp.com')).toBe(true);
    expect(hostingInfersEnv('admin-xxx.webapps.tcloudbase.com')).toBe(true);
  });

  it('is false on localhost', () => {
    expect(hostingInfersEnv('localhost')).toBe(false);
    expect(hostingInfersEnv('127.0.0.1')).toBe(false);
  });
});

describe('buildInitConfig', () => {
  it('omits env on tcloudbaseapp.com so the SDK does not throw INVALID_PARAMS', () => {
    const config = buildInitConfig({
      hostname: 'env-123.tcloudbaseapp.com',
      env: 'env-123',
      region: 'ap-shanghai',
      accessKey: 'pk_test',
    });
    expect(config.env).toBeUndefined();
    expect(config.accessKey).toBe('pk_test');
    expect(config.region).toBe('ap-shanghai');
  });

  it('keeps env on localhost for local Vite', () => {
    const config = buildInitConfig({
      hostname: 'localhost',
      env: 'env-123',
      region: 'ap-shanghai',
      accessKey: 'pk_test',
    });
    expect(config.env).toBe('env-123');
  });
});
