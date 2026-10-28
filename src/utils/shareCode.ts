/**
 * The text envelope shared by room and group codes: "<PREFIX><version>-<base64url body>-<8 hex checksum>".
 * The body is the UTF-8 payload in base64url; the checksum (FNV-1a over the body) catches truncated or edited codes.
 */

export type ShareCodeError = "format" | "checksum" | "newer";

export function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** UTF-8 bytes as a binary string, so btoa accepts any text (accents, emoji). ASCII stays as it is. */
const toUtf8Binary = (text: string) =>
  encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_match, hex: string) => String.fromCharCode(parseInt(hex, 16)));
/** Throws on bytes that are not valid UTF-8. */
const fromUtf8Binary = (binary: string) =>
  decodeURIComponent(Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));

export const toBase64Url = (text: string) =>
  btoa(toUtf8Binary(text)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const fromBase64Url = (text: string) => fromUtf8Binary(atob(text.replace(/-/g, "+").replace(/_/g, "/")));

export function encodeShareCode(prefix: string, version: number, payload: string): string {
  const body = toBase64Url(payload);
  return `${prefix}${version}-${body}-${checksum(body)}`;
}

/**
 * The payload of a pasted code (spaces and line breaks around it are fine). `prefix` holds only letters, digits and
 * hyphens. Never throws.
 */
export function decodeShareCode(
  text: string,
  prefix: string,
  currentVersion: number,
): { payload: string } | { error: ShareCodeError } {
  const match = text.trim().match(new RegExp(`^${prefix}(\\d+)-([A-Za-z0-9_-]+)-([0-9a-f]{8})$`));
  if (!match) return { error: "format" };
  const [, version, body, sum] = match;
  if (Number(version) > currentVersion) return { error: "newer" };
  if (checksum(body) !== sum) return { error: "checksum" };
  try {
    return { payload: fromBase64Url(body) };
  } catch {
    return { error: "format" };
  }
}
