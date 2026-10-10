import { supabase } from './supabase'

const MASTER_ADMINS = ['notanubhavjha@gmail.com', 'rajanpurbey55@gmail.com']
const DEFAULT_MASTER_PASSWORD = 'admin123'
const LOCAL_STORAGE_PWD_KEY = 'dactor_admin_passwords'
const PWD_PREFIX = 'pwd:'

export function isMasterAdminEmail(email: string): boolean {
  return MASTER_ADMINS.includes(email.trim().toLowerCase())
}

function getLocalPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PWD_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setLocalPassword(email: string, newPassword: string) {
  try {
    const map = getLocalPasswords()
    map[email.trim().toLowerCase()] = newPassword
    localStorage.setItem(LOCAL_STORAGE_PWD_KEY, JSON.stringify(map))
  } catch (e) {
    console.warn('Could not save password to localStorage:', e)
  }
}

/**
 * Fetches the current active password for a super admin email.
 * Checks Supabase `profiles` table first (stored with `pwd:` prefix in `phone`),
 * then falls back to localStorage, and finally `'admin123'` for master admins.
 */
export async function getAdminPassword(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('phone')
      .eq('email', normalized)
      .eq('role', 'super_admin')
      .limit(1)
      .maybeSingle()

    if (!error && data?.phone && typeof data.phone === 'string' && data.phone.startsWith(PWD_PREFIX)) {
      const remotePwd = data.phone.slice(PWD_PREFIX.length)
      if (remotePwd) {
        setLocalPassword(normalized, remotePwd)
        return remotePwd
      }
    }
  } catch (e) {
    console.warn('Could not fetch admin password from Supabase profiles, falling back to local:', e)
  }

  const localMap = getLocalPasswords()
  if (localMap[normalized]) {
    return localMap[normalized]
  }

  return DEFAULT_MASTER_PASSWORD
}

/**
 * Updates the password for the currently logged-in admin in both
 * localStorage, Supabase `profiles` table, and Supabase Auth (if a session is active).
 */
export async function updateAdminPassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase()

  if (!normalized) {
    return { success: false, error: 'Admin email not found in current session.' }
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' }
  }

  // 1. Verify current password
  const activePassword = await getAdminPassword(normalized)
  if (currentPassword !== activePassword) {
    // If not matching master/profile password, check if they are signed in via Supabase Auth
    const { data: authData } = await supabase.auth.getSession()
    if (authData?.session?.user?.email?.toLowerCase() === normalized) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: normalized,
        password: currentPassword,
      })
      if (signInErr) {
        return { success: false, error: 'Current password is incorrect.' }
      }
    } else {
      return { success: false, error: 'Current password is incorrect.' }
    }
  }

  // 2. Save locally immediately
  setLocalPassword(normalized, newPassword)

  // 3. Persist in Supabase `profiles` table so it works across browsers/devices
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalized)
      .eq('role', 'super_admin')
      .limit(1)
      .maybeSingle()

    if (existing?.id) {
      await supabase
        .from('profiles')
        .update({ phone: `${PWD_PREFIX}${newPassword}` })
        .eq('id', existing.id)
    } else {
      await supabase.from('profiles').insert({
        email: normalized,
        full_name: 'Super Admin',
        role: 'super_admin',
        phone: `${PWD_PREFIX}${newPassword}`,
      })
    }
  } catch (e) {
    console.warn('Could not persist password in profiles table:', e)
  }

  // 4. Also update Supabase Auth user password if an active Supabase Auth session exists
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session) {
      await supabase.auth.updateUser({ password: newPassword })
    }
  } catch (e) {
    console.warn('Supabase Auth password update skipped:', e)
  }

  return { success: true }
}
