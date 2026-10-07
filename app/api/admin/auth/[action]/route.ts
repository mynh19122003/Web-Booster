import { NextRequest, NextResponse } from "next/server";
import { backendEndpoints } from "@/lib/api/endpoints";
import { toAdminUser, type BackendAdminUser } from "@/lib/api/admin-user";

const cookieName = "ascend_admin_session";
const noCache = { "Cache-Control": "no-store" };
function failure(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers: noCache });
}
type Context = { params: Promise<{ action: string }> };
async function handle(request: NextRequest, context: Context) {
  const { action } = await context.params;
  const definition = {
    login: { path: backendEndpoints.auth.login, method: "POST", public: true },
    me: { path: backendEndpoints.auth.me, method: "GET", public: false },
    logout: {
      path: backendEndpoints.auth.logout,
      method: "POST",
      public: false,
    },
    "change-password": {
      path: backendEndpoints.auth.changePassword,
      method: "POST",
      public: false,
    },
    "accept-invitation": {
      path: backendEndpoints.auth.acceptInvitation,
      method: "POST",
      public: true,
    },
  }[action];
  if (!definition) return failure("Không tìm thấy dữ liệu.", 404);
  if (request.method !== definition.method)
    return failure("Phương thức không hợp lệ.", 405);
  if (
    request.method !== "GET" &&
    request.headers.get("origin") !== request.nextUrl.origin
  )
    return failure("Yêu cầu không hợp lệ.", 403);
  const token = request.cookies.get(cookieName)?.value;
  if (!definition.public && !token)
    return failure("Phiên đăng nhập đã hết hạn.", 401);
  const base =
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return failure("Dữ liệu chưa khả dụng.", 503);
  let body: Record<string, unknown> | undefined;
  if (request.method !== "GET") {
    try {
      body = await request.json();
    } catch {
      return failure("Vui lòng kiểm tra lại thông tin.", 422);
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
      return failure("Vui lòng kiểm tra lại thông tin.", 422);
  }
  try {
    const upstream = await fetch(
      `${base.replace(/\/$/, "")}${definition.path}`,
      {
        method: definition.method,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(!definition.public && token
            ? { Authorization: `Bearer ${token}` }
            : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    const payload: {
      success?: boolean;
      message?: string;
      errors?: unknown;
      data?: unknown;
    } = await upstream.json();
    if (!upstream.ok || payload.success === false) {
      const result = NextResponse.json(
        {
          message: payload.message ?? "Đã xảy ra lỗi máy chủ.",
          errors: payload.errors,
        },
        { status: upstream.ok ? 502 : upstream.status, headers: noCache },
      );
      if (upstream.status === 401 && action !== "login")
        result.cookies.delete(cookieName);
      return result;
    }
    if (action === "login") {
      const data = payload.data as {
        user: BackendAdminUser;
        access_token: string;
        expires_in: number;
      };
      if (
        !data?.user ||
        typeof data.access_token !== "string" ||
        !Number.isFinite(data.expires_in) ||
        data.expires_in <= 0
      )
        return failure("Phản hồi đăng nhập không hợp lệ.", 502);
      // Initial-password onboarding requires a separate UI flow; never grant workspace access before it.
      if (data.user.must_change_password)
        return failure(
          "Tài khoản cần đổi mật khẩu ban đầu trước khi đăng nhập vào trang quản trị.",
          403,
        );
      let user;
      try {
        user = toAdminUser(data.user);
      } catch {
        return failure("Bạn không có quyền truy cập.", 403);
      }
      const result = NextResponse.json({ data: user }, { headers: noCache });
      result.cookies.set(cookieName, data.access_token, {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "strict",
        path: "/",
        maxAge: data.expires_in,
      });
      return result;
    }
    if (action === "me") {
      const raw = payload.data as BackendAdminUser;
      if (!raw || raw.must_change_password)
        return failure("Bạn không có quyền truy cập.", 403);
      try {
        return NextResponse.json(
          { data: toAdminUser(raw) },
          { headers: noCache },
        );
      } catch {
        return failure("Bạn không có quyền truy cập.", 403);
      }
    }
    const result = NextResponse.json(
      { message: payload.message, data: null },
      { headers: noCache },
    );
    if (action === "logout" || action === "change-password")
      result.cookies.delete(cookieName);
    return result;
  } catch {
    return failure("Không thể kết nối tới máy chủ.", 502);
  }
}
export const GET = handle;
export const POST = handle;
