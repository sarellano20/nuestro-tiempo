import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bxyaxpopuditdfifojla.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_rzodFYCh6-hE1EBhdbKtmQ_tNp4XFVj'

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey)
export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseKey) : null

const accountEmails = {
  sarellano: 'santiago.arellano.2a@gmail.com',
  diaval: 'dianellafigueroa2301@gmail.com',
}

export const usernameEmail = (username) => {
  const normalizedUsername = username.trim().toLowerCase()
  return accountEmails[normalizedUsername] || `${normalizedUsername}@nuestrotiempo.app`
}

export async function signedMediaUrl(path) {
  if (!path || !supabase) return null
  const { data, error } = await supabase.storage.from('memory-photos').createSignedUrl(path, 60 * 60)
  if (error) return null
  return data?.signedUrl ?? null
}

export async function signedMediaUrls(paths = []) {
  return Promise.all(paths.map(async (path) => [path, await signedMediaUrl(path)]))
}
