import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CloudOff, Crosshair, Send } from "lucide-react";
import { api, ApiError } from "../api/client";
import type { ComplaintCreate, ComplaintPriority } from "../api/types";
import { Loading, Notice, PageHead, Spinner, useAsync, useToast } from "../components/ui";
import { PRIORITIES, PRIORITY_LABEL } from "../lib/format";
import { enqueue, newClientId } from "../lib/offlineQueue";

export default function NewComplaint() {
  const nav = useNavigate();
  const toast = useToast();
  const cats = useAsync(() => api.categories(), []);
  const [f, setF] = useState({
    title: "",
    description: "",
    waste_category_id: "",
    address: "",
    city: "",
    locality: "",
    priority: "medium" as ComplaintPriority,
    photo_url: "",
  });
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  function locate() {
    setErr(null);
    if (!navigator.geolocation) return setErr("Location isn't supported in this browser.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ latitude: +p.coords.latitude.toFixed(6), longitude: +p.coords.longitude.toFixed(6) });
        setLocating(false);
      },
      () => {
        setErr("Couldn't get your location. You can still type the address.");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    const body: ComplaintCreate = {
      title: f.title.trim(),
      description: f.description.trim(),
      waste_category_id: f.waste_category_id || null,
      address: f.address.trim() || null,
      city: f.city.trim() || null,
      locality: f.locality.trim() || null,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      priority: f.priority,
      photo_url: f.photo_url.trim() || null,
      // lets the backend de-duplicate if this is later replayed through /sync/complaints
      client_generated_id: newClientId(),
    };

    try {
      if (!navigator.onLine) throw new ApiError(0, "offline");
      const c = await api.createComplaint(body);
      toast("Complaint submitted");
      nav(`/complaints/${c.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) {
        enqueue(body);
        toast("You're offline — saved on this device and will sync automatically");
        nav("/complaints/mine");
      } else {
        setErr((e as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="Report an issue" subtitle="Describe what you've seen and where. Staff will review it and update the status." />
      {!navigator.onLine && (
        <div style={{ marginBottom: 16 }}>
          <Notice kind="warn">
            <span className="row"><CloudOff size={16} /> You're offline. Your report will be saved here and sent when you reconnect.</span>
          </Notice>
        </div>
      )}
      <form className="grid split" onSubmit={submit}>
        <div className="card stack">
          {err && <Notice kind="err">{err}</Notice>}
          <label className="field">
            Title
            <input className="input" required maxLength={255} placeholder="e.g. Overflowing bin near bus stop" value={f.title} onChange={set("title")} />
          </label>
          <label className="field">
            What's happening?
            <textarea className="input" required placeholder="Describe the problem, how long it's been there, and anything that helps crews find it." value={f.description} onChange={set("description")} />
          </label>
          <div className="grid g2">
            <label className="field">
              Waste type <span className="hint">optional</span>
              <select className="input" value={f.waste_category_id} onChange={set("waste_category_id")} disabled={cats.loading}>
                <option value="">Not sure</option>
                {cats.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Photo link <span className="hint">optional</span>
              <input className="input" type="url" maxLength={500} placeholder="https://…" value={f.photo_url} onChange={set("photo_url")} />
            </label>
          </div>
          {f.photo_url && /^https?:\/\//.test(f.photo_url) && (
            <img
              src={f.photo_url}
              alt="Attached photo preview"
              style={{ maxHeight: 180, borderRadius: 12, objectFit: "cover", alignSelf: "flex-start" }}
              onError={(e) => ((e.currentTarget.style.display = "none"))}
              onLoad={(e) => ((e.currentTarget.style.display = "block"))}
            />
          )}
        </div>

        <div className="stack">
          <div className="card stack">
            <h3>Where</h3>
            <label className="field">
              Address
              <input className="input" value={f.address} onChange={set("address")} placeholder="Street or landmark" />
            </label>
            <div className="grid g2">
              <label className="field">
                City
                <input className="input" maxLength={100} value={f.city} onChange={set("city")} />
              </label>
              <label className="field">
                Locality
                <input className="input" maxLength={255} value={f.locality} onChange={set("locality")} />
              </label>
            </div>
            <button type="button" className="btn ghost" onClick={locate} disabled={locating}>
              {locating ? <Spinner /> : <Crosshair size={16} />}
              {coords ? "Update my location" : "Use my current location"}
            </button>
            {coords && (
              <p className="sm muted">
                Pinned at {coords.latitude}, {coords.longitude}
              </p>
            )}
          </div>

          <div className="card stack">
            <h3>Priority</h3>
            <div className="chips" role="radiogroup" aria-label="Priority">
              {PRIORITIES.map((p) => (
                <button
                  type="button"
                  key={p}
                  role="radio"
                  aria-checked={f.priority === p}
                  className={`chip ${f.priority === p ? "on" : ""}`}
                  onClick={() => setF({ ...f, priority: p })}
                >
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
            <p className="faint">Use “Urgent” only for health or safety hazards.</p>
          </div>

          <button className="btn block" disabled={busy}>
            {busy ? <Spinner /> : <Send size={16} />} Submit complaint
          </button>
          <Link to="/complaints/mine" className="sm" style={{ textAlign: "center" }}>Cancel</Link>
        </div>
      </form>
      {cats.loading && <Loading />}
    </>
  );
}
