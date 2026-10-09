import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClinicVerification from './pages/ClinicVerification'
import DoctorKYC from './pages/DoctorKYC'
import ClinicEditor from './pages/ClinicEditor'
import BroadcastNotification from './pages/BroadcastNotification'
import ClinicActivation from './pages/ClinicActivation'
import MedicalTaxonomy from './pages/MedicalTaxonomy'
import { LayoutDashboard, Building2, UserCog, Edit, Bell, LogOut, ShieldCheck, CreditCard, Stethoscope } from 'lucide-react'

function App() {
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

  const handleSignOut = async () => {
    localStorage.removeItem('dactor_admin_session')
    await supabase.auth.signOut()
    setSession(null)
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
      case '/taxonomy': return <MedicalTaxonomy />
      case '/editor': return <ClinicEditor />
      case '/broadcast': return <BroadcastNotification />
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
          <div>
            <div className="font-bold text-base tracking-tight text-white">Dactor Console</div>
            <div className="text-xs text-indigo-400 font-medium">Super Admin</div>
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
        </nav>

        <div className="p-3 border-t border-slate-800">
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
    </div>
  )
}

export default App
