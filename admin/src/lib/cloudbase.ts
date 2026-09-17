import cloudbase from '@cloudbase/js-sdk';

const env = import.meta.env.VITE_CLOUDBASE_ENV_ID;
const region = import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai';
const accessKey = import.meta.env.VITE_PUBLISHABLE_KEY;

export const app = cloudbase.init({
  env,
  region,
  accessKey,
  auth: { detectSessionInUrl: true },
});

export const auth = app.auth;
