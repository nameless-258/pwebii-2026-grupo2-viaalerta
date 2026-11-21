// Ponto único de acesso aos dados. Escolhe automaticamente o backend:
//  - Supabase, quando VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidos;
//  - modo demonstração (localStorage), caso contrário.
// Os componentes NUNCA acedem directamente aos dados: usam os composables, que usam este módulo.
import { modoDemo } from './supabase'
import * as supabaseBackend from './backendSupabase'
import * as localBackend from './localDb'

const api = modoDemo ? localBackend : supabaseBackend

export default api
export { modoDemo }
