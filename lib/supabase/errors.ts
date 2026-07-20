export function logSupabaseError(
  operation: string,
  step: string,
  error: unknown,
  context?: Record<string, unknown>,
) {
  if (context) {
    console.error(`[Supabase] ${operation} (${step})`, error, context);
    return;
  }

  console.error(`[Supabase] ${operation} (${step})`, error);
}
