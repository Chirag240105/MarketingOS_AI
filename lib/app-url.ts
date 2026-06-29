const PRODUCTION_APP_URL = "https://marketing-os-ai.vercel.app";
const LOCAL_HOSTNAME = ["local", "host"].join("");
const LOCAL_IP = ["127", "0", "0", "1"].join(".");

function normalizeUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/$/, "");
}

function isLocalUrl(value: string) {
  try {
    const hostname = new URL(normalizeUrl(value)).hostname;
    return hostname === LOCAL_HOSTNAME || hostname === LOCAL_IP;
  } catch {
    return false;
  }
}

export function getAppUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
  ].filter((value): value is string => Boolean(value?.trim()));

  const explicit = candidates.find((value) => !isLocalUrl(value));
  if (explicit) return normalizeUrl(explicit);

  if (process.env.VERCEL_URL) return normalizeUrl(process.env.VERCEL_URL);

  return PRODUCTION_APP_URL;
}

export function getSafeAbsoluteUrl(value?: string | null) {
  if (value?.trim() && !isLocalUrl(value)) return normalizeUrl(value);
  return getAppUrl();
}
