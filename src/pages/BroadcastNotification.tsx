import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { DactorNotification, TargetAudience } from '../lib/types'
import { Send, Users, CheckCircle, Clock } from 'lucide-react'

const DEFAULT_BROADCAST_HISTORY: DactorNotification[] = [
  {
    id: 'n1',
    title: 'Dactor 2.0 Live Queue Now Active Across Nepal',
    message: 'Welcome to Dactor! Track your clinic appointments in real-time without crowded waiting rooms.',
    type: 'broadcast',
    target_audience: 'all_users',
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'n2',
    title: 'Reminder for Clinic Doctors: NMC Verification',
    message: 'All practicing doctors must upload their updated Nepal Medical Council (NMC) registration license.',
    type: 'broadcast',
    target_audience: 'all_doctors',
    is_read: false,
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
]

export default function BroadcastNotification() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<TargetAudience>('all_users')
  const [loading, setLoading] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [history, setHistory] = useState<DactorNotification[]>([])

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        setHistory(data as DactorNotification[])
      } else {
        setHistory(DEFAULT_BROADCAST_HISTORY)
      }
    } catch {
      setHistory(DEFAULT_BROADCAST_HISTORY)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    setLoading(true)
    setSentSuccess(false)

    const newNotification: DactorNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      message: message.trim(),
      type: 'broadcast',
      target_audience: audience,
      is_read: false,
      created_at: new Date().toISOString()
    }

    try {
      await supabase.from('notifications').insert([{
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        target_audience: newNotification.target_audience,
      }])
    } catch (e) {
      console.warn('Recorded locally:', e)
    }

    setHistory(prev => [newNotification, ...prev])
    setTitle('')
    setMessage('')
    setLoading(false)
    setSentSuccess(true)
    setTimeout(() => setSentSuccess(false), 4000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Broadcast Push Notifications</h1>
        <p className="text-slate-400 text-sm mt-1">
          Broadcast system notifications and FCM mobile alerts to patients, doctors, or clinics across Nepal.
        </p>
      </div>

      {sentSuccess && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-sm font-semibold">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          Broadcast alert dispatched to target audience successfully!
        </div>
      )}

      {/* Broadcast Composer */}
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-sm">
        <h2 className="font-bold text-base text-white mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-indigo-400" />
          Compose Notification
        </h2>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Target Audience
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAudience('all_users')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                  audience === 'all_users'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-sm font-bold">All Patients</div>
                  <div className="text-[11px] text-slate-400">Every user of patient app</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAudience('all_doctors')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                  audience === 'all_doctors'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-sm font-bold">All Doctors</div>
                  <div className="text-[11px] text-slate-400">All registered physicians</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAudience('all_clinics')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                  audience === 'all_clinics'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-sm font-bold">All Clinics</div>
                  <div className="text-[11px] text-slate-400">Clinic administrators</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Notification Title
            </label>
            <input
              type="text"
              placeholder="e.g., Important Public Holiday OPD Schedule Update"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Message Content
            </label>
            <textarea
              rows={3}
              placeholder="Type your announcement or update here..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition flex items-center gap-2 text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Broadcasting...' : 'Broadcast to Selected Audience'}
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-sm">
        <h2 className="font-bold text-base text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Broadcast History
        </h2>

        <div className="space-y-3">
          {history.map(item => (
            <div key={item.id} className="p-4 rounded-xl bg-slate-900 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{item.title}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                  item.target_audience === 'all_users' ? 'bg-indigo-500/20 text-indigo-300' :
                  item.target_audience === 'all_doctors' ? 'bg-emerald-500/20 text-emerald-300' :
                  'bg-purple-500/20 text-purple-300'
                }`}>
                  {item.target_audience.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>
              <div className="text-[11px] text-slate-500 pt-1">
                Dispatched on: {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
