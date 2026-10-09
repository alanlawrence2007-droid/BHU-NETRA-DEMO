import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Apple,
  CalendarClock,
  Cpu,
  FlaskConical,
  Hammer,
  Lightbulb,
  Package,
  Search,
  Shield,
  Sparkles,
  Trash2,
  TreePine,
} from "lucide-react";
import { api } from "../api/client";
import type { ClassificationResult, DisposalRule, WasteCategory } from "../api/types";
import { Empty, Loading, Notice, PageHead, Spinner, useAsync } from "../components/ui";

const ICONS: Record<string, typeof Apple> = {
  "wet-waste": Apple,
  "dry-waste": Package,
  "e-waste": Cpu,
  "sanitary-waste": Shield,
  "hazardous-waste": FlaskConical,
  "construction-waste": Hammer,
  "garden-waste": TreePine,
};
const iconFor = (c: WasteCategory) => ICONS[c.slug] ?? Trash2;
const colorFor = (c: WasteCategory) => c.color_code || "#14532d";

export default function WasteGuide() {
  const cats = useAsync(() => api.categories(), []);

  // classifier
  const [item, setItem] = useState("");
  const [desc, setDesc] = useState("");
  const [res, setRes] = useState<ClassificationResult | null>(null);
  const [cErr, setCErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // rules
  const [sel, setSel] = useState<WasteCategory | null>(null);
  const [locality, setLocality] = useState("");
  const [rules, setRules] = useState<DisposalRule[] | null>(null);
  const [rLoading, setRLoading] = useState(false);
  const [rErr, setRErr] = useState<string | null>(null);

  async function classify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setCErr(null);
    try {
      const r = await api.classify(item.trim(), desc.trim());
      setRes(r);
      // Load the matched category's rules so the answer comes with the actual guidance
      loadRules(r.category, locality);
    } catch (err) {
      setRes(null);
      setCErr((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadRules(c: WasteCategory, loc = locality) {
    setSel(c);
    setRLoading(true);
    setRErr(null);
    try {
      setRules(await api.rules(c.id, loc.trim() || undefined));
    } catch (err) {
      setRErr((err as Error).message);
      setRules(null);
    } finally {
      setRLoading(false);
    }
  }

  return (
    <>
      <PageHead
        title="Waste guide"
        subtitle="Not sure which bin it belongs in? Describe the item and get disposal guidance."
      />

      <div className="card" style={{ marginBottom: 20 }}>
        <form className="grid" style={{ gridTemplateColumns: "1fr 1fr auto", alignItems: "end" }} onSubmit={classify}>
          <label className="field">
            Item
            <input
              className="input"
              placeholder="e.g. old phone charger"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              required
              maxLength={255}
            />
          </label>
          <label className="field">
            Details <span className="hint">optional</span>
            <input
              className="input"
              placeholder="e.g. frayed cable, lithium battery"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={500}
            />
          </label>
          <button className="btn" disabled={busy || !item.trim()}>
            {busy ? <Spinner /> : <Sparkles size={17} />} Classify
          </button>
        </form>

        {cErr && (
          <div style={{ marginTop: 14 }}>
            <Notice kind="err">{cErr}</Notice>
          </div>
        )}

        {res && (
          <div
            style={{
              marginTop: 18,
              borderRadius: 14,
              padding: 18,
              background: `${colorFor(res.category)}14`,
              border: `1px solid ${colorFor(res.category)}40`,
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
            }}
          >
            {(() => {
              const Icon = iconFor(res.category);
              return (
                <span className="cat-dot" style={{ background: colorFor(res.category), width: 48, height: 48 }}>
                  <Icon size={24} />
                </span>
              );
            })()}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row spread">
                <div>
                  <div className="faint">“{res.item_name}” goes in</div>
                  <h2>{res.category.name}</h2>
                </div>
                <span className="tag" title="Keyword-match confidence">
                  {Math.round(res.confidence * 100)}% match
                </span>
              </div>
              <p style={{ marginTop: 8 }}>{res.disposal_instructions}</p>
              {res.tips && (
                <p className="row sm muted" style={{ marginTop: 8, flexWrap: "nowrap", alignItems: "flex-start" }}>
                  <Lightbulb size={16} style={{ flex: "none", marginTop: 2 }} /> {res.tips}
                </p>
              )}
              {res.confidence < 0.5 && (
                <p className="sm" style={{ marginTop: 10, color: "var(--warn)" }}>
                  Low confidence — double-check the category rules below before disposing.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card-title">
        <h2>Categories</h2>
        <span className="faint">Select one for local disposal rules</span>
      </div>
      {cats.loading ? (
        <Loading />
      ) : cats.error ? (
        <Notice kind="err">{cats.error}</Notice>
      ) : !cats.data?.length ? (
        <Empty icon={<Trash2 size={24} />} title="No categories configured">
          Run the backend seed script to add waste categories.
        </Empty>
      ) : (
        <div className="grid g4" style={{ marginBottom: 20 }}>
          {cats.data.map((c) => {
            const Icon = iconFor(c);
            const on = sel?.id === c.id;
            return (
              <button
                key={c.id}
                className="card"
                onClick={() => loadRules(c)}
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  borderColor: on ? colorFor(c) : undefined,
                  outline: on ? `2px solid ${colorFor(c)}` : undefined,
                }}
                aria-pressed={on}
              >
                <span className="cat-dot" style={{ background: colorFor(c), marginBottom: 12 }}>
                  <Icon size={20} />
                </span>
                <h3>{c.name}</h3>
                <p className="sm muted" style={{ marginTop: 4 }}>
                  {c.description || "Tap to see disposal rules."}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {sel && (
        <div className="card">
          <div className="card-title" style={{ flexWrap: "wrap" }}>
            <h2>{sel.name} · disposal rules</h2>
            <form
              className="row"
              onSubmit={(e) => {
                e.preventDefault();
                loadRules(sel);
              }}
            >
              <input
                className="input"
                style={{ width: 220 }}
                placeholder="Filter by locality"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
              />
              <button className="btn ghost sm" aria-label="Search locality">
                <Search size={15} />
              </button>
            </form>
          </div>
          {rLoading ? (
            <Loading />
          ) : rErr ? (
            <Notice kind="err">{rErr}</Notice>
          ) : !rules?.length ? (
            <Empty icon={<Search size={24} />} title="No rules found">
              {locality ? "Try a different locality or clear the filter." : "No rules have been added for this category."}
            </Empty>
          ) : (
            <div className="grid g2">
              {rules.map((r) => (
                <div key={r.id} className="card flat">
                  <div className="row spread" style={{ alignItems: "flex-start" }}>
                    <h3>{r.title}</h3>
                    {r.locality && <span className="tag">{r.locality}</span>}
                  </div>
                  {r.description && <p className="sm muted" style={{ marginTop: 4 }}>{r.description}</p>}
                  <p style={{ marginTop: 10 }}>{r.instructions}</p>
                  {(r.pickup_schedule || r.pickup_time) && (
                    <p className="row sm" style={{ marginTop: 10, color: "var(--forest)", fontWeight: 600 }}>
                      <CalendarClock size={15} /> {[r.pickup_schedule, r.pickup_time].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {r.tips && (
                    <p className="row sm muted" style={{ marginTop: 8, flexWrap: "nowrap", alignItems: "flex-start" }}>
                      <Lightbulb size={15} style={{ flex: "none", marginTop: 2 }} /> {r.tips}
                    </p>
                  )}
                  {r.warnings && (
                    <div style={{ marginTop: 10 }}>
                      <Notice kind="warn">
                        <span className="row" style={{ gap: 6, flexWrap: "nowrap", alignItems: "flex-start" }}>
                          {r.warnings}
                        </span>
                      </Notice>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="sm muted" style={{ marginTop: 16 }}>
            Seeing improper dumping instead? <Link to="/complaints/new">Report an issue</Link>.
          </p>
        </div>
      )}
    </>
  );
}
