import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '🗺️ Risk Map' },
    { path: '/evacuate', label: '🚨 Evacuate' },
    { path: '/dispatch', label: '📡 Dispatch' },
  ]

  return (
    <nav className="bg-gray-900 border-b border-red-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-red-500 text-2xl">🔥</span>
        <span className="text-white font-bold text-xl tracking-tight">
          Sense<span className="text-red-500">AI</span>
        </span>
        <span className="text-gray-500 text-sm ml-2">
          Emergency Communication Resilience
        </span>
      </div>
      <div className="flex gap-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              location.pathname === item.path
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default Navbar