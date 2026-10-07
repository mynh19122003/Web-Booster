export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
const messages: Record<number, string> = {
  401: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
  403: "Bạn không có quyền thực hiện thao tác này.",
  409: "Dữ liệu đã thay đổi. Vui lòng tải lại trang.",
  404: "Không tìm thấy dữ liệu.",
  422: "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.",
  429: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.",
  500: "Máy chủ gặp lỗi. Vui lòng thử lại sau.",
  502: "Không thể kết nối máy chủ. Vui lòng thử lại.",
  503: "Dữ liệu chưa khả dụng.",
};
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("Use a relative API path.");
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch("/api/admin" + path, {
      ...options,
      headers,
      credentials: "same-origin",
      cache: "no-store",
      signal: options.signal ?? AbortSignal.timeout(20000),
    });
  } catch {
    throw new ApiError("Không thể kết nối máy chủ. Vui lòng thử lại.", 0);
  }
  let payload: { data: T; message?: string; success?: boolean };
  try {
    payload = await response.json();
  } catch {
    throw new ApiError("Máy chủ trả về dữ liệu không hợp lệ.", 502);
  }
  if (!response.ok || payload.success === false)
    throw new ApiError(
      messages[response.status] ??
        "Yêu cầu không thành công. Vui lòng thử lại.",
      response.status,
      payload,
    );
  return payload.data;
}
