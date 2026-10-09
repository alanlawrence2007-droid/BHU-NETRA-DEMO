import { api } from "../api/client";
import type { ComplaintCreate } from "../api/types";

// Complaints filed while offline are queued locally with a client_generated_id,
// then pushed through POST /sync/complaints (the backend de-duplicates on that id).

const KEY = "cleanloop.offlineQueue";

export function newClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function readQueue(): ComplaintCreate[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ComplaintCreate[]) : [];
  } catch {
    return [];
  }
}

function write(q: ComplaintCreate[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
    window.dispatchEvent(new Event("cleanloop:queue"));
  } catch {
    /* storage unavailable */
  }
}

export function enqueue(c: ComplaintCreate) {
  write([...readQueue(), c]);
}

/**
 * Pushes the queue. The API reports `synced` as new server IDs, `duplicates` as client IDs
 * and `errors` with the client ID that failed, so anything not listed in `errors` is done.
 */
export async function flushQueue(): Promise<{ sent: number; failed: number }> {
  const queue = readQueue();
  if (!queue.length) return { sent: 0, failed: 0 };
  const res = await api.sync(queue);
  const failedIds = new Set(
    res.errors.map((e) => (e as { client_generated_id?: string | null }).client_generated_id).filter(Boolean) as string[],
  );
  const remaining = queue.filter((c) => c.client_generated_id && failedIds.has(c.client_generated_id));
  write(remaining);
  return { sent: queue.length - remaining.length, failed: remaining.length };
}
