import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { OrderRequestDetails } from "@/lib/order-request-types";

const keyState = globalThis as typeof globalThis & { ascendPreviewOrderKey?: Buffer };
const previewKey = keyState.ascendPreviewOrderKey ??= randomBytes(32);

function encryptionKey() {
  const configured = process.env.ORDER_CREDENTIALS_KEY;
  if (configured) {
    if (!/^[\da-f]{64}$/i.test(configured))
      throw new Error("credentials-unavailable");
    return Buffer.from(configured, "hex");
  }
  return previewKey;
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
