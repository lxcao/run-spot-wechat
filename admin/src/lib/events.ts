export function checkWebAdmin(team: { webAdmins?: string[] } | null, uid: string | null) {
  if (!team || !uid) return false;
  return Array.isArray(team.webAdmins) && team.webAdmins.includes(uid);
}
