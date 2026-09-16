const READABLE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateMissionId() {
  const values = new Uint32Array(6);
  crypto.getRandomValues(values);

  const token = Array.from(values, (value) => READABLE_CHARS[value % READABLE_CHARS.length]).join("");
  return `CM-${token}`;
}
