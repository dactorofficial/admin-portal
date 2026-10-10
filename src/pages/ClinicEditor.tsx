import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Clinic, ClinicType, ClinicService, MedicalSpecialty } from '../lib/types'
import { Building, Save, Plus, Trash2, Check, Image as ImageIcon, FileText, ExternalLink, X } from 'lucide-react'

function resolvePictures(clinic: Clinic): string[] {
  let pics = clinic.pictures || []
  if (clinic.description && clinic.description.trim().startsWith('{')) {
    try {
      const meta = JSON.parse(clinic.description)
      if (meta.pictures && meta.pictures.length > 0) pics = meta.pictures
    } catch (e) {}
  }
  if (typeof pics === 'string') {
    try {
      if ((pics as string).startsWith('[')) pics = JSON.parse(pics)
      else if ((pics as string).startsWith('{')) pics = (pics as string).slice(1, -1).split(',').map(s => s.replace(/^"|"$/g, '').trim()).filter(Boolean)
      else pics = [(pics as string).trim()].filter(Boolean)
    } catch (e) {
      pics = []
    }
  }
  if (!Array.isArray(pics)) return []
  return pics.map(p => {
    if (!p) return ''
    if (p.startsWith('http')) return p
    if (p.startsWith('content://')) return p
    const clean = p.replace(/^clinic_photos\//, '').replace(/^\//, '')
    const { data } = supabase.storage.from('clinic_photos').getPublicUrl(clean)
    return data?.publicUrl || p
  }).filter(Boolean)
}

export default function ClinicEditor() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [availableSpecialties, setAvailableSpecialties] = useState<MedicalSpecialty[]>([])
  const [services, setServices] = useState<ClinicService[]>([])
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [newServiceDesc, setNewServiceDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    fetchClinics()
    fetchAvailableSpecialties()
  }, [])

  const fetchAvailableSpecialties = async () => {
    try {
      const { data } = await supabase.from('medical_specialties').select('*').eq('is_active', true).order('name')
      if (data) setAvailableSpecialties(data as MedicalSpecialty[])
    } catch (e) {
      console.warn('Failed to fetch specialties:', e)
    }
  }

  const fetchClinics = async () => {
    try {
      const { data, error } = await supabase.from('clinics').select('*').order('name')
      if (!error && data && data.length > 0) {
        setClinics(data as Clinic[])
        const activeClinics = (data as Clinic[]).filter(c => !c.is_archived)
        const initialClinic = activeClinics[0] || (data[0] as Clinic)
        setSelectedClinic(initialClinic)
        fetchServices(initialClinic.id)
      } else {
        setClinics([])
        setSelectedClinic(null)
        setServices([])
      }
    } catch {
      setClinics([])
      setSelectedClinic(null)
      setServices([])
    }
  }

  const fetchServices = async (clinicId: string) => {
    try {
      const { data } = await supabase.from('clinic_services').select('*').eq('clinic_id', clinicId)
      if (data) {
        setServices(data as ClinicService[])
      } else {
        setServices([])
      }
    } catch {
      setServices([])
    }
  }

  const handleSelectClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic)
    setSaveSuccess(false)
    fetchServices(clinic.id)
  }

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClinic) return
    setSaving(true)
    setSaveSuccess(false)
    try {
      await supabase.from('clinics').update({
        name: selectedClinic.name,
        type: selectedClinic.type,
        address_text: selectedClinic.address_text,
        contact_phone: selectedClinic.contact_phone,
        contact_email: selectedClinic.contact_email,
        latitude: selectedClinic.latitude,
        longitude: selectedClinic.longitude,
        auto_notify_threshold: selectedClinic.auto_notify_threshold,
        description: selectedClinic.description,
        pan_number: selectedClinic.pan_number,
        manager_phone: selectedClinic.manager_phone,
        is_direct_payment_enabled: selectedClinic.is_direct_payment_enabled,
        payment_gateway_provider: selectedClinic.payment_gateway_provider,
        payment_api_key: selectedClinic.payment_api_key,
        payment_secret_key: selectedClinic.payment_secret_key,
        merchant_id: selectedClinic.merchant_id,
        specialties: selectedClinic.specialties || [],
      }).eq('id', selectedClinic.id)
    } catch (e) {
      console.warn('Saved in local state:', e)
    }
    setClinics(prev => prev.map(c => c.id === selectedClinic.id ? selectedClinic : c))
    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClinic || !newServiceName || !newServicePrice) return
    const newService: ClinicService = {
      id: 'srv_' + Math.random().toString(36).substring(2, 9),
      clinic_id: selectedClinic.id,
      service_name: newServiceName.trim(),
      description: newServiceDesc.trim() || undefined,
      price: parseFloat(newServicePrice),
      created_at: new Date().toISOString()
    }

    try {
      await supabase.from('clinic_services').insert([{
        clinic_id: newService.clinic_id,
        service_name: newService.service_name,
        description: newService.description,
        price: newService.price
      }])
    } catch (e) {
      console.warn('Added locally:', e)
    }

    setServices(prev => [...prev, newService])
    setNewServiceName('')
    setNewServicePrice('')
    setNewServiceDesc('')
  }

  const handleDeleteService = async (serviceId: string) => {
    try {
      await supabase.from('clinic_services').delete().eq('id', serviceId)
    } catch (e) {
      console.warn('Deleted locally:', e)
    }
    setServices(prev => prev.filter(s => s.id !== serviceId))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Master Clinic & Services Editor</h1>
        <p className="text-slate-400 text-sm mt-1">
          Super Admin master access to modify clinic attributes, operational categories, and services with pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Clinic Selector Column */}
        <div className="lg:col-span-4 bg-slate-800 border border-slate-700 p-4 rounded-2xl h-fit">
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Select Clinic</h2>
            {clinics.some(c => c.is_archived) && (
              <button
                type="button"
                onClick={() => setShowArchived(prev => !prev)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition ${
                  showArchived
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-300'
                }`}
              >
                {showArchived ? 'Hide Archived' : `Show Archived (${clinics.filter(c => c.is_archived).length})`}
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-[72vh] overflow-y-auto pr-1">
            {clinics.filter(c => showArchived ? true : !c.is_archived).map(clinic => (
              <button
                key={clinic.id}
                onClick={() => handleSelectClinic(clinic)}
                className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between ${
                  selectedClinic?.id === clinic.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    {clinic.name}
                    {clinic.is_archived && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        ARCHIVED
                      </span>
                    )}
                  </div>
                  <div className={`text-xs ${selectedClinic?.id === clinic.id ? 'text-indigo-200' : 'text-slate-400'} truncate max-w-[200px]`}>
                    {clinic.address_text}
                  </div>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  selectedClinic?.id === clinic.id ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {clinic.type.replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor Form Column */}
        {selectedClinic && (
          <div className="lg:col-span-8 space-y-6">
            {/* Main Clinic Profile Editor */}
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-white">Edit Clinic Details</h2>
                    <p className="text-xs text-slate-400">ID: {selectedClinic.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {saveSuccess && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                      <Check className="w-4 h-4" /> Changes Saved
                    </span>
                  )}
                  {!selectedClinic.is_archived && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Move "${selectedClinic.name}" to the Recycle Bin? It will be held for 30 days before permanent deletion.`)) return
                        const scheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                        const updates = {
                          is_archived: true,
                          archived_at: new Date().toISOString(),
                          deletion_scheduled_at: scheduledDate,
                          updated_at: new Date().toISOString()
                        }
                        await supabase.from('clinics').update(updates).eq('id', selectedClinic.id)
                        setSelectedClinic({ ...selectedClinic, ...updates })
                        setClinics(prev => prev.map(c => c.id === selectedClinic.id ? { ...c, ...updates } : c))
                      }}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 transition"
                      title="Archive clinic to Recycle Bin"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Move to Recycle Bin
                    </button>
                  )}
                </div>
              </div>

              {selectedClinic.is_archived && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                  <div className="text-xs text-rose-300">
                    <span className="font-bold">⚠️ Clinic Scheduled for Deletion (30-Day Archive):</span> Purge scheduled for {selectedClinic.deletion_scheduled_at ? new Date(selectedClinic.deletion_scheduled_at).toLocaleDateString() : 'within 30 days'}. Expiration will permanently purge all patient appointments and records.
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.from('clinics').update({
                        is_archived: false,
                        archived_at: null,
                        deletion_scheduled_at: null
                      }).eq('id', selectedClinic.id)
                      setSelectedClinic({ ...selectedClinic, is_archived: false, archived_at: undefined, deletion_scheduled_at: undefined })
                      setClinics(prev => prev.map(c => c.id === selectedClinic.id ? { ...c, is_archived: false } : c))
                    }}
                    className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded-lg transition"
                  >
                    Restore Clinic
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveClinic} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Clinic Name</label>
                    <input
                      type="text"
                      value={selectedClinic.name}
                      onChange={e => setSelectedClinic({ ...selectedClinic, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Clinic Type</label>
                    <select
                      value={selectedClinic.type}
                      onChange={e => setSelectedClinic({ ...selectedClinic, type: e.target.value as ClinicType })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="single_visit">Single Visit (Consultation)</option>
                      <option value="multi_visit">Multi Visit (Follow-up Care)</option>
                      <option value="diagnostic_lab">Diagnostic / Lab Center</option>
                    </select>
                  </div>
                </div>

                {/* Multi-Select Clinical Specialties */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Medical Specialties Offered (Select Multiple)
                    </label>
                    <span className="text-[11px] text-indigo-400 font-semibold">
                      {(selectedClinic.specialties || []).length} Selected
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 max-h-44 overflow-y-auto flex flex-wrap gap-1.5">
                    {availableSpecialties.map(spec => {
                      const isSelected = (selectedClinic.specialties || []).includes(spec.name)
                      return (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => {
                            const current = selectedClinic.specialties || []
                            const updated = isSelected 
                              ? current.filter(s => s !== spec.name)
                              : [...current, spec.name]
                            setSelectedClinic({ ...selectedClinic, specialties: updated })
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white font-semibold shadow-sm'
                              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                          <span>{spec.name}</span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Patients searching for problems (e.g. eye, teeth, skin, heart) matching these specialties will discover this clinic.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={selectedClinic.address_text}
                    onChange={e => setSelectedClinic({ ...selectedClinic, address_text: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={selectedClinic.contact_phone}
                      onChange={e => setSelectedClinic({ ...selectedClinic, contact_phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={selectedClinic.contact_email}
                      onChange={e => setSelectedClinic({ ...selectedClinic, contact_email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">PAN Number (9 Digits)</label>
                    <input
                      type="text"
                      maxLength={9}
                      value={selectedClinic.pan_number || ''}
                      onChange={e => setSelectedClinic({ ...selectedClinic, pan_number: e.target.value.replace(/\D/g, '') })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="e.g. 601234567"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Manager Phone (+977)</label>
                    <input
                      type="text"
                      value={selectedClinic.manager_phone || ''}
                      onChange={e => setSelectedClinic({ ...selectedClinic, manager_phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="+977 98xxxxxxxx"
                    />
                  </div>
                </div>

                {/* Direct Payment Gateway & API Keys */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Direct Payment Merchant Gateway</h4>
                      <p className="text-xs text-slate-400">Receive patient payments directly into this clinic's merchant account</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedClinic.is_direct_payment_enabled || false}
                        onChange={e => setSelectedClinic({ ...selectedClinic, is_direct_payment_enabled: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-xs font-semibold text-slate-300">Enabled</span>
                    </label>
                  </div>

                  {selectedClinic.is_direct_payment_enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Payment Provider</label>
                        <select
                          value={selectedClinic.payment_gateway_provider || 'esewa'}
                          onChange={e => setSelectedClinic({ ...selectedClinic, payment_gateway_provider: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                        >
                          <option value="esewa">eSewa</option>
                          <option value="khalti">Khalti</option>
                          <option value="fonepay">Fonepay</option>
                          <option value="connectips">ConnectIPS</option>
                          <option value="custom">Custom Merchant API</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Merchant ID / Code</label>
                        <input
                          type="text"
                          value={selectedClinic.merchant_id || ''}
                          onChange={e => setSelectedClinic({ ...selectedClinic, merchant_id: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono"
                          placeholder="e.g. EPAYTEST"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">API Public Key</label>
                        <input
                          type="text"
                          value={selectedClinic.payment_api_key || ''}
                          onChange={e => setSelectedClinic({ ...selectedClinic, payment_api_key: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono"
                          placeholder="Live or sandbox public API key"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">API Secret Key</label>
                        <input
                          type="password"
                          value={selectedClinic.payment_secret_key || ''}
                          onChange={e => setSelectedClinic({ ...selectedClinic, payment_secret_key: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono"
                          placeholder="Secret / hash private key"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={selectedClinic.latitude}
                      onChange={e => setSelectedClinic({ ...selectedClinic, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={selectedClinic.longitude}
                      onChange={e => setSelectedClinic({ ...selectedClinic, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Auto-Alert Threshold</label>
                    <input
                      type="number"
                      value={selectedClinic.auto_notify_threshold}
                      onChange={e => setSelectedClinic({ ...selectedClinic, auto_notify_threshold: parseInt(e.target.value) || 2 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Description / Notes</label>
                  <textarea
                    rows={2}
                    value={selectedClinic.description || ''}
                    onChange={e => setSelectedClinic({ ...selectedClinic, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Clinic Photos Gallery */}
                {(() => {
                  const pics = resolvePictures(selectedClinic)
                  return (
                    <div className="space-y-2 pt-1 border-t border-slate-700/60">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-indigo-400" />
                          Clinic Picture Gallery ({pics.length})
                        </label>
                        {selectedClinic.registration_doc_url && (
                          selectedClinic.registration_doc_url.startsWith('http') ? (
                            <a
                              href={selectedClinic.registration_doc_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5" /> View Registration Doc <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-amber-400 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> Registration Doc Attached
                            </span>
                          )
                        )}
                      </div>
                      {pics.length === 0 ? (
                        <div className="text-xs text-slate-500 bg-slate-900/40 p-3 rounded-xl border border-slate-700/50">
                          No clinic photos uploaded yet. When the clinic uploads pictures via their app, they appear here.
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3">
                          {pics.map((picUrl, idx) => (
                            <div
                              key={idx}
                              onClick={() => setPreviewImage(picUrl)}
                              className="w-20 h-20 rounded-xl border border-slate-700 overflow-hidden bg-slate-900 cursor-pointer hover:border-indigo-500 transition group relative"
                            >
                              <img
                                src={picUrl}
                                alt={`Clinic ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none'
                                }}
                              />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Clinic Information'}
                  </button>
                </div>
              </form>
            </div>

            {/* Services & Pricing Manager */}
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-lg text-white mb-2">Services & Pricing Catalog</h3>
              <p className="text-xs text-slate-400 mb-4">
                Manage the full list of clinical services, diagnostic tests, and procedures offered by {selectedClinic.name}.
              </p>

              {/* Add Service Form */}
              <form onSubmit={handleAddService} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 mb-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Service name (e.g., Blood Sugar Fasting)"
                      value={newServiceName}
                      onChange={e => setNewServiceName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newServiceDesc}
                      onChange={e => setNewServiceDesc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      placeholder="Price (Rs.)"
                      value={newServicePrice}
                      onChange={e => setNewServicePrice(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Service to Clinic
                  </button>
                </div>
              </form>

              {/* Services List */}
              <div className="space-y-2">
                {services.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-700/50">
                    No services configured for this clinic yet. Add one above!
                  </div>
                ) : (
                  services.map(service => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-700/60"
                    >
                      <div>
                        <div className="font-semibold text-sm text-white">{service.service_name}</div>
                        {service.description && (
                          <div className="text-xs text-slate-400 mt-0.5">{service.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm text-emerald-400">
                          Rs. {service.price?.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Remove Service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Full-screen Photo Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Photo Preview</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[80vh]">
              <img src={previewImage} alt="Full preview" className="max-h-[75vh] max-w-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
