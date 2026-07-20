import { getSupabaseClient } from "@/lib/supabase/client";
import { logSupabaseError } from "@/lib/supabase/errors";

/**
 * Expected Supabase table:
 *
 * create table quests (
 *   id text primary key,
 *   title text not null,
 *   description text not null,
 *   reward_xp integer not null default 0,
 *   status text not null default 'active',
 *   display_order integer not null default 0,
 *   enabled boolean not null default true
 * );
 */
export type QuestRow = {
  id: string;
  title: string;
  description: string;
  reward_xp: number;
  status: string;
  display_order: number;
  enabled: boolean;
};

export async function fetchQuests(): Promise<QuestRow[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    logSupabaseError(
      "fetchQuests",
      "client unavailable",
      new Error("Supabase client is not configured"),
    );
    return null;
  }

  const { data, error } = await supabase
    .from("quests")
    .select("id, title, description, reward_xp, status, display_order, enabled")
    .eq("enabled", true)
    .order("display_order", { ascending: true });

  if (error) {
    logSupabaseError("fetchQuests", "select", error);
    return null;
  }

  return data ?? [];
}
