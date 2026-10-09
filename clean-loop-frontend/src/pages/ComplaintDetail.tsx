import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, MapPin, MessageSquareHeart, ShieldCheck, User as UserIcon } from "lucide-react";
import { api } from "../api/client";
import type { ComplaintStatus } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Loading, Notice, PriorityBadge, Spinner, StatusBadge, Stars, useAsync, useToast } from "../components/ui";
import { facilityTypeLabel, fmtDateTime, mapsLink, STATUSES, STATUS_LABEL } from "../lib/format";

export default function ComplaintDetail() {
  const { id = "" } = useParams();
  const { user, isStaff } = useAuth();
  const toast = useToast();
  const { data: c, loading, error, reload } = useAsync(() => api.complaint(id), [id]);

  const [newStatus, setNewStatus] = useState<ComplaintStatus | "">("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [uErr, setUErr] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [fSaving, setFSaving] = useState(false);
  const [fErr, setFErr] = useState<string | null>(null);

  if (loading && !c) return <Loading />;
  if (error || !c)
    return (
      <>
        <Link to="/complaints/mine" className="row sm" style={{ marginBottom: 16 }}><ArrowLeft size={15} /> Back</Link>
        <Notice kind="err">{error ?? "Complaint not found"}</Notice>
      </>
    );

  const isOwner = user?.id === c.reporter_id;
  const myFeedback = c.feedbacks.find((f) => f.user_id === user?.id);
  // Backend only accepts feedback while a complaint is "resolved"
  const canFeedback = isOwner && c.status === "resolved" && !myFeedback;
  const back = isStaff && !isOwner ? "/manage/complaints" : "/complaints/mine";

  async function updateStatus(e: FormEvent) {
    e.preventDefault();
    if (!newStatus) return;
    setSaving(true);
    setUErr(null);
    try {
      await api.updateStatus(c!.id, newStatus, remarks.trim());
      toast(`Marked as ${STATUS_LABEL[newStatus].toLowerCase()}`);
      setNewStatus("");
      setRemarks("");
      reload();
    } catch (e) {
      setUErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function sendFeedback(e: FormEvent) {
    e.preventDefault();
    if (!rating) return setFErr("Choose a star rating first.");
    setFSaving(true);
    setFErr(null);
    try {
      await api.feedback(c!.id, rating, comment.trim());
      toast("Thanks for your feedback");
      reload();
    } catch (e) {
      setFErr((e as Error).message);
    } finally {
      setFSaving(false);
    }
  }

  return (
    <>
      <Link to={back} className="row sm" style={{ marginBottom: 16 }}>
        <ArrowLeft size={15} /> Back to complaints
      </Link>

      <div className="page-head">
        <div>
          <div className="row" style={{ marginBottom: 10 }}>
            <StatusBadge status={c.status} />
            <PriorityBadge priority={c.priority} />
            {c.waste_category && <span className="tag">{c.waste_category.name}</span>}
          </div>
          <h1>{c.title}</h1>
          <p className="faint" style={{ marginTop: 6 }}>
            Filed {fmtDateTime(c.created_at)} · Ref {c.id.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid split">
        <div className="stack" style={{ gap: 16 }}>
          <div className="card stack">
            <h3>Details</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{c.description}</p>
            {c.photo_url && (
              <a href={c.photo_url} target="_blank" rel="noreferrer">
                <img src={c.photo_url} alt="Complaint photo" style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 12, objectFit: "cover" }} />
              </a>
            )}
            {c.resolution_notes && <Notice kind="ok"><b>Resolution:</b> {c.resolution_notes}</Notice>}
          </div>

          {(canFeedback || myFeedback) && (
            <div className="card stack">
              <h3 className="row"><MessageSquareHeart size={19} /> Your feedback</h3>
              {myFeedback ? (
                <div className="stack" style={{ gap: 6 }}>
                  <Stars value={myFeedback.rating} />
                  {myFeedback.comment && <p>{myFeedback.comment}</p>}
                  <p className="faint">Submitted {fmtDateTime(myFeedback.created_at)}</p>
                </div>
              ) : (
                <form className="stack" onSubmit={sendFeedback}>
                  <p className="muted">How well was this resolved?</p>
                  <Stars value={rating} onChange={setRating} size={28} />
                  <textarea className="input" placeholder="Anything else you'd like to tell us? (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
                  {fErr && <Notice kind="err">{fErr}</Notice>}
                  <button className="btn" style={{ alignSelf: "flex-start" }} disabled={fSaving}>
                    {fSaving && <Spinner />} Submit feedback
                  </button>
                </form>
              )}
            </div>
          )}

          {isStaff && c.feedbacks.length > 0 && !isOwner && (
            <div className="card stack">
              <h3>Citizen feedback</h3>
              {c.feedbacks.map((f) => (
                <div key={f.id}>
                  <Stars value={f.rating} size={18} />
                  {f.comment && <p style={{ marginTop: 4 }}>{f.comment}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Status history</h3>
            {c.status_history.length === 0 ? (
              <p className="muted">No updates yet.</p>
            ) : (
              <ol className="timeline">
                {[...c.status_history]
                  .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
                  .map((h) => (
                    <li key={h.id}>
                      <div className="row" style={{ gap: 8 }}>
                        {h.previous_status && <><StatusBadge status={h.previous_status} /><span className="faint">→</span></>}
                        <StatusBadge status={h.new_status} />
                      </div>
                      {h.remarks && <p style={{ marginTop: 6 }}>{h.remarks}</p>}
                      <p className="faint" style={{ marginTop: 2 }}>{fmtDateTime(h.created_at)}</p>
                    </li>
                  ))}
              </ol>
            )}
          </div>
        </div>

        <div className="stack" style={{ gap: 16 }}>
          {isStaff && (
            <form className="card stack" onSubmit={updateStatus}>
              <h3 className="row"><ShieldCheck size={19} /> Update status</h3>
              <label className="field">
                New status
                <select className="input" value={newStatus} onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)} required>
                  <option value="">Select…</option>
                  {STATUSES.filter((s) => s !== c.status).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Remarks <span className="hint">visible in the history</span>
                <textarea className="input" style={{ minHeight: 80 }} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </label>
              {uErr && <Notice kind="err">{uErr}</Notice>}
              <button className="btn" disabled={saving || !newStatus}>{saving && <Spinner />} Save update</button>
            </form>
          )}

          <div className="card stack" style={{ gap: 10 }}>
            <h3>Location</h3>
            <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
              <MapPin size={17} style={{ flex: "none", marginTop: 3 }} />
              <span>{[c.address, c.locality, c.city].filter(Boolean).join(", ") || "No address given"}</span>
            </div>
            {c.latitude != null && c.longitude != null && (
              <a className="row sm" href={mapsLink(c.latitude, c.longitude)} target="_blank" rel="noreferrer">
                <ExternalLink size={14} /> View on map ({c.latitude.toFixed(4)}, {c.longitude.toFixed(4)})
              </a>
            )}
            {c.facility && (
              <p className="sm muted">Assigned facility: <b>{c.facility.name}</b> ({facilityTypeLabel(c.facility.facility_type)})</p>
            )}
          </div>

          <div className="card stack" style={{ gap: 10 }}>
            <h3>Reporter</h3>
            <div className="row"><UserIcon size={17} /> {c.reporter.full_name}</div>
            {isStaff && <div className="faint">{c.reporter.email}{c.reporter.phone ? ` · ${c.reporter.phone}` : ""}</div>}
            {c.resolved_at && <div className="faint">Resolved {fmtDateTime(c.resolved_at)}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
