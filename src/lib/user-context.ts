import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetch the user's personal context string for AI prompts.
 * Returns empty string if no context is set.
 */
export async function getUserContext(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_context')
    .select('context')
    .eq('user_id', userId)
    .single()

  return data?.context?.trim() || ''
}
