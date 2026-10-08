import { sharedMemoryStore } from "./memory";
import { createSupabaseStore } from "./supabase";
import type { DataStore } from "./types";

export type { DataStore } from "./types";

/** SUPABASE_URL + SUPABASE_SECRET_KEY(또는 구형 SUPABASE_SERVICE_ROLE_KEY)가 있으면 Supabase, 없으면 메모리 */
export function getStore({ fresh = false }: { fresh?: boolean } = {}): DataStore {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return createSupabaseStore({ url, key, fresh });
  return sharedMemoryStore();
}
