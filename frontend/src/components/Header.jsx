export default function Header() {
  return (
    <header className="bg-gradient-to-r from-indigo-700 to-indigo-500 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
            <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-8 13H7v-7h4v7zm-2-8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm10 8.5h-4v-3.5c0-1-.4-1.5-1.1-1.5-.8 0-1.4.6-1.4 1.5V16h-4V9h4v1.1c.5-.8 1.4-1.4 2.5-1.4 2 0 4 1.3 4 4.1V16z" />
          </svg>
        </div>
        <div>
          <h1 className="text-white font-bold text-xl leading-tight">CRM LinkedIn</h1>
          <p className="text-indigo-200 text-xs">Contact relationship manager</p>
        </div>
      </div>
    </header>
  )
}
