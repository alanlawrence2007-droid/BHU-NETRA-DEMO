import { BarChart3, CheckCircle2, Clock, Flame, Inbox, MapPin, TrendingDown, TrendingUp } from "lucide-react";
import { api } from "../api/client";
import type { ComplaintStatus } from "../api/types";
import { Empty, Loading, Notice, PageHead, useAsync } from "../components/ui";
import { fmtHours, mapsLink, STATUS_LABEL } from "../lib/format";

/** Backend serialises the enum with str(), which can yield "ComplaintStatus.PENDING". */
export const normStatus = (s: string) => s.split(".").pop()!.toLowerCase();

const STATUS_COLOR: Record<string, string> = {
  pending: "#d99a00",
  acknowledged: "#2f6fe4",
  in_progress: "#7050d6",
  resolved: "#1f9d55",
  closed: "#8a948d",
  rejected: "#c8382b",
};

export default function Analytics() {
  const ov = useAsync(() => api.overview(), []);
  const hs = useAsync(() => api.hotspots(10), []);

  if (ov.loading) return <Loading />;
  if (ov.error) return <Notice kind="err">{ov.error}</Notice>;
  const d = ov.data!;

  const status = d.status_breakdown.map((s) => ({ key: normStatus(s.status), count: s.count }));
  const maxCat = Math.max(1, ...d.category_breakdown.map((c) => c.count));
  const delta = d.complaints_last_month
    ? Math.round(((d.complaints_this_month - d.complaints_last_month) / d.complaints_last_month) * 100)
    : null;
  const resolved = status.find((s) => s.key === "resolved")?.count ?? 0;
  const total = Math.max(1, d.total_complaints);

  return (
    <>
      <PageHead title="Analytics" subtitle="Complaint volume, response times and where problems cluster." />

      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="card stat hero">
          <div className="label"><Inbox size={16} /> Total complaints</div>
          <div className="num">{d.total_complaints}</div>
        </div>
        <div className="card stat">
          <div className="label"><CheckCircle2 size={16} /> Resolution rate</div>
          <div className="num">{Math.round((resolved / total) * 100)}%</div>
          <div className="sub">{resolved} resolved</div>
        </div>
        <div className="card stat">
          <div className="label"><Clock size={16} /> Avg. time to resolve</div>
          <div className="num">{fmtHours(d.avg_resolution_hours)}</div>
        </div>
        <div className="card stat">
          <div className="label">
            {delta !== null && delta < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />} This month
          </div>
          <div className="num">{d.complaints_this_month}</div>
          <div className="sub">
            {delta === null ? (
              `${d.complaints_last_month} last month`
            ) : (
              <span className={delta > 0 ? "delta-up" : "delta-down"}>
                {delta > 0 ? "+" : ""}
                {delta}% vs last month ({d.complaints_last_month})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title"><h2>By status</h2></div>
          {status.length === 0 ? (
            <p className="muted">No data yet.</p>
          ) : (
            <>
              <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", marginBottom: 14 }} aria-hidden>
                {status.map((s) => (
                  <span key={s.key} style={{ width: `${(s.count / total) * 100}%`, background: STATUS_COLOR[s.key] ?? "#999" }} />
                ))}
              </div>
              {status.map((s) => (
                <div className="bar-row" key={s.key} style={{ gridTemplateColumns: "130px 1fr 40px" }}>
                  <span className="row" style={{ gap: 8 }}>
                    <i style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS_COLOR[s.key] ?? "#999" }} />
                    {STATUS_LABEL[s.key as ComplaintStatus] ?? s.key}
                  </span>
                  <div className="bar">
                    <span style={{ width: `${(s.count / total) * 100}%`, background: STATUS_COLOR[s.key] ?? "#999" }} />
                  </div>
                  <b style={{ textAlign: "right" }}>{s.count}</b>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="card">
          <div className="card-title"><h2>By waste category</h2></div>
          {d.category_breakdown.length === 0 ? (
            <p className="muted">No data yet.</p>
          ) : (
            [...d.category_breakdown]
              .sort((a, b) => b.count - a.count)
              .map((c) => (
                <div className="bar-row" key={c.category_name}>
                  <span className="clip">{c.category_name}</span>
                  <div className="bar"><span style={{ width: `${(c.count / maxCat) * 100}%` }} /></div>
                  <b style={{ textAlign: "right" }}>{c.count}</b>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <h2 className="row"><Flame size={20} color="#c8382b" /> Complaint hotspots</h2>
        </div>
        {hs.loading ? (
          <Loading />
        ) : hs.error ? (
          <Notice kind="err">{hs.error}</Notice>
        ) : !hs.data?.hotspots.length ? (
          <Empty icon={<BarChart3 size={24} />} title="No hotspots yet">
            Hotspots appear once complaints with locations come in.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="t">
              <thead>
                <tr><th>#</th><th>Locality</th><th>Top category</th><th>Complaints</th><th /></tr>
              </thead>
              <tbody>
                {hs.data.hotspots.map((h, i) => (
                  <tr key={`${h.latitude}-${h.longitude}-${i}`}>
                    <td className="faint">{i + 1}</td>
                    <td><b>{h.locality || "Unknown"}</b></td>
                    <td><span className="tag">{h.top_category}</span></td>
                    <td><b>{h.complaint_count}</b></td>
                    <td>
                      <a className="row sm" href={mapsLink(h.latitude, h.longitude)} target="_blank" rel="noreferrer">
                        <MapPin size={14} /> Map
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
