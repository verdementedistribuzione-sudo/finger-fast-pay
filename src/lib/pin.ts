// PIN hashing helper (SHA-256 with per-user salt = user id).
// Stored as base64 in profiles.pin_hash.
export async function hashPin(userId: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${userId}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

export async function verifyPin(userId: string, pin: string, hash: string) {
  return (await hashPin(userId, pin)) === hash;
}
