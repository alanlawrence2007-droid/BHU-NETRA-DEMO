import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Recycle, MapPin, Sparkles, BellRing, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Notice, Spinner } from "../components/ui";

// Seed-data accounts from the backend README (scripts/seed_data.py)
const DEMO = [
  { label: "Citizen", email: "citizen1@example.com", password: "citizen12345" },
  { label: "Staff", email: "staff1@cleanloop.gov", password: "staff12345" },
  { label: "Admin", email: "admin@cleanloop.gov", password: "admin12345" },
];

export default function Login() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "login") await login(f.email.trim(), f.password);
      else
        await register({
          email: f.email.trim(),
          password: f.password,
          full_name: f.full_name.trim(),
          phone: f.phone.trim() || undefined,
        });
      nav((loc.state as { from?: string } | null)?.from || "/", { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-art">
        <div className="brand" style={{ padding: 0 }}>
          <span className="brand-mark">
            <Recycle size={20} strokeWidth={2.2} />
          </span>
          Clean Loop
        </div>
        <div>
          <h1>A cleaner city, one report at a time.</h1>
          <p>Know where each kind of waste goes, find the nearest facility, and track every complaint until it's resolved.</p>
          <div className="points" style={{ marginTop: 28 }}>
            <div>
              <span><Sparkles size={18} /></span> Instant waste classification &amp; disposal rules
            </div>
            <div>
              <span><MapPin size={18} /></span> Verified recycling and drop-off points near you
            </div>
            <div>
              <span><BellRing size={18} /></span> Transparent complaint tracking, even offline
            </div>
          </div>
        </div>
        <Recycle className="loop" size={380} strokeWidth={1} />
      </section>

      <section className="auth-form">
        <div className="box">
          <h1 style={{ fontSize: 28 }}>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="muted" style={{ margin: "6px 0 22px" }}>
            {mode === "login" ? "Sign in to report issues and track progress." : "Join as a citizen to start reporting."}
          </p>

          <form className="stack" onSubmit={submit}>
            {err && <Notice kind="err">{err}</Notice>}
            {mode === "register" && (
              <>
                <label className="field">
                  Full name
                  <input className="input" required value={f.full_name} onChange={set("full_name")} autoComplete="name" />
                </label>
                <label className="field">
                  Phone <span className="hint">optional</span>
                  <input className="input" value={f.phone} onChange={set("phone")} autoComplete="tel" maxLength={20} />
                </label>
              </>
            )}
            <label className="field">
              Email
              <input className="input" type="email" required value={f.email} onChange={set("email")} autoComplete="email" />
            </label>
            <label className="field">
              Password {mode === "register" && <span className="hint">at least 8 characters</span>}
              <input
                className="input"
                type="password"
                required
                minLength={mode === "register" ? 8 : undefined}
                maxLength={128}
                value={f.password}
                onChange={set("password")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>
            <button className="btn block" disabled={busy}>
              {busy ? <Spinner /> : mode === "login" ? <LogIn size={17} /> : <UserPlus size={17} />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="sm muted" style={{ marginTop: 18 }}>
            {mode === "login" ? "New here? " : "Already registered? "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setErr(null);
                setMode(mode === "login" ? "register" : "login");
              }}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </a>
          </p>

          {mode === "login" && (
            <div style={{ marginTop: 26, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
              <div className="faint">Demo accounts (after running the seed script)</div>
              <div className="demo">
                {DEMO.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    className="chip"
                    onClick={() => setF({ ...f, email: d.email, password: d.password })}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
