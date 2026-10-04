import Link from "next/link";
export default function NotFound() {
  return (
    <section className="container page-intro">
      <p className="eyebrow">404 / OFF THE MAP</p>
      <h1>Let’s get you back.</h1>
      <p>This page isn’t in the lineup.</p>
      <Link className="button" href="/">
        Return to home
      </Link>
    </section>
  );
}
