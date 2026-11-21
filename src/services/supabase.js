import { createClient } from '@supabase/supabase-js'

// As variáveis vêm do ficheiro .env (local) ou dos "secrets" do GitHub Actions (deploy).
// A anon key é pública por desenho: o acesso aos dados é controlado pelas políticas RLS.
export const url = import.meta.env.VITE_SUPABASE_URL
export const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const modoDemo = !url || !anonKey

export const supabase = modoDemo
  ? null
  : createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })

export const BUCKET_FOTOS = 'fotos'
