export default function StatsBar({ stats }) {
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const tiles = [
    { label: 'Total Contacts', value: stats.total, color: 'text-indigo-600' },
    { label: 'Responded', value: stats.responded, color: 'text-emerald-600' },
    { label: 'Loom Sent', value: stats.loomSent, color: 'text-amber-600' },
    { label: 'Sales Calls', value: stats.salesCalls, color: 'text-blue-600' },
    { label: 'Pipeline Revenue', value: fmt(stats.revenue), color: 'text-violet-600' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {tiles.map(t => (
          <div key={t.label} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 text-center">
            <div className={`text-2xl font-bold ${t.color}`}>{t.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{t.label}</div>
          </div>
        ))}
      </div>
      {!stats.proxycurlEnabled && (
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          LinkedIn enrichment is disabled. Add <code className="font-mono">PROXYCURL_API_KEY</code> to your <code className="font-mono">.env</code> file to auto-fill LinkedIn data.
          Get a free key at <strong>nubela.co/proxycurl</strong>
        </div>
      )}
    </div>
  )
}
