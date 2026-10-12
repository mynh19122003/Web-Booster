import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { authError, isSameOrigin } from "@/lib/auth-http";
import { updateUserAvatar } from "@/lib/auth-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return authError("invalid-request", 403);
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  let form: FormData;
  try { form = await request.formData(); } catch { return authError("invalid-form-data", 400); }
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return authError("missing-file", 400);
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return authError("unsupported-image-type", 400);
  if (file.size > 5 * 1024 * 1024) return authError("file-too-large", 400);
  const buffer = Buffer.from(await file.arrayBuffer());
  const valid = file.type === "image/png" ? buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : file.type === "image/jpeg" ? buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
    : buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  if (!valid) return authError("unsupported-image-type", 400);
  return NextResponse.json({ profile: updateUserAvatar(user, `data:${file.type};base64,${buffer.toString("base64")}`) });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return authError("invalid-request", 403);
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  return NextResponse.json({ profile: updateUserAvatar(user, null) });
}
