import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Supabase env vars missing');
    return null;
  }
  supabase = createClient(url, key);
  return supabase;
}

export async function cloudLoad(key: string): Promise<any | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('sesuji_data')
      .select('data')
      .eq('id', key)
      .maybeSingle();

    if (error || !data) return null;
    return data.data;
  } catch (e) {
    console.error('cloudLoad error:', e);
    return null;
  }
}

// サーバーサイド用クライアント（API Route で使用）
let serverClient: SupabaseClient | null = null;

export function getServerClient(): SupabaseClient | null {
  if (serverClient) return serverClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  serverClient = createClient(url, key);
  return serverClient;
}

export async function cloudSave(key: string, value: any): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    const { error } = await client
      .from('sesuji_data')
      .upsert({ id: key, data: value, updated_at: new Date().toISOString() });

    if (error) console.error('cloudSave error:', error);
  } catch (e) {
    console.error('cloudSave error:', e);
  }
}
