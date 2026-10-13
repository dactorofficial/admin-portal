import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  HelpCircle,
  Globe,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Clock,
  Sparkles,
  Smartphone,
  UserCheck
} from 'lucide-react'

export default function SupportSettings() {
  const [supportUrl, setSupportUrl] = useState('https://rajanpurbe.github.io/Dactor/support')
  const [supportPhone, setSupportPhone] = useState('+977 9800000000')
  const [supportEmail, setSupportEmail] = useState('dactorofficial@gmail.com')
  const [supportHours, setSupportHours] = useState('24/7 Regulatory & Onboarding Helpdesk')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      // 1. Try system_settings table
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('key', ['support_url', 'support_phone', 'support_email', 'support_hours'])

      if (!error && data && data.length > 0) {
        data.forEach(item => {
          if (item.key === 'support_url' && item.value) setSupportUrl(item.value)
          if (item.key === 'support_phone' && item.value) setSupportPhone(item.value)
          if (item.key === 'support_email' && item.value) setSupportEmail(item.value)
          if (item.key === 'support_hours' && item.value) setSupportHours(item.value)
          if (item.updated_at) setLastUpdated(item.updated_at)
        })
      } else {
        // 2. Query medical_specialties for system_config rows
        const { data: specData } = await supabase
          .from('medical_specialties')
          .select('*')
          .eq('category', 'system_config')

        if (specData && specData.length > 0) {
          specData.forEach(row => {
            if (row.name === 'system_config:support_url' && row.search_keywords) setSupportUrl(row.search_keywords)
            if (row.name === 'system_config:support_phone' && row.search_keywords) setSupportPhone(row.search_keywords)
            if (row.name === 'system_config:support_email' && row.search_keywords) setSupportEmail(row.search_keywords)
            if (row.name === 'system_config:support_hours' && row.search_keywords) setSupportHours(row.search_keywords)
            if (row.updated_at) setLastUpdated(row.updated_at)
          })
        }
      }
    } catch (err: any) {
      console.warn('Error reading system settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setStatusMessage('')
    setErrorMessage('')

    const cleanUrl = supportUrl.trim()
    if (!cleanUrl) {
      setErrorMessage('Please provide a valid support website URL.')
      setSaving(false)
      return
    }

    try {
      // 1. Persist to medical_specialties with category='system_config'
      const specConfigs = [
        {
          name: 'system_config:support_url',
          category: 'system_config',
          description: 'Official Dactor Support Website Destination URL',
          search_keywords: cleanUrl,
          icon: 'Globe',
          is_active: true,
          updated_at: new Date().toISOString()
        },
        {
          name: 'system_config:support_phone',
          category: 'system_config',
          description: 'Support Helpline Phone',
          search_keywords: supportPhone.trim(),
          icon: 'Phone',
          is_active: true,
          updated_at: new Date().toISOString()
        },
        {
          name: 'system_config:support_email',
          category: 'system_config',
          description: 'Support Contact Email',
          search_keywords: supportEmail.trim(),
          icon: 'Mail',
          is_active: true,
          updated_at: new Date().toISOString()
        },
        {
          name: 'system_config:support_hours',
          category: 'system_config',
          description: 'Support Operating Hours',
          search_keywords: supportHours.trim(),
          icon: 'Clock',
          is_active: true,
          updated_at: new Date().toISOString()
        }
      ]

      await supabase.from('medical_specialties').upsert(specConfigs, { onConflict: 'name' })

      // 2. Also attempt writing to system_settings if available
      try {
        const rows = [
          { key: 'support_url', value: cleanUrl, description: 'Official Dactor support URL', updated_at: new Date().toISOString() },
          { key: 'support_phone', value: supportPhone.trim(), description: 'Support phone', updated_at: new Date().toISOString() },
          { key: 'support_email', value: supportEmail.trim(), description: 'Support email', updated_at: new Date().toISOString() },
          { key: 'support_hours', value: supportHours.trim(), description: 'Support hours', updated_at: new Date().toISOString() }
        ]
        await supabase.from('system_settings').upsert(rows, { onConflict: 'key' })
      } catch {}

      // 3. LocalStorage cache for instant fallback
      try {
        localStorage.setItem('dactor_support_url', cleanUrl)
        localStorage.setItem('dactor_support_phone', supportPhone.trim())
        localStorage.setItem('dactor_support_email', supportEmail.trim())
      } catch {}

      setLastUpdated(new Date().toISOString())
      setStatusMessage('Support URL and helpdesk details published successfully to all portals & apps!')
      setTimeout(() => setStatusMessage(''), 6000)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to publish support URL to Supabase.')
    } finally {
      setSaving(false)
    }
  }

  const applyPreset = (presetUrl: string) => {
    setSupportUrl(presetUrl)
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Support Website & Helpdesk Publisher
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Publish or redirect the official support website URL dynamically across all Clinic, Doctor, and Patient portals.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Config</span>
          </button>

          {supportUrl && (
            <a
              href={supportUrl.startsWith('http') || supportUrl.startsWith('mailto:') ? supportUrl : `https://${supportUrl}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Test Live URL</span>
            </a>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Publisher Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handlePublish} className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Publish Target Support Website URL</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                When clinics or doctors are awaiting verification, or when users tap &ldquo;Contact Us&rdquo; in Profile Settings, they will immediately be directed to this destination.
              </p>
            </div>

            {/* Support URL Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Official Support Website URL <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={supportUrl}
                  onChange={(e) => setSupportUrl(e.target.value)}
                  placeholder="https://rajanpurbe.github.io/Dactor/support or https://wa.me/..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Can be a standalone website, GitHub Pages site, WhatsApp business link, or custom Zendesk/Intercom portal.
              </p>
            </div>

            {/* Quick URL Presets */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Quick URL Presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('https://rajanpurbe.github.io/Dactor/support')}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-left transition text-xs group"
                >
                  <div className="font-bold text-white group-hover:text-indigo-300">GitHub Pages Site</div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">dactorofficial.github.io/support</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('https://wa.me/9779800000000?text=Hello%20Dactor%20Support')}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left transition text-xs group"
                >
                  <div className="font-bold text-white group-hover:text-emerald-300">WhatsApp Helpdesk</div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">wa.me/9779800000000</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('mailto:dactorofficial@gmail.com?subject=Dactor%20Verification%20Support')}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition text-xs group"
                >
                  <div className="font-bold text-white group-hover:text-sky-300">Email Direct</div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">dactorofficial@gmail.com</div>
                </button>
              </div>
            </div>

            {/* Secondary Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-850">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Support Helpline Phone</span>
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+977 9800000000"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Official Support Email</span>
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="dactorofficial@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Operating Hours Banner</span>
              </label>
              <input
                type="text"
                value={supportHours}
                onChange={(e) => setSupportHours(e.target.value)}
                placeholder="24/7 Regulatory & Onboarding Helpdesk"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {lastUpdated ? `Last published: ${new Date(lastUpdated).toLocaleDateString()} ${new Date(lastUpdated).toLocaleTimeString()}` : 'Not yet saved to database'}
              </span>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publishing to Network...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Publish Support URL Directly</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview & Verification Integration Details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Preview Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Live Action Preview</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Connected
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Here is how the newly configured Support link appears inside the app verification screens and profile settings:
            </p>

            {/* Mock Pending Verification Card */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>While Profile Is Being Verified</span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                &ldquo;Your medical credentials or clinic registration are under regulatory review...&rdquo;
              </p>
              <div className="pt-1">
                <a
                  href={supportUrl.startsWith('http') || supportUrl.startsWith('mailto:') ? supportUrl : `https://${supportUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-110 transition"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Contact Dactor Support & Onboarding Desk</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                </a>
              </div>
            </div>

            {/* Mock Profile Settings Card */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>Inside Profile & Clinic Settings</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Contact Us & Support</div>
                    <div className="text-[10px] text-slate-400">Helpdesk • FAQs • Regulatory Onboarding</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>

            {/* Deployment Targets Checklist */}
            <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
              <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mb-2">
                Automatic Network Targets:
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Clinic Portal (Web & App) Pending Review Screen</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Doctor Portal (Web & App) KYC Pending Screen</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Clinic Settings Screen & Doctor Profile modal</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Patient Portal & Mobile App Profile Settings</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
