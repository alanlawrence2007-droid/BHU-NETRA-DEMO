import type { ComplaintPriority, ComplaintStatus } from "../api/types";

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  pending: "Pending",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
  rejected: "Rejected",
};
export const STATUSES = Object.keys(STATUS_LABEL) as ComplaintStatus[];

export const PRIORITY_LABEL: Record<ComplaintPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};
export const PRIORITIES = Object.keys(PRIORITY_LABEL) as ComplaintPriority[];

export const ROLE_LABEL: Record<string, string> = {
  citizen: "Citizen",
  municipal_staff: "Municipal staff",
  admin: "Admin",
};

export const FACILITY_TYPES: Record<string, string> = {
  recycling_center: "Recycling center",
  waste_collection_point: "Collection point",
  composting_facility: "Composting facility",
  hazardous_waste_depot: "Hazardous waste depot",
  e_waste_center: "E-waste center",
  landfill: "Landfill",
  transfer_station: "Transfer station",
};

export const facilityTypeLabel = (t: string) =>
  FACILITY_TYPES[t] ?? t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** accepted_waste_types is a JSON array stored as text; fall back to comma split. */
export function parseAccepted(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v.map(String);
  } catch {
    /* not JSON */
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "—";

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  return fmtDate(iso);
}

export function fmtHours(h: number): string {
  if (!h) return "—";
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} days`;
}

export const mapsLink = (lat?: number | null, lng?: number | null, q?: string) =>
  lat != null && lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q ?? "")}`;
