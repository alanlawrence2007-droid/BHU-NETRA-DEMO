import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import type { ComplaintPriority, ComplaintStatus } from "../api/types";
import { PRIORITY_LABEL, STATUS_LABEL } from "../lib/format";

export const StatusBadge = ({ status }: { status: ComplaintStatus }) => (
  <span className={`badge b-${status}`}>
    <i />
    {STATUS_LABEL[status]}
  </span>
);

export const PriorityBadge = ({ priority }: { priority: ComplaintPriority }) => (
  <span className={`badge p-${priority}`}>{PRIORITY_LABEL[priority]}</span>
);

export const Spinner = () => <span className="spinner" role="status" aria-label="Loading" />;
export const Loading = () => (
  <div className="center">
    <Spinner />
  </div>
);

export function Notice({ kind = "info", children }: { kind?: "err" | "ok" | "warn" | "info"; children: ReactNode }) {
  const Icon = kind === "ok" ? CheckCircle2 : AlertCircle;
  return (
    <div className={`notice ${kind}`} role={kind === "err" ? "alert" : undefined}>
      <Icon size={18} style={{ flex: "none", marginTop: 1 }} />
      <div>{children}</div>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="ico">{icon}</div>
      <h3 style={{ marginBottom: 4 }}>{title}</h3>
      {children && <div style={{ marginTop: 6 }}>{children}</div>}
    </div>
  );
}

export function PageHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function Pager({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="pager">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="row">
        <button className="btn ghost sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        <span>
          {page} / {pages}
        </span>
        <button className="btn ghost sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function Stars({ value, onChange, size = 22 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <span className="stars" role={onChange ? "radiogroup" : "img"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            className={n <= value ? "on" : ""}
            onClick={() => onChange(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star size={size} fill={n <= value ? "currentColor" : "none"} />
          </button>
        ) : (
          <span key={n} className={n <= value ? "on" : ""} style={{ color: n <= value ? undefined : "#cdcabb" }}>
            <Star size={size} fill={n <= value ? "currentColor" : "none"} />
          </span>
        ),
      )}
    </span>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="card-title">
          <h2>{title}</h2>
          <button className="btn ghost sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- toasts ---------- */
type Toast = { id: number; msg: string; kind: "ok" | "err" };
const ToastCtx = createContext<(msg: string, kind?: "ok" | "err") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const id = useRef(0);
  const push = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    const n = ++id.current;
    setItems((x) => [...x, { id: n, msg, kind }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== n)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind === "err" ? "err" : ""}`}>
            {t.kind === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- data hook ---------- */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => live && setData(d))
      .catch((e: Error) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, error, loading, reload: () => setTick((t) => t + 1), setData };
}
