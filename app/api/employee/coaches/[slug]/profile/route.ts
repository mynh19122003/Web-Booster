import { NextResponse } from "next/server";
import { canManageCoach, coachAccess, coachBase, coachPublished, setCoachPublished } from "@/lib/coach-ownership";
import { currentUser } from "@/lib/current-user";
import { authError, isSameOrigin } from "@/lib/auth-http";
import { saveEmployeePresence } from "@/lib/employee-presence";
import {
  coachProfileOverride,
  saveCoachProfile,
  resetCoachProfile,
  applyCoachOverride,
  type CoachProfileInput,
} from "@/lib/coach-profile-db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await currentUser();
  if (user?.role !== "employee") return authError("employee-only", 403);
  const { slug } = await params;
  if (!canManageCoach(user, slug)) return authError("coach-forbidden", 403);
  const coach = coachBase(slug);
  if (!coach) return authError("coach-not-found", 404);

  const override = coachProfileOverride(slug);
  const effective = applyCoachOverride(coach, override);

  return NextResponse.json(
    { slug, base: coach, override, effective, published: coachPublished(slug) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return authError("invalid-request", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) return authError("invalid-request", 400);
  const privileged = coachAccess(user) !== "own";
  if (!privileged && ["rating","reviewCount","isMvp","reset"].some(key => body[key] !== undefined)) return authError("coach-field-forbidden", 403);
  if (body.published !== undefined) {
    if (typeof body.published !== "boolean" || coachAccess(user) === "demo") return authError("invalid-request", 400);
    const effective = applyCoachOverride(coach, coachProfileOverride(slug));
    if (body.published && (!(effective.bioOverride?.trim() || effective.bioKey) || !effective.roles.length || !effective.languages.length || !effective.sessionFormats.length)) return authError("profile-incomplete", 400);
    setCoachPublished(slug, body.published);
    return NextResponse.json({ ok: true, published: coachPublished(slug) });
  }
  if (body.reset === true) {
    resetCoachProfile(slug);
    return NextResponse.json({ ok: true, reset: true, override: null, effective: coach });
  }

  const input: CoachProfileInput = {};

  if (body.online !== undefined) {
    if (body.online !== null && typeof body.online !== "boolean") return authError("invalid-request", 400);
    input.online = body.online as boolean | null;
  }

  if (body.hourlyRate !== undefined) {
    if (body.hourlyRate !== null) {
      const rate = Number(body.hourlyRate);
      if (Number.isNaN(rate) || rate < 1 || rate > 500) return authError("invalid-hourly-rate", 400);
      input.hourlyRate = Math.round(rate * 100) / 100;
    } else {
      input.hourlyRate = null;
    }
  }

  if (body.isMvp !== undefined) {
    if (body.isMvp !== null && typeof body.isMvp !== "boolean") return authError("invalid-request", 400);
    input.isMvp = body.isMvp as boolean | null;
  }

  if (body.bioOverride !== undefined) {
    if (body.bioOverride !== null) {
      if (typeof body.bioOverride !== "string" || body.bioOverride.length > 1000) return authError("invalid-bio", 400);
      const trimmed = body.bioOverride.trim();
      input.bioOverride = trimmed.length > 0 ? trimmed : null;
    } else {
      input.bioOverride = null;
    }
  }

  if (body.sessionLive !== undefined) {
    if (body.sessionLive !== null && typeof body.sessionLive !== "boolean") return authError("invalid-request", 400);
    input.sessionLive = body.sessionLive as boolean | null;
  }

  if (body.sessionVod !== undefined) {
    if (body.sessionVod !== null && typeof body.sessionVod !== "boolean") return authError("invalid-request", 400);
    input.sessionVod = body.sessionVod as boolean | null;
  }

  if (body.avatar !== undefined) {
    if (body.avatar !== null) {
      if (typeof body.avatar !== "string" || body.avatar.length > 2_800_000) return authError("invalid-avatar", 400);
      input.avatar = body.avatar.trim() || null;
    } else {
      input.avatar = null;
    }
  }

  if (body.rating !== undefined) {
    if (body.rating !== null) {
      const rating = Number(body.rating);
      if (Number.isNaN(rating) || rating < 1 || rating > 5) return authError("invalid-rating", 400);
      input.rating = Math.round(rating * 100) / 100;
    } else {
      input.rating = null;
    }
  }

  if (body.reviewCount !== undefined) {
    if (body.reviewCount !== null) {
      const count = Number(body.reviewCount);
      if (Number.isNaN(count) || count < 0 || count > 100_000) return authError("invalid-review-count", 400);
      input.reviewCount = Math.floor(count);
    } else {
      input.reviewCount = null;
    }
  }

  if (body.languages !== undefined) {
    if (body.languages !== null) {
      if (!Array.isArray(body.languages) || body.languages.length > 10 || body.languages.some(l => typeof l !== "string" || l.length > 50)) {
        return authError("invalid-languages", 400);
      }
      input.languages = [...new Set(body.languages.map(l => (l as string).trim()).filter(Boolean))];
    } else {
      input.languages = null;
    }
  }

  if (body.roles !== undefined) {
    if (body.roles !== null) {
      if (!Array.isArray(body.roles) || body.roles.length > 10 || body.roles.some(r => typeof r !== "string" || r.length > 50)) {
        return authError("invalid-roles", 400);
      }
      input.roles = [...new Set(body.roles.map(r => (r as string).trim()).filter(Boolean))];
    } else {
      input.roles = null;
    }
  }

  const current = applyCoachOverride(coach, coachProfileOverride(slug));
  const live = input.sessionLive === undefined ? current.sessionFormats.includes("live") : input.sessionLive ?? coach.sessionFormats.includes("live");
  const vod = input.sessionVod === undefined ? current.sessionFormats.includes("vod") : input.sessionVod ?? coach.sessionFormats.includes("vod");
  if (!live && !vod) return authError("session-format-required", 400);
  if (coachPublished(slug) && (input.languages?.length === 0 || input.roles?.length === 0)) return authError("profile-incomplete", 400);
  const override = saveCoachProfile(slug, input);
  if (typeof input.online === "boolean" && coachAccess(user) === "own") saveEmployeePresence(user.id, input.online);
  const effective = applyCoachOverride(coach, override);

  return NextResponse.json({ ok: true, override, effective });
}
