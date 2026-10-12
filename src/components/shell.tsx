"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Compass, LogOut, Settings2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./providers";
import { api } from "@/lib/client-api";

export function Header() {
  const { user, loading, setUser } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setBusy(true);
    try {
      await api("/auth/logout", { method: "POST", body: {} });
      setUser(null);
      router.push("/events");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/events" className="brand" aria-label="Around home">
            <span className="brand-mark">
              <Sparkles size={21} strokeWidth={1.8} />
            </span>
            EventSphere<span className="brand-dot">.</span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <Link href="/events" aria-current={path.startsWith("/events") ? "page" : undefined}>
              Discover
            </Link>
            <Link href="/feed" aria-current={path === "/feed" ? "page" : undefined}>
              My feed
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" aria-current={path === "/admin" ? "page" : undefined}>
                Admin
              </Link>
            )}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <Link className="icon-button" href="/preferences" aria-label="My interests">
                  <Settings2 size={19} />
                </Link>
                <button
                  className="icon-button"
                  aria-label="Sign out"
                  disabled={busy}
                  onClick={signOut}
                >
                  <LogOut size={18} />
                </button>
                <span className="avatar" aria-label={`Signed in as ${user.email}`}>
                  {user.email[0].toUpperCase()}
                </span>
              </>
            ) : (
              <Link
                className="button button-small button-outline"
                href="/login"
                aria-disabled={loading}
              >
                Sign in <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </header>
      {error && (
        <div className="container">
          <p className="message error" role="alert">
            {error}
          </p>
        </div>
      )}
    </>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span>
          <Compass size={17} /> A little closer to your community.
        </span>
        <span>
          Made for showing up. <span className="footer-flower">✳</span>
          <Link href="/admin">Admin</Link>
        </span>
      </div>
    </footer>
  );
}
