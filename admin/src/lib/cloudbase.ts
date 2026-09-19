import cloudbase from '@cloudbase/js-sdk';
import { buildInitConfig } from './cloudbase-config';

export { buildInitConfig } from './cloudbase-config';

export const app = cloudbase.init(
  buildInitConfig({
    env: import.meta.env.VITE_CLOUDBASE_ENV_ID,
    region: import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai',
    accessKey: import.meta.env.VITE_PUBLISHABLE_KEY,
  }),
);

export const auth = app.auth;
