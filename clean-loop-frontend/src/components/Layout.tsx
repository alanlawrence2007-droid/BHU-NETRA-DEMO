import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  CloudOff,
  FilePlus2,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
  Menu,
  Recycle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABEL } from "../lib/format";
import { flushQueue, readQueue } from "../lib/offlineQueue";
import { useToast } from "./ui";

const Logo = ({ size = 20 }: { size?: number }) => <Recycle size={size} strokeWidth={2.2} />;

export default function Layout() {
  const { user, isStaff, logout } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [queued, setQueued] = useState(readQueue().length);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const loc = useLocation();

  useEffect(() => setOpen(false), [loc.pathname]);

  async function sync(silent = false) {
    if (!readQueue().length) return;
    setSyncing(true);
    try {
      const r = await flushQueue();
      if (r.sent) toast(`Synced ${r.sent} offline complaint${r.sent > 1 ? "s" : ""}`);
      if (r.failed && !silent) toast(`${r.failed} could not be synced yet`, "err");
    } catch (e) {
      if (!silent) toast((e as Error).message, "err");
    } finally {
      setSyncing(false);
      setQueued(readQueue().length);
    }
  }

  useEffect(() => {
    const q = () => setQueued(readQueue().length);
    const on = () => {
      setOnline(true);
      sync(true);
    };
    const off = () => setOnline(false);
    window.addEventListener("cleanloop:queue", q);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    if (navigator.onLine) sync(true);
    return () => {
      window.removeEventListener("cleanloop:queue", q);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = (user?.full_name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="shell">
      <div className="topbar-m">
        <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
        Clean Loop
      </div>

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Logo />
          </span>
          Clean Loop
        </div>

        <nav className="nav" onClick={() => setOpen(false)}>
          <NavLink to="/" end>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <div className="nav-label">Citizen</div>
          <NavLink to="/waste-guide">
            <Sparkles size={18} /> Waste guide
          </NavLink>
          <NavLink to="/facilities">
            <MapPin size={18} /> Facilities
          </NavLink>
          <NavLink to="/complaints/new">
            <FilePlus2 size={18} /> Report an issue
          </NavLink>
          <NavLink to="/complaints/mine">
            <ListChecks size={18} /> My complaints
          </NavLink>
          {isStaff && (
            <>
              <div className="nav-label">Municipal</div>
              <NavLink to="/manage/complaints">
                <Inbox size={18} /> All complaints
              </NavLink>
              <NavLink to="/manage/analytics">
                <BarChart3 size={18} /> Analytics
              </NavLink>
            </>
          )}
        </nav>

        {(queued > 0 || !online) && (
          <div
            className="notice warn"
            style={{ margin: "10px 4px 0", fontSize: 13, flexDirection: "column", gap: 8, alignItems: "stretch" }}
          >
            <div className="row" style={{ gap: 8 }}>
              <CloudOff size={16} />
              <b>{online ? "Waiting to sync" : "You're offline"}</b>
            </div>
            <span>
              {queued} complaint{queued === 1 ? "" : "s"} saved on this device.
            </span>
            {online && queued > 0 && (
              <button className="btn lime sm" onClick={() => sync()} disabled={syncing}>
                <RefreshCw size={14} /> {syncing ? "Syncing…" : "Sync now"}
              </button>
            )}
          </div>
        )}

        <div className="sidebar-foot">
          <div className="avatar">{initials}</div>
          <div className="who">
            <b>{user?.full_name}</b>
            <span>{user ? ROLE_LABEL[user.role] : ""}</span>
          </div>
          <button className="icon-btn" onClick={logout} aria-label="Sign out" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
