import dns from "node:dns/promises";
import { createClient as _createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

const SUPABASE_TIMEOUT_MS = 2_000;
const DNS_LOOKUP_TIMEOUT_MS = 1_000;

let supabaseUnavailable = false;
const hostReachable = new Map<string, boolean>();

function isSupabaseNetworkError(message: string) {
  return /fetch failed|failed to fetch|enotfound|econnrefused|abort|nxdomain/i.test(message);
}

async function isSupabaseReachable(url: string): Promise<boolean> {
  if (supabaseUnavailable) return false;

  const hostname = new URL(url).hostname;
  const cached = hostReachable.get(hostname);
  if (cached !== undefined) return cached;

  try {
    await Promise.race([
      dns.lookup(hostname),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("dns timeout")), DNS_LOOKUP_TIMEOUT_MS)
      ),
    ]);
    hostReachable.set(hostname, true);
    return true;
  } catch {
    supabaseUnavailable = true;
    hostReachable.set(hostname, false);
    return false;
  }
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const hostname = new URL(url).hostname;
    if (!hostname.endsWith(".supabase.co")) return null;
  } catch {
    return null;
  }
  return { url, key };
}

export function createSupabaseServerClient(): SupabaseClient<Database> | null {
  if (supabaseUnavailable) return null;
  const config = getSupabaseConfig();
  if (!config) return null;
  return _createClient<Database>(config.url, config.key, {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
        const signal = init?.signal;
        if (signal) {
          if (signal.aborted) controller.abort();
          else signal.addEventListener("abort", () => controller.abort(), { once: true });
        }
        return fetch(input, { ...init, signal: controller.signal }).finally(() =>
          clearTimeout(timeout)
        );
      },
    },
  });
}

export async function querySupabase<T>(
  query: (client: SupabaseClient<Database>) => PromiseLike<{
    data: T | null;
    error: { message: string } | null;
  }>
): Promise<T | null> {
  const config = getSupabaseConfig();
  if (!config || !(await isSupabaseReachable(config.url))) return null;

  const client = createSupabaseServerClient();
  if (!client) return null;

  try {
    const { data, error } = await query(client);
    if (error) {
      console.warn("[supabase]", error.message);
      if (isSupabaseNetworkError(error.message)) supabaseUnavailable = true;
      return null;
    }
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[supabase network]", message);
    if (isSupabaseNetworkError(message)) supabaseUnavailable = true;
    return null;
  }
}
