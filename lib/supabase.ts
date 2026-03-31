import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function cloudLoad(key: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('sesuji_data')
    .select('data')
    .eq('id', key)
    .single();

  if (error || !data) return null;
  return data.data;
}

export async function cloudSave(key: string, value: any): Promise<void> {
  await supabase
    .from('sesuji_data')
    .upsert({ id: key, data: value, updated_at: new Date().toISOString() });
}
