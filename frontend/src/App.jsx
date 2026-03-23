import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import StatsBar from './components/StatsBar'
import ContactCard from './components/ContactCard'
import ContactModal from './components/ContactModal'
import { Plus, Search, Filter, Upload } from 'lucide-react'

const SOURCE_OPTIONS = ['', 'Phone', 'WhatsApp', 'Email', 'LinkedIn', 'Instagram']
const TYPE_OPTIONS = ['', 'Leak', 'Faucet', 'Cold']

export default function App() {
  const [contacts, setContacts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editContact, setEditContact] = useState(null)
  const [enrichingId, setEnrichingId] = useState(null)
  const [importMsg, setImportMsg] = useState('')

  const fetchContacts = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterSource) params.set('source', filterSource)
    if (filterType) params.set('type', filterType)
    const res = await fetch(`/api/contacts?${params}`)
    const data = await res.json()
    setContacts(data)
    setLoading(false)
  }, [search, filterSource, filterType])

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats')
    const data = await res.json()
    setStats(data)
  }, [])

  useEffect(() => {
    fetchContacts()
    fetchStats()
  }, [fetchContacts, fetchStats])

  const handleSave = async (contact) => {
    const method = contact.id ? 'PUT' : 'POST'
    const url = contact.id ? `/api/contacts/${contact.id}` : '/api/contacts'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    })
    if (res.ok) {
      setModalOpen(false)
      setEditContact(null)
      fetchContacts()
      fetchStats()
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    fetchContacts()
    fetchStats()
  }

  const handleEnrich = async (id) => {
    setEnrichingId(id)
    const res = await fetch(`/api/enrich/${id}`, { method: 'POST' })
    const data = await res.json()
    setEnrichingId(null)
    fetchContacts()
    fetchStats()
    if (data.results) {
      const msgs = []
      if (data.results.linkedin?.success) msgs.push('LinkedIn enriched')
      else if (data.results.linkedin?.error) msgs.push(`LinkedIn: ${data.results.linkedin.error}`)
      if (data.results.website?.success) msgs.push('Website enriched')
      else if (data.results.website?.error) msgs.push(`Website: ${data.results.website.error}`)
      if (msgs.length) alert(msgs.join('\n'))
    }
  }

  const handleEdit = (contact) => {
    setEditContact(contact)
    setModalOpen(true)
  }

  const handleNew = () => {
    setEditContact(null)
    setModalOpen(true)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setImportMsg('Importing...')
    const res = await fetch('/api/import/csv', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.imported !== undefined) {
      setImportMsg(`Imported ${data.imported} contacts`)
      fetchContacts()
      fetchStats()
    } else {
      setImportMsg(`Error: ${data.error}`)
    }
    setTimeout(() => setImportMsg(''), 4000)
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {stats && <StatsBar stats={stats} />}

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm py-2 px-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Sources</option>
              {SOURCE_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm py-2 px-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Types</option>
              {TYPE_OPTIONS.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Import CSV */}
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            <Upload className="w-4 h-4" />
            Import CSV
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          {importMsg && <span className="text-sm text-indigo-600">{importMsg}</span>}

          {/* Add Contact */}
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 text-lg font-medium">No contacts yet</p>
            <p className="text-gray-400 text-sm mt-1">Add a contact or import a CSV to get started</p>
            <button
              onClick={handleNew}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 transition mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add First Contact
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {contacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onEnrich={handleEnrich}
                enriching={enrichingId === contact.id}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <ContactModal
          contact={editContact}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditContact(null) }}
        />
      )}
    </div>
  )
}
