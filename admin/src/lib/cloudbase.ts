import cloudbase from '@cloudbase/js-sdk';
import { buildInitConfig } from './cloudbase-config';

export { buildInitConfig, hostingInfersEnv } from './cloudbase-config';

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

export const app = cloudbase.init(
  buildInitConfig({
    hostname,
    env: import.meta.env.VITE_CLOUDBASE_ENV_ID,
    region: import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai',
    accessKey: import.meta.env.VITE_PUBLISHABLE_KEY,
  }),
);

export const auth = app.auth;
