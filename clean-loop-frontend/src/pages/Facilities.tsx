import { useState } from "react";
import { BadgeCheck, Clock, ExternalLink, Globe, LocateFixed, Mail, MapPin, Phone, Recycle, Search } from "lucide-react";
import { api } from "../api/client";
import type { Facility } from "../api/types";
import { Empty, Loading, Modal, Notice, PageHead, Pager, Spinner, useAsync } from "../components/ui";
import { FACILITY_TYPES, facilityTypeLabel, mapsLink, parseAccepted } from "../lib/format";

type Coords = { latitude: number; longitude: number };
const PAGE_SIZE = 12;

export default function Facilities() {
  const [city, setCity] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [type, setType] = useState("");
  const [verified, setVerified] = useState(false);
  const [page, setPage] = useState(1);
  const [near, setNear] = useState<Coords | null>(null);
  const [radius, setRadius] = useState(5);
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const [open, setOpen] = useState<Facility | null>(null);

  const data = useAsync(async () => {
    if (near) {
      const items = await api.nearby({
        ...near,
        radius_km: radius,
        facility_type: type || undefined,
        verified_only: verified,
        limit: 50,
      });
      return { items, total: items.length };
    }
    const r = await api.facilities({
      city: city || undefined,
      facility_type: type || undefined,
      verified_only: verified,
      page,
      page_size: PAGE_SIZE,
    });
    return { items: r.facilities, total: r.total };
  }, [city, type, verified, page, near, radius]);

  function locate() {
    setGeoErr(null);
    if (!navigator.geolocation) return setGeoErr("Location isn't supported in this browser.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setNear({ latitude: p.coords.latitude, longitude: p.coords.longitude });
        setPage(1);
        setLocating(false);
      },
      () => {
        setGeoErr("Couldn't get your location. Allow location access or search by city.");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }

  return (
    <>
      <PageHead title="Facilities" subtitle="Recycling centers, e-waste depots, composting sites and collection points." />

      <div className="card" style={{ marginBottom: 18 }}>
        <form
          className="row"
          style={{ alignItems: "flex-end" }}
          onSubmit={(e) => {
            e.preventDefault();
            setNear(null);
            setPage(1);
            setCity(cityInput.trim());
          }}
        >
          <label className="field" style={{ flex: "1 1 200px" }}>
            City
            <input className="input" placeholder="e.g. Bangalore" value={cityInput} onChange={(e) => setCityInput(e.target.value)} />
          </label>
          <label className="field" style={{ flex: "1 1 200px" }}>
            Type
            <select className="input" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
              <option value="">All types</option>
              {Object.entries(FACILITY_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <button className="btn"><Search size={16} /> Search</button>
          <button type="button" className="btn ghost" onClick={locate} disabled={locating}>
            {locating ? <Spinner /> : <LocateFixed size={16} />} Near me
          </button>
        </form>
        <div className="row spread" style={{ marginTop: 14 }}>
          <label className="check">
            <input type="checkbox" checked={verified} onChange={(e) => { setVerified(e.target.checked); setPage(1); }} />
            Verified facilities only
          </label>
          {near && (
            <div className="row">
              <span className="sm muted">Within</span>
              <select className="input" style={{ width: 100 }} value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                {[2, 5, 10, 25, 50].map((r) => <option key={r} value={r}>{r} km</option>)}
              </select>
              <button className="btn ghost sm" onClick={() => setNear(null)}>Clear location</button>
            </div>
          )}
        </div>
        {geoErr && <div style={{ marginTop: 12 }}><Notice kind="warn">{geoErr}</Notice></div>}
      </div>

      {data.loading ? (
        <Loading />
      ) : data.error ? (
        <Notice kind="err">{data.error}</Notice>
      ) : !data.data?.items.length ? (
        <div className="card">
          <Empty icon={<MapPin size={24} />} title="No facilities found">
            {near ? "Try a larger radius." : "Try another city or remove some filters."}
          </Empty>
        </div>
      ) : (
        <>
          {near && <p className="sm muted" style={{ marginBottom: 10 }}>{data.data.total} within {radius} km of you</p>}
          <div className="grid g3">
            {data.data.items.map((f) => (
              <button key={f.id} className="card" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => setOpen(f)}>
                <div className="row spread" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                  <span className="cat-dot" style={{ background: "var(--forest)" }}><Recycle size={20} /></span>
                  {f.is_verified ? (
                    <span className="verified"><BadgeCheck size={16} /> Verified</span>
                  ) : (
                    <span className="faint">Unverified</span>
                  )}
                </div>
                <h3 style={{ marginTop: 12 }}>{f.name}</h3>
                <div className="faint" style={{ marginTop: 2 }}>{facilityTypeLabel(f.facility_type)}</div>
                <p className="sm muted" style={{ marginTop: 10 }}>{f.address}, {f.city}</p>
                <div className="chips" style={{ marginTop: 10 }}>
                  {parseAccepted(f.accepted_waste_types).slice(0, 3).map((w) => <span key={w} className="tag">{w}</span>)}
                </div>
              </button>
            ))}
          </div>
          {!near && <Pager page={page} pageSize={PAGE_SIZE} total={data.data.total} onPage={setPage} />}
        </>
      )}

      {open && (
        <Modal title={open.name} onClose={() => setOpen(null)}>
          <div className="stack">
            <div className="row">
              <span className="tag">{facilityTypeLabel(open.facility_type)}</span>
              {open.is_verified ? (
                <span className="verified"><BadgeCheck size={16} /> Verified</span>
              ) : (
                <span className="faint">Not yet verified by the municipality</span>
              )}
            </div>
            {open.description && <p>{open.description}</p>}
            <div className="stack" style={{ gap: 8 }}>
              <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                <MapPin size={17} style={{ flex: "none", marginTop: 3 }} />
                <span>{[open.address, open.city, open.state, open.postal_code].filter(Boolean).join(", ")}</span>
              </div>
              {open.operating_hours && (
                <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                  <Clock size={17} style={{ flex: "none", marginTop: 3 }} /> <span>{open.operating_hours}</span>
                </div>
              )}
              {open.phone && <div className="row"><Phone size={17} /> <a href={`tel:${open.phone}`}>{open.phone}</a></div>}
              {open.email && <div className="row"><Mail size={17} /> <a href={`mailto:${open.email}`}>{open.email}</a></div>}
              {open.website && (
                <div className="row"><Globe size={17} /> <a href={open.website} target="_blank" rel="noreferrer">{open.website}</a></div>
              )}
            </div>
            {parseAccepted(open.accepted_waste_types).length > 0 && (
              <div>
                <div className="faint" style={{ marginBottom: 6 }}>Accepts</div>
                <div className="chips">
                  {parseAccepted(open.accepted_waste_types).map((w) => <span key={w} className="tag">{w}</span>)}
                </div>
              </div>
            )}
            <a className="btn" href={mapsLink(open.latitude, open.longitude, `${open.name} ${open.address} ${open.city}`)} target="_blank" rel="noreferrer">
              <ExternalLink size={16} /> Open in Maps
            </a>
          </div>
        </Modal>
      )}
    </>
  );
}
