import { parseRiotId } from "@/lib/riot-id";
import {
  requiresRiotCredentials,
  type OrderRequestInput,
} from "@/lib/order-request-types";

export function parseOrderRequest(value: unknown): OrderRequestInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const limits = {
    submissionId: 36,
    service: 40,
    currentRank: 150,
    targetRank: 150,
    region: 80,
    queue: 80,
    role: 80,
    championPool: 500,
    customerNotes: 2000,
  } as const;
  const fields: Record<string, string> = {};
  for (const [field, limit] of Object.entries(limits)) {
    if (
      typeof body[field] !== "string" ||
      body[field].length > limit ||
      /[\u0000\u007f]/.test(body[field])
    )
      return null;
    fields[field] = body[field].trim();
  }
  if (
    !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
      fields.submissionId,
    ) ||
    !["rank-boost", "duo-boost", "placements", "coaching"].includes(
      fields.service,
    ) ||
    !fields.currentRank ||
    !fields.targetRank ||
    !fields.region ||
    !fields.queue ||
    !["D", "F", "no-preference"].includes(String(body.flashSlot))
  )
    return null;

  let riotAccount: OrderRequestInput["riotAccount"] = null;
  if (requiresRiotCredentials(fields.service, fields.queue)) {
    if (
      !body.riotAccount ||
      typeof body.riotAccount !== "object" ||
      Array.isArray(body.riotAccount)
    )
      return null;
    const account = body.riotAccount as Record<string, unknown>;
    const riotId = parseRiotId(account.riotIdTag);
    if (
      !riotId ||
      typeof account.riotUsername !== "string" ||
      !account.riotUsername.trim() ||
      account.riotUsername.length > 120 ||
      /[\u0000-\u001f\u007f]/.test(account.riotUsername) ||
      typeof account.riotPass !== "string" ||
      !account.riotPass.trim() ||
      account.riotPass.length > 128 ||
      /[\u0000\u007f]/.test(account.riotPass)
    )
      return null;
    riotAccount = {
      riotUsername: account.riotUsername.trim(),
      riotPass: account.riotPass,
      riotIdTag: `${riotId.gameName}#${riotId.tagLine}`,
    };
  } else if (body.riotAccount !== null) return null;

  let coaching: OrderRequestInput["coaching"];
  if (fields.service === "coaching") {
    if (!body.coaching || typeof body.coaching !== "object" || Array.isArray(body.coaching)) return null;
    const session = body.coaching as Record<string, unknown>;
    if (typeof session.coachId !== "string" || !/^[a-z0-9-]{1,80}$/.test(session.coachId) ||
      typeof session.coachName !== "string" || session.coachName.trim().length < 1 || session.coachName.length > 100 ||
      typeof session.quantity !== "number" || !Number.isInteger(session.quantity) || session.quantity < 1 || session.quantity > 10 ||
      !["live", "vod"].includes(String(session.sessionFormat))) return null;
    for (const field of ["date", "time", "timeZone"] as const) {
      if (session[field] !== undefined && (typeof session[field] !== "string" || session[field].length > 80)) return null;
    }
    coaching = {
      coachId: session.coachId,
      coachName: session.coachName.trim(),
      quantity: session.quantity,
      sessionFormat: session.sessionFormat as "live" | "vod",
      ...(typeof session.date === "string" ? { date: session.date } : {}),
      ...(typeof session.time === "string" ? { time: session.time } : {}),
      ...(typeof session.timeZone === "string" ? { timeZone: session.timeZone } : {}),
    };
  }

  return {
    submissionId: fields.submissionId,
    service: fields.service,
    currentRank: fields.currentRank,
    targetRank: fields.targetRank,
    region: fields.region,
    queue: fields.queue,
    role: fields.role,
    championPool: fields.championPool,
    customerNotes: fields.customerNotes,
    flashSlot: body.flashSlot as OrderRequestInput["flashSlot"],
    riotAccount,
    ...(coaching ? { coaching } : {}),
  };
}
