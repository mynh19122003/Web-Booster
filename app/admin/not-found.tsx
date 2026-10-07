import Link from "next/link";

export default function AdminNotFound() {
  return (
    <section className="ap-panel ap-panel-padding">
      <p className="ap-eyebrow">404 · KHÔNG TÌM THẤY TRANG</p>
      <h1>Trang này không còn trong không gian quản trị.</h1>
      <p>Quay lại tổng quan để tiếp tục quản lý đơn hàng và nhân sự.</p>
      <Link href="/admin" className="ap-button primary">Về tổng quan</Link>
    </section>
  );
}
