/** Prevent user-editable text from closing a JSON-LD script element. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
