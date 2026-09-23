export type StoreAssetKind = "logo" | "banner";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isOrganizationId(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function buildStoreAssetPath(
  organizationId: string,
  kind: StoreAssetKind,
  timestamp = Date.now(),
  nonce = cryptoRandom()
) {
  return `${organizationId.trim()}/store/${kind}-${timestamp}-${nonce}.webp`;
}

export function isOwnStoreAssetPath(
  path: string,
  organizationId: string
): boolean {
  const org = organizationId.trim();
  if (!isOrganizationId(org)) return false;
  return path.startsWith(`${org}/store/`) && path.endsWith(".webp");
}

function cryptoRandom() {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(
    ""
  );
}
