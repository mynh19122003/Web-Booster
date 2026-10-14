"use client";

/** Same-origin API requests. Failed requests remain failures. */
export function publicRequest(input: string, options: RequestInit = {}): Promise<Response> {
  return fetch(input, { credentials: "same-origin", cache: "no-store", ...options });
}
