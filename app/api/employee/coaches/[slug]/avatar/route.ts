import { NextResponse } from "next/server";
import { canManageCoach, coachBase } from "@/lib/coach-ownership";
import { currentUser } from "@/lib/current-user";
import { authError, isSameOrigin } from "@/lib/auth-http";
import { saveCoachProfile } from "@/lib/coach-profile-db";

export const runtime = "nodejs";

const allowedTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isSameOrigin(request)) {
    return authError("invalid-request", 403);
  }
  const user = await currentUser();
  if (user?.role !== "employee") return authError("employee-only", 403);
  const { slug } = await params;
  if (!canManageCoach(user, slug)) return authError("coach-forbidden", 403);
  const coach = coachBase(slug);
  if (!coach) return authError("coach-not-found", 404);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return authError("invalid-form-data", 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return authError("missing-file", 400);
  }

  if (!allowedTypes.has(file.type)) {
    return authError("unsupported-image-type", 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    return authError("file-too-large", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  const updated = saveCoachProfile(slug, { avatar: dataUrl });
  return NextResponse.json({ ok: true, avatar: updated.avatar, override: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isSameOrigin(request)) {
    return authError("invalid-request", 403);
  }
  const user = await currentUser();
  if (user?.role !== "employee") return authError("employee-only", 403);
  const { slug } = await params;
  if (!canManageCoach(user, slug)) return authError("coach-forbidden", 403);
  const coach = coachBase(slug);
  if (!coach) return authError("coach-not-found", 404);

  const updated = saveCoachProfile(slug, { avatar: null });
  return NextResponse.json({ ok: true, avatar: null, override: updated });
}
