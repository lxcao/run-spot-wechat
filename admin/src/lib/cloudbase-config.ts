export function hostingInfersEnv(hostname: string): boolean {
  return (
    hostname.endsWith('.tcloudbaseapp.com') ||
    hostname.endsWith('.webapps.tcloudbase.com') ||
    hostname.endsWith('.tcb.qcloud.la')
  );
}

export type CloudBaseInitConfig = {
  env?: string;
  region: string;
  accessKey?: string;
  auth: { detectSessionInUrl: true };
};

export function buildInitConfig(input: {
  hostname: string;
  env?: string;
  region?: string;
  accessKey?: string;
}): CloudBaseInitConfig {
  const config: CloudBaseInitConfig = {
    region: input.region || 'ap-shanghai',
    auth: { detectSessionInUrl: true },
  };
  if (input.accessKey) config.accessKey = input.accessKey;
  if (input.env && !hostingInfersEnv(input.hostname)) config.env = input.env;
  return config;
}
