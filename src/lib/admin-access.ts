const DEFAULT_ADMIN_EMAILS =
  process.env.NODE_ENV === "production" ? [] : ["micdream4@gmail.com"];

function getConfiguredAdminEmails() {
  const raw = process.env.VOICE_LAB_ADMIN_EMAILS;
  if (!raw) return DEFAULT_ADMIN_EMAILS;

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isVoiceLabAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return getConfiguredAdminEmails().includes(email.trim().toLowerCase());
}
