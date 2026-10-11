export function parseRiotId(value: unknown): { gameName: string; tagLine: string } | null {
  if (typeof value !== "string" || value.length > 121 || /[\u0000-\u001f\u007f]/.test(value)) return null;
  const parts = value.trim().split("#");
  if (parts.length !== 2) return null;
  const [gameName, tagLine] = parts.map(part => part.trim());
  if (!gameName || gameName.length > 100 || !tagLine || tagLine.length > 20 ||
    [gameName, tagLine].some(part => part === "." || part === "..")) return null;
  return { gameName, tagLine };
}
