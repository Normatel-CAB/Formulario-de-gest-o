import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        // O login Microsoft volta da Microsoft com o código de autorização na
        // URL. Sem `detectSessionInUrl` o supabase-js ignora esse retorno e a
        // sessão nunca se estabelece — era um dos motivos do botão "não
        // funcionar": o redirecionamento acontecia e voltava para o começo.
        detectSessionInUrl: true,
        // PKCE é o fluxo correto para app de página única (sem segredo no
        // navegador). Precisa combinar com o provedor configurado no Supabase.
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export const FORMS_TABLE = 'formularios_avaliacao'
export const ATTACHMENTS_BUCKET = 'formularios-anexos'
export const SETTINGS_BUCKET = 'configuracoes'
