import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { updateAdminPassword } from './lib/adminPassword'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClinicVerification from './pages/ClinicVerification'
import DoctorKYC from './pages/DoctorKYC'
import ClinicEditor from './pages/ClinicEditor'
import BroadcastNotification from './pages/BroadcastNotification'
import ClinicActivation from './pages/ClinicActivation'
import MedicalTaxonomy from './pages/MedicalTaxonomy'
import RecycleBin from './pages/RecycleBin'
import {
  LayoutDashboard,
  Building2,
  UserCog,
  Edit,
  Bell,
  LogOut,
  ShieldCheck,
  CreditCard,
  Stethoscope,
  Trash2,
  KeyRound,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from 'lucide-react'

function App() {
  const [archivedCount, setArchivedCount] = useState<number>(0)
  const [session, setSession] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('dactor_admin_session')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [checkingAuth, setCheckingAuth] = useState(!session)
  const [currentPath, setCurrentPath] = useState('/dashboard')

  // Change Password Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSession(session)
      setCheckingAuth(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const fetchArchivedCount = async () => {
      try {
        const { count } = await supabase
          .from('clinics')
          .select('*', { count: 'exact', head: true })
          .eq('is_archived', true)
        if (count !== null) setArchivedCount(count)
      } catch (e) {
        console.warn('Error fetching archived count:', e)
      }
    }
    fetchArchivedCount()
    const interval = setInterval(fetchArchivedCount, 12000)
    return () => clearInterval(interval)
  }, [currentPath])

  const handleSignOut = async () => {
    localStorage.removeItem('dactor_admin_session')
    await supabase.auth.signOut()
    setSession(null)
  }

  const adminEmail: string =
    session?.email || session?.user?.email || 'notanubhavjha@gmail.com'

  const openChangePasswordModal = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPwd(false)
    setShowNewPwd(false)
    setShowConfirmPwd(false)
    setPwdError('')
    setPwdSuccess('')
    setShowPasswordModal(true)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess('')

    const cur = currentPassword.trim()
    const next = newPassword.trim()
    const conf = confirmPassword.trim()

    if (!cur) {
      setPwdError('Please enter your current password.')
      return
    }
    if (next.length < 6) {
      setPwdError('New password must be at least 6 characters long.')
      return
    }
    if (next !== conf) {
      setPwdError('New password and confirmation do not match.')
      return
    }
    if (cur === next) {
      setPwdError('New password must be different from your current password.')
      return
    }

    setPwdLoading(true)
    try {
      const result = await updateAdminPassword(adminEmail, cur, next)
      if (!result.success) {
        setPwdError(result.error || 'Failed to update password.')
      } else {
        setPwdSuccess('Password updated! Use your new password next time you sign in.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      setPwdError(err?.message || 'Unexpected error while updating password.')
    } finally {
      setPwdLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
        Initializing Dactor Console...
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  const navigate = (path: string) => setCurrentPath(path)

  const renderPage = () => {
    switch (currentPath) {
      case '/dashboard': return <Dashboard onNavigate={navigate} />
      case '/clinics': return <ClinicVerification />
      case '/activation': return <ClinicActivation />
      case '/doctors': return <DoctorKYC />
      case '/taxonomy': return <MedicalTaxonomy initialTab="specialties" />
      case '/locations': return <MedicalTaxonomy initialTab="locations" />
      case '/editor': return <ClinicEditor />
      case '/broadcast': return <BroadcastNotification />
      case '/recycle-bin': return <RecycleBin />
      default: return <Dashboard onNavigate={navigate} />
    }
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-base tracking-tight text-white">Dactor Console</div>
            <div className="text-xs text-indigo-400 font-medium truncate" title={adminEmail}>
              {adminEmail}
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentPath === '/dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/activation')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentPath === '/activation' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Clinic Activations</span>
          </button>

          <button
            onClick={() => navigate('/clinics')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentPath === '/clinics' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Clinic Verification</span>
          </button>

          <button
            onClick={() => navigate('/doctors')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentPath === '/doctors' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <UserCog className="w-4 h-4" />
            <span>Doctor KYC & License</span>
          </button>

          <button
            onClick={() => navigate('/taxonomy')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentPath === '/taxonomy' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Medical Taxonomy</span>
          </button>

          <button
            onClick={() => navigate('/locations')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentPath === '/locations' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Patient App Locations</span>
          </button>

          <button
            onClick={() => navigate('/editor')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentPath === '/editor' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>Master Clinic Editor</span>
          </button>

          <button
            onClick={() => navigate('/broadcast')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentPath === '/broadcast' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Broadcast Alerts</span>
          </button>

          <button
            onClick={() => navigate('/recycle-bin')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              currentPath === '/recycle-bin' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Trash2 className="w-4 h-4" />
              <span>Recycle Bin</span>
            </div>
            {archivedCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {archivedCount}
              </span>
            )}
          </button>
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            onClick={openChangePasswordModal}
            className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition"
          >
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <span>Change Password</span>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Change Admin Password</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[260px]">{adminEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {pwdError && (
                <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(v => !v)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(v => !v)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(v => !v)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/60 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition"
                >
                  {pwdLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
