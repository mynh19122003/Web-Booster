import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { OrderRequestDetails } from "@/lib/order-request-types";

function encryptionKey() {
  const configured = process.env.ORDER_CREDENTIALS_KEY;
  if (configured) {
    if (!/^[\da-f]{64}$/i.test(configured))
      throw new Error("credentials-unavailable");
    return Buffer.from(configured, "hex");
  }
  if (process.env.NODE_ENV === "production")
    throw new Error("credentials-unavailable");
  // Local development only. Keep this file with the database across restarts.
  const directory = dirname(
    process.env.AUTH_DATABASE_PATH ||
      join(process.cwd(), ".data", "auth.sqlite"),
  );
  const path = join(directory, "order-credentials.key");
  mkdirSync(directory, { recursive: true });
  try {
    writeFileSync(path, randomBytes(32), { flag: "wx", mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  const key = readFileSync(path);
  if (key.length !== 32) throw new Error("credentials-unavailable");
  return key;
}

export function encryptOrderDetails(
  requestId: string,
  details: OrderRequestDetails,
) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(requestId));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(details), "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptOrderDetails(
  requestId: string,
  value: string,
): OrderRequestDetails {
  const [version, iv, tag, ciphertext] = value.split(":");
  if (version !== "v1" || !iv || !tag || !ciphertext)
    throw new Error("credentials-unavailable");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAAD(Buffer.from(requestId));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8"),
  ) as OrderRequestDetails;
}
