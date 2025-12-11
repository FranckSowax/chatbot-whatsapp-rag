import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Debug logging
if (typeof window !== 'undefined') {
  console.log('Supabase Config Check:', {
    hasUrl: !!supabaseUrl,
    urlLength: supabaseUrl.length,
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey.length,
    envState: process.env.NODE_ENV
  })
}

let supabase: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.error('Supabase configuration missing!', { supabaseUrl, supabaseAnonKey })
}

export { supabase }

export type Profile = {
  id: string
  email: string
  company_name: string | null
  manychat_api_key: string | null
  webhook_url: string | null
  chatbot_prompt: string | null
  role: string
  created_at: string
}

export type Document = {
  id: number
  owner_id: string
  filename: string
  file_path: string
  status: 'pending' | 'processing' | 'processed' | 'failed'
  created_at: string
}

export type Message = {
  id: number
  customer_id: string
  user_phone: string
  direction: 'inbound' | 'outbound'
  content: string
  created_at: string
}
