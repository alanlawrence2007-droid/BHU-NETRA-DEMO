import type {
  AnalyticsOverview,
  ClassificationResult,
  Complaint,
  ComplaintCreate,
  ComplaintList,
  ComplaintPriority,
  ComplaintStatus,
  DisposalRule,
  Facility,
  FacilityList,
  Feedback,
  Hotspot,
  SyncResult,
  Token,
  User,
  UserCreate,
  WasteCategory,
} from "./types";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) || "/api/v1";
const TOKEN_KEY = "cleanloop.token";

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* storage unavailable */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

/** FastAPI errors: {detail: string} or {detail: [{loc, msg}]} (422). */
function parseDetail(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const d = (body as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) {
      return d
        .map((e) => {
          const loc = Array.isArray(e?.loc) ? e.loc.filter((p: string) => p !== "body").join(".") : "";
          return loc ? `${loc}: ${e?.msg}` : String(e?.msg ?? "Invalid input");
        })
        .join("; ");
    }
  }
  return fallback;
}

type Query = Record<string, string | number | boolean | undefined | null>;

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; form?: URLSearchParams; query?: Query; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, form, query, auth = true } = opts;
  const qs = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  const url = `${BASE}${path}${qs ? `?${qs}` : ""}`;

  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let payload: BodyInit | undefined;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection.");
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth && token && onUnauthorized) onUnauthorized();
    throw new ApiError(res.status, parseDetail(data, `Request failed (${res.status})`));
  }
  return data as T;
}

export const api = {
  // ---- auth
  login: (email: string, password: string) =>
    request<Token>("/auth/login", {
      method: "POST",
      auth: false,
      // OAuth2PasswordRequestForm expects form fields, with the email in `username`
      form: new URLSearchParams({ username: email, password }),
    }),
  register: (u: UserCreate) => request<User>("/auth/register", { method: "POST", auth: false, body: u }),
  me: () => request<User>("/auth/me"),

  // ---- waste
  categories: () => request<WasteCategory[]>("/waste/categories"),
  classify: (item_name: string, description?: string) =>
    request<ClassificationResult>("/waste/classify", {
      method: "POST",
      auth: false,
      body: { item_name, description: description || undefined },
    }),
  rules: (category_id?: string, locality?: string) =>
    request<DisposalRule[]>("/waste/rules", { auth: false, query: { category_id, locality } }),

  // ---- facilities
  facilities: (q: {
    city?: string;
    facility_type?: string;
    verified_only?: boolean;
    page?: number;
    page_size?: number;
  }) => request<FacilityList>("/facilities", { auth: false, query: q }),
  nearby: (q: {
    latitude: number;
    longitude: number;
    radius_km?: number;
    facility_type?: string;
    verified_only?: boolean;
    limit?: number;
  }) => request<Facility[]>("/facilities/nearby", { auth: false, query: q }),
  facility: (id: string) => request<Facility>(`/facilities/${id}`, { auth: false }),

  // ---- complaints
  createComplaint: (c: ComplaintCreate) => request<Complaint>("/complaints", { method: "POST", body: c }),
  myComplaints: (q: { status?: ComplaintStatus; page?: number; page_size?: number }) =>
    request<ComplaintList>("/complaints/mine", { query: q }),
  allComplaints: (q: {
    status?: ComplaintStatus;
    city?: string;
    priority?: ComplaintPriority;
    page?: number;
    page_size?: number;
  }) => request<ComplaintList>("/complaints", { query: q }),
  complaint: (id: string) => request<Complaint>(`/complaints/${id}`),
  updateStatus: (id: string, new_status: ComplaintStatus, remarks?: string) =>
    request<Complaint>(`/complaints/${id}/status`, {
      method: "PATCH",
      body: { new_status, remarks: remarks || undefined },
    }),
  feedback: (id: string, rating: number, comment?: string) =>
    request<Feedback>(`/complaints/${id}/feedback`, {
      method: "POST",
      body: { rating, comment: comment || undefined },
    }),

  // ---- offline sync
  sync: (complaints: ComplaintCreate[]) =>
    request<SyncResult>("/sync/complaints", { method: "POST", body: { complaints } }),

  // ---- analytics (staff/admin)
  overview: () => request<AnalyticsOverview>("/analytics/overview"),
  hotspots: (limit = 10) => request<{ hotspots: Hotspot[] }>("/analytics/hotspots", { query: { limit } }),
};
