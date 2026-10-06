"use client";

import { adminError } from "@/lib/admin/vi";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import { adminAuthService } from "@/services/admin";
import { Field } from "./Ui";
function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="ap-auth">
      <aside className="ap-auth-story">
        <Link href="/" className="ap-brand">
          <span className="ap-mark">A</span>
          <span>
            ASCEND<small>TIÊU CHUẨN CAO HƠN</small>
          </span>
        </Link>
        <div className="ap-auth-art" aria-hidden="true">
          <div className="ap-orbit one" />
          <div className="ap-orbit two" />
          <div className="ap-orbit three" />
          <span className="ap-art-a">A</span>
          <span className="ap-art-label">CHÍNH XÁC. CON NGƯỜI. TIẾN BỘ.</span>
        </div>
        <div className="ap-auth-copy">
          <span className="ap-eyebrow">ĐỘI NGŨ TẠO NÊN THÀNH CÔNG</span>
          <h1>
            Đội ngũ vững mạnh. <br />
            Tiềm năng rộng mở.{" "}
          </h1>
          <p>
            Trung tâm quản lý nhân tài, xây dựng niềm tin và nâng tầm dịch vụ
            trò chơi.{" "}
          </p>
        </div>
        <footer>
          <span>© 2026 ASCEND</span>
          <span>
            <ShieldCheck size={14} /> Không gian làm việc xây dựng trên niềm
            tin{" "}
          </span>
        </footer>
      </aside>
      <section className="ap-auth-form">
        <div className="ap-auth-top">
          <span>KHÔNG GIAN ĐỘI NGŨ</span>
          <Link href="/">
            Quay lại trang web <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="ap-auth-form-inner">{children}</div>
        <p className="ap-auth-bottom">
          <LockKeyhole size={13} /> Trang quản trị chỉ dành cho thành viên được
          mời.{" "}
        </p>
      </section>
    </div>
  );
}
export function LoginPage({ changed = false }: { changed?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"owner" | "staff" | "viewer">("owner");
  const [email, setEmail] = useState("alex@ascend.demo");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [help, setHelp] = useState(false);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    try {
      await adminAuthService.login(email, String(data.get("password")), mode);
      router.push("/admin");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Không thể đăng nhập. Vui lòng thử lại.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <AuthFrame>
      <span className="ap-auth-icon">
        <ShieldCheck size={24} />
      </span>
      <div className="ap-eyebrow">CHÀO MỪNG TRỞ LẠI</div>
      <h2>Đăng nhập vào trang quản trị.</h2>
      <p className="ap-auth-description">
        Đăng nhập để quản lý đội ngũ và theo dõi hoạt động.{" "}
      </p>
      {changed && (
        <p className="ap-success">
          Đã cập nhật mật khẩu dùng thử và thu hồi các phiên trước. Vui lòng
          đăng nhập lại.{" "}
        </p>
      )}
      <div className="ap-demo-switch">
        <span>DÙNG THỬ VỚI VAI TRÒ</span>
        <div>
          {(["owner", "staff", "viewer"] as const).map((m) => (
            <button
              type="button"
              key={m}
              className={mode === m ? "active" : ""}
              onClick={() => {
                setMode(m);
                setEmail(
                  m === "owner"
                    ? "alex@ascend.demo"
                    : m === "staff"
                      ? "olivia@ascend.demo"
                      : "sofia@ascend.demo",
                );
              }}
            >
              {m === "owner"
                ? "Quản trị viên cấp cao"
                : m === "staff"
                  ? "Nhân sự quản trị"
                  : "Nhân sự chỉ xem"}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={login}>
        <Field label="Địa chỉ email">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </Field>
        <Field label="Mật khẩu">
          <span className="ap-password-input">
            <input
              type={show ? "text" : "password"}
              name="password"
              minLength={8}
              required
              placeholder="Mật khẩu dùng thử, ít nhất 8 ký tự"
              autoComplete="current-password"
            />
            <button
              type="button"
              aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </Field>
        <div className="ap-login-help">
          <span>Phiên dùng thử · chỉ trong thẻ này</span>
          <button type="button" onClick={() => setHelp(!help)}>
            Quên mật khẩu?{" "}
          </button>
        </div>
        {help && (
          <p className="ap-info-strip">
            Chưa kết nối chức năng khôi phục mật khẩu. Hãy liên hệ quản trị
            viên. Bản dùng thử chấp nhận mật khẩu từ 8 ký tự.{" "}
          </p>
        )}
        {error && (
          <p className="ap-error" role="alert">
            {adminError(error)}
          </p>
        )}
        <button className="ap-button primary full" disabled={pending}>
          {pending ? "Đang đăng nhập…" : "Đăng nhập"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="ap-demo-disclaimer">
        Bạn đang dùng bản thử cục bộ. Hãy sử dụng thông tin giả lập. <br />
        Không gửi yêu cầu tới máy chủ hay email thật.{" "}
      </p>
      <div className="ap-auth-invitation">
        Bạn muốn gia nhập đội ngũ?{" "}
        <Link href="/admin/accept-invitation?token=demo-invitation">
          Xem trước lời mời <ArrowUpRight size={14} />
        </Link>
      </div>
    </AuthFrame>
  );
}
export function AcceptInvitationPage({ token }: { token: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  async function accept(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    try {
      await adminAuthService.acceptInvitation(
        String(data.get("token")),
        String(data.get("password")),
        String(data.get("confirmation")),
        {
          phone: String(data.get("phone")),
          country: String(data.get("country")),
          timezone: String(data.get("timezone")),
        },
      );
      setSuccess(true);
    } catch (e) {
      setError(adminError(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <AuthFrame>
      {success ? (
        <div className="ap-accept-success">
          <CheckCircle2 size={52} />
          <h2>Bạn đã gia nhập đội ngũ.</h2>
          <p>
            Tài khoản đã sẵn sàng. Đăng nhập với vai trò nhân sự quản trị dùng
            thử để khám phá.{" "}
          </p>
          <Link className="ap-button primary full" href="/admin/login">
            Tiếp tục đăng nhập <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <>
          <span className="ap-auth-icon">
            <MailIcon />
          </span>
          <div className="ap-eyebrow">KHỞI ĐẦU MỚI</div>
          <h2>Bạn đã nhận được lời mời.</h2>
          <p className="ap-auth-description">
            Gia nhập đội ngũ ASCEND. Thiết lập mật khẩu để bắt đầu.{" "}
          </p>
          <form onSubmit={accept}>
            <Field label="Mã lời mời">
              <input
                name="token"
                defaultValue={token}
                required
                placeholder="Dán mã trong lời mời của bạn"
              />
            </Field>
            <div className="ap-form-grid">
              <Field label="Mật khẩu">
                <input
                  name="password"
                  type="password"
                  minLength={12}
                  maxLength={128}
                  required
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Xác nhận mật khẩu">
                <input
                  name="confirmation"
                  type="password"
                  required
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <p className="ap-form-hint">
              Ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc
              biệt.{" "}
            </p>
            <div className="ap-form-grid">
              <Field label="Số điện thoại (không bắt buộc)">
                <input
                  name="phone"
                  type="tel"
                  maxLength={30}
                  placeholder="+84"
                />
              </Field>
              <Field label="Quốc gia">
                <select name="country">
                  <option value="VN">Việt Nam</option>
                  <option value="US">Hoa Kỳ</option>
                  <option value="GB">Vương quốc Anh</option>
                </select>
              </Field>
            </div>
            <Field label="Múi giờ">
              <select name="timezone">
                <option>Asia/Ho_Chi_Minh</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
              </select>
            </Field>
            {error && (
              <p className="ap-error" role="alert">
                {adminError(error)}
              </p>
            )}
            <button className="ap-button primary full" disabled={pending}>
              {pending ? "Đang thiết lập tài khoản…" : "Chấp nhận lời mời"}
              <ArrowRight size={16} />
            </button>
          </form>
          <p className="ap-demo-disclaimer">
            Quy trình gia nhập dùng thử. Không lưu mật khẩu thật. <br />
            Lời mời hết hạn sau 24 giờ và chỉ dùng được một lần.{" "}
          </p>
          <Link className="ap-text-link" href="/admin/login">
            Đã có tài khoản? Đăng nhập →{" "}
          </Link>
        </>
      )}
    </AuthFrame>
  );
}
function MailIcon() {
  return <ArrowUpRight size={24} />;
}
