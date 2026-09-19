export type CloudBaseInitConfig = {
  env: string;
  region: string;
  accessKey?: string;
  auth: { detectSessionInUrl: true };
};

export function buildInitConfig(input: {
  env: string;
  region?: string;
  accessKey?: string;
}): CloudBaseInitConfig {
  if (!input.env) {
    throw new Error('VITE_CLOUDBASE_ENV_ID is required');
  }
  const config: CloudBaseInitConfig = {
    env: input.env,
    region: input.region || 'ap-shanghai',
    auth: { detectSessionInUrl: true },
  };
  if (input.accessKey) config.accessKey = input.accessKey;
  return config;
}
