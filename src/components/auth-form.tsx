"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/client-api";
import type { User } from "@/lib/types";
import { useAuth } from "./providers";

export function AuthForm({ signup = false, admin = false }: { signup?: boolean; admin?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { setUser } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ user: User }>(`/auth/${signup ? "signup" : "login"}`, {
        method: "POST",
        body: { email: email.trim(), password },
      });
      setUser(result.user);
      if (admin && result.user.role !== "admin") {
        setError("This account does not have admin access.");
        return;
      }
      const next = params.get("next");
      const safeNext =
        next && /^\/(events(?:\/[a-zA-Z0-9-]+)?|feed|preferences)$/.test(next) ? next : null;
      router.push(
        admin ? "/admin" : !result.user.preferencesSet ? "/preferences" : safeNext || "/feed",
      );
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container auth-page">
      <section className="auth-story">
        <span className="eyebrow">
          <Sparkles size={16} /> A little closer
        </span>
        <h1>
          There’s a whole
          <br />
          community
          <br />
          <span>around you.</span>
        </h1>
        <p>
          A new favourite band. A skill you didn’t know you had.
          <br />A familiar face in an unfamiliar place.
          <br />
          It starts with showing up.
        </p>
        <div className="auth-art" aria-hidden="true">
          <span>✳</span>
          <span>☺</span>
          <span>✿</span>
        </div>
        <span className="auth-story-footer">Small plans. Lasting connections.</span>
      </section>
      <section className="auth-form-panel">
        <div className="form-intro">
          <span className="form-icon">{admin ? <LockKeyhole /> : <Sparkles />}</span>
          <h2>
            {admin
              ? "A warm welcome, admin."
              : signup
                ? "Make yourself at home."
                : "Good to see you again."}
          </h2>
          <p>
            {admin
              ? "Sign in to bring your community together."
              : signup
                ? "Create an account and find your kind of plans."
                : "Your next good memory is waiting for you."}
          </p>
        </div>
        <form onSubmit={submit} className="stack-form">
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                aria-label="Password"
                type={visible ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder={signup ? "At least 10 characters" : "Your password"}
                required
                minLength={10}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {signup && (
            <p className="field-hint">
              Use at least 10 characters. A few unrelated words work well.
            </p>
          )}
          {error && (
            <p className="message error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-primary button-full" disabled={busy}>
            {busy
              ? "One moment…"
              : admin
                ? "Sign in as admin"
                : signup
                  ? "Create account"
                  : "Sign in"}
            <ArrowRight size={18} />
          </button>
        </form>
        {!admin && (
          <p className="auth-switch">
            {signup ? "Already part of the community?" : "New around here?"}{" "}
            <Link href={signup ? "/login" : "/signup"}>
              {signup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        )}
        <p className="auth-back">
          <Link href="/events">Just looking? Explore events first ↗</Link>
        </p>
      </section>
    </div>
  );
}
