import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ShieldCheck, Lock, Mail } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()

    // 1. Check official Super Admin credentials (only authorized administrators)
    const isMasterAdmin = (
      (trimmedEmail === 'notanubhavjha@gmail.com' || trimmedEmail === 'rajanpurbey55@gmail.com') &&
      trimmedPassword === 'admin123'
    )

    if (isMasterAdmin) {
      localStorage.setItem('dactor_admin_session', JSON.stringify({
        email: trimmedEmail,
        role: 'super_admin'
      }))
      window.location.reload()
      return
    }

    // 2. Otherwise authenticate against Supabase Auth
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword
      })
      if (authError) {
        setError(authError.message)
      } else if (data?.session) {
        window.location.reload()
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl text-white">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Dactor Super Admin</h2>
          <p className="text-slate-400 text-sm mt-1">Platform Verification & Oversight Console</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Super Admin Email / ID
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@dactor.com"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/30 disabled:opacity-50 text-sm mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>
      </div>
    </div>
  )
}
