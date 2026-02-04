import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Fallback to localStorage if Supabase not configured
export const storage = {
  async get(key) {
    if (supabase) {
      const { data, error } = await supabase
        .from('app_data')
        .select('value')
        .eq('key', key)
        .single()
      if (error && error.code !== 'PGRST116') console.error(error)
      return data ? { value: data.value } : null
    } else {
      const value = localStorage.getItem(key)
      return value ? { value } : null
    }
  },
  
  async set(key, value) {
    if (supabase) {
      const { error } = await supabase
        .from('app_data')
        .upsert({ key, value, updated_at: new Date().toISOString() })
      if (error) console.error(error)
      return { key, value }
    } else {
      localStorage.setItem(key, value)
      return { key, value }
    }
  }
}
