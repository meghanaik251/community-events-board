import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container empty-state">
      <span className="eyebrow">A small detour</span>
      <h1>This page wandered off.</h1>
      <p>There are still plenty of good things to discover.</p>
      <Link className="button button-primary" href="/events">
        Back to events
      </Link>
    </div>
  );
}
