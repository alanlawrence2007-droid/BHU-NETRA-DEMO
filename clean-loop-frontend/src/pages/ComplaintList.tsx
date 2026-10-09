import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CloudOff, FilePlus2, Inbox, Search } from "lucide-react";
import { api } from "../api/client";
import type { ComplaintPriority, ComplaintStatus } from "../api/types";
import { Empty, Loading, Notice, PageHead, Pager, PriorityBadge, StatusBadge, useAsync } from "../components/ui";
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, timeAgo } from "../lib/format";
import { readQueue } from "../lib/offlineQueue";

const PAGE_SIZE = 15;

export default function ComplaintList({ mode }: { mode: "mine" | "all" }) {
  const nav = useNavigate();
  const [status, setStatus] = useState<ComplaintStatus | "">("");
  const [priority, setPriority] = useState<ComplaintPriority | "">("");
  const [city, setCity] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [page, setPage] = useState(1);
  const queued = mode === "mine" ? readQueue() : [];

  const data = useAsync(
    () =>
      mode === "mine"
        ? api.myComplaints({ status: status || undefined, page, page_size: PAGE_SIZE })
        : api.allComplaints({
            status: status || undefined,
            priority: priority || undefined,
            city: city || undefined,
            page,
            page_size: PAGE_SIZE,
          }),
    [mode, status, priority, city, page],
  );

  const pick = (s: ComplaintStatus | "") => {
    setStatus(s);
    setPage(1);
  };

  return (
    <>
      <PageHead
        title={mode === "mine" ? "My complaints" : "All complaints"}
        subtitle={mode === "mine" ? "Everything you've reported and where it stands." : "Review, prioritise and update citizen reports."}
        actions={
          mode === "mine" && (
            <Link to="/complaints/new" className="btn">
              <FilePlus2 size={16} /> New report
            </Link>
          )
        }
      />

      {queued.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Notice kind="warn">
            <span className="row">
              <CloudOff size={16} /> {queued.length} complaint{queued.length > 1 ? "s are" : " is"} saved on this device and will sync when you're online:
              {" "}
              <b>{queued.map((q) => q.title).join(", ")}</b>
            </span>
          </Notice>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="chips">
          <button className={`chip ${status === "" ? "on" : ""}`} onClick={() => pick("")}>All</button>
          {STATUSES.map((s) => (
            <button key={s} className={`chip ${status === s ? "on" : ""}`} onClick={() => pick(s)}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {mode === "all" && (
          <form
            className="row"
            style={{ marginTop: 14 }}
            onSubmit={(e) => {
              e.preventDefault();
              setCity(cityInput.trim());
              setPage(1);
            }}
          >
            <select
              className="input"
              style={{ width: 170 }}
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as ComplaintPriority | "");
                setPage(1);
              }}
              aria-label="Priority filter"
            >
              <option value="">Any priority</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
            <input className="input" style={{ width: 220 }} placeholder="Filter by city" value={cityInput} onChange={(e) => setCityInput(e.target.value)} />
            <button className="btn ghost"><Search size={16} /> Apply</button>
          </form>
        )}
      </div>

      <div className="card">
        {data.loading ? (
          <Loading />
        ) : data.error ? (
          <Notice kind="err">{data.error}</Notice>
        ) : !data.data?.complaints.length ? (
          <Empty icon={<Inbox size={24} />} title="Nothing here">
            {mode === "mine" ? <Link to="/complaints/new">Report your first issue</Link> : "No complaints match these filters."}
          </Empty>
        ) : (
          <>
            <div className="table-wrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Complaint</th>
                    {mode === "all" && <th>Reporter</th>}
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Filed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.complaints.map((c) => (
                    <tr key={c.id} className="click" onClick={() => nav(`/complaints/${c.id}`)}>
                      <td style={{ maxWidth: 320 }}>
                        <Link to={`/complaints/${c.id}`} onClick={(e) => e.stopPropagation()} style={{ fontWeight: 600, color: "var(--ink)" }}>
                          {c.title}
                        </Link>
                        {c.waste_category && <div className="faint">{c.waste_category.name}</div>}
                      </td>
                      {mode === "all" && <td>{c.reporter.full_name}</td>}
                      <td className="muted">{[c.locality, c.city].filter(Boolean).join(", ") || "—"}</td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>{timeAgo(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} pageSize={PAGE_SIZE} total={data.data.total} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}
