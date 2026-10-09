import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, CheckCircle2, Clock, FilePlus2, Inbox, MapPin, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Empty, Loading, Notice, PriorityBadge, StatusBadge, useAsync } from "../components/ui";
import { fmtHours, timeAgo } from "../lib/format";
import { normStatus } from "./Analytics";

export default function Dashboard() {
  const { user, isStaff } = useAuth();
  const mine = useAsync(() => api.myComplaints({ page_size: 100 }), []);
  const overview = useAsync(() => (isStaff ? api.overview() : Promise.resolve(null)), [isStaff]);

  const list = mine.data?.complaints ?? [];
  const count = (s: string) => list.filter((c) => c.status === s).length;
  const open = list.filter((c) => !["resolved", "closed", "rejected"].includes(c.status)).length;
  const first = user?.full_name.split(" ")[0];

  return (
    <>
      <div className="hero-banner" style={{ marginBottom: 24 }}>
        <div>
          <h2>Hello, {first}</h2>
          <p>
            {isStaff
              ? "Here's how the city's waste complaints are moving today."
              : "Spotted overflowing bins or illegal dumping? Report it and we'll keep you posted."}
          </p>
        </div>
        <div className="row">
          <Link to="/complaints/new" className="btn lime">
            <FilePlus2 size={17} /> Report an issue
          </Link>
          <Link to="/waste-guide" className="btn ghost">
            <Sparkles size={17} /> What goes where?
          </Link>
        </div>
      </div>

      {isStaff && (
        <section style={{ marginBottom: 28 }}>
          <div className="card-title">
            <h2>City overview</h2>
            <Link to="/manage/analytics" className="row sm">
              Full analytics <ArrowRight size={14} />
            </Link>
          </div>
          {overview.loading ? (
            <Loading />
          ) : overview.error ? (
            <Notice kind="err">{overview.error}</Notice>
          ) : overview.data ? (
            <div className="grid g4">
              <div className="card stat hero">
                <div className="label"><Inbox size={16} /> Total complaints</div>
                <div className="num">{overview.data.total_complaints}</div>
              </div>
              <div className="card stat">
                <div className="label"><Clock size={16} /> Awaiting action</div>
                <div className="num">
                  {overview.data.status_breakdown
                    .filter((s) => ["pending", "acknowledged"].includes(normStatus(s.status)))
                    .reduce((a, b) => a + b.count, 0)}
                </div>
                <div className="sub">pending + acknowledged</div>
              </div>
              <div className="card stat">
                <div className="label"><CheckCircle2 size={16} /> Avg. resolution</div>
                <div className="num">{fmtHours(overview.data.avg_resolution_hours)}</div>
              </div>
              <div className="card stat">
                <div className="label">
                  {overview.data.complaints_this_month > overview.data.complaints_last_month ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  This month
                </div>
                <div className="num">{overview.data.complaints_this_month}</div>
                <div className="sub">{overview.data.complaints_last_month} last month</div>
              </div>
            </div>
          ) : null}
        </section>
      )}

      <section className="grid split">
        <div className="card">
          <div className="card-title">
            <h2>Your recent complaints</h2>
            <Link to="/complaints/mine" className="row sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {mine.loading ? (
            <Loading />
          ) : mine.error ? (
            <Notice kind="err">{mine.error}</Notice>
          ) : list.length === 0 ? (
            <Empty icon={<FilePlus2 size={24} />} title="No complaints yet">
              <Link to="/complaints/new">File your first report</Link>
            </Empty>
          ) : (
            <div className="list">
              {list.slice(0, 5).map((c) => (
                <Link key={c.id} to={`/complaints/${c.id}`} className="item">
                  <div className="grow">
                    <div className="title clip">{c.title}</div>
                    <div className="faint">
                      {c.locality || c.city || "No location"} · {timeAgo(c.created_at)}
                    </div>
                  </div>
                  <PriorityBadge priority={c.priority} />
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="stack">
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Your activity</h3>
            <div className="grid g2">
              <div>
                <div className="faint">Open</div>
                <div className="mini">{open}</div>
              </div>
              <div>
                <div className="faint">Resolved</div>
                <div className="mini">{count("resolved")}</div>
              </div>
            </div>
          </div>
          <Link to="/facilities" className="card item" style={{ alignItems: "center", textDecoration: "none" }}>
            <span className="cat-dot" style={{ background: "var(--forest)" }}><MapPin size={20} /></span>
            <div className="grow">
              <div className="title">Find a facility</div>
              <div className="faint">Recycling, e-waste, composting and more</div>
            </div>
            <ArrowRight size={16} />
          </Link>
          {isStaff && (
            <Link to="/manage/complaints" className="card item" style={{ alignItems: "center", textDecoration: "none" }}>
              <span className="cat-dot" style={{ background: "#5b3fc4" }}><BarChart3 size={20} /></span>
              <div className="grow">
                <div className="title">Review all complaints</div>
                <div className="faint">Update status and add remarks</div>
              </div>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
