import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

function getRiskColor(score) {
  if (score >= 70) return '#ef4444'
  if (score >= 40) return '#f59e0b'
  return '#22c55e'
}

function getRiskLabel(score) {
  if (score >= 70) return 'HIGH RISK'
  if (score >= 40) return 'MEDIUM RISK'
  return 'LOW RISK'
}

function getRiskBadgeClass(score) {
  if (score >= 70) return 'bg-red-600 text-white'
  if (score >= 40) return 'bg-yellow-500 text-black'
  return 'bg-green-600 text-white'
}

export default function Map() {
  const [buildings, setBuildings] = useState([])
  const [selected, setSelected] = useState(null)
  const [brief, setBrief] = useState('')
  const [loadingBrief, setLoadingBrief] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchBuildings = async () => {
      const snapshot = await getDocs(collection(db, 'buildings'))
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setBuildings(data)
    }
    fetchBuildings()
  }, [])

  const filteredBuildings = buildings.filter(b => {
    if (filter === 'high') return b.risk_score >= 70
    if (filter === 'medium') return b.risk_score >= 40 && b.risk_score < 70
    if (filter === 'low') return b.risk_score < 40
    return true
  })

  const generateRuleBasedBrief = (b) => {
    const reasons = []
    if (b.noc_status === 'expired') {
      reasons.push(`its fire NOC has been expired for ${Math.abs(b.noc_expiry_days)} days, meaning it is operating without current fire department clearance`)
    } else if (b.noc_status === 'applied') {
      reasons.push('its fire NOC renewal is still pending approval')
    }
    if (!b.sprinkler_present) {
      reasons.push('it has no active sprinkler system, which significantly increases fire spread speed in an emergency')
    }
    if (b.age_years > 40) {
      reasons.push(`at ${b.age_years} years old, its electrical wiring and structural materials likely predate modern fire safety codes`)
    }
    if (b.complaints_last_3yrs > 4) {
      reasons.push(`it has accumulated ${b.complaints_last_3yrs} safety complaints in the last 3 years, indicating a pattern of unresolved risk`)
    }
    if (b.construction_type === 'brick') {
      reasons.push('its brick construction offers less fire resistance than modern RCC structures')
    }

    const reasonText = reasons.length > 0
      ? reasons.slice(0, 3).join('; ')
      : 'it shows no major compliance red flags based on available records'

    const networkNote = b.risk_score >= 70
      ? `In a fire scenario at this building, expect rapid network congestion as occupants and bystanders simultaneously attempt emergency calls — communication infrastructure should be assumed unreliable within the first 5-10 minutes.`
      : `Network infrastructure risk during an emergency here is comparatively lower given the building's profile, but redundant communication channels remain advisable.`

    return `This building carries a risk score of ${b.risk_score}/100, primarily because ${reasonText}. ${networkNote} Recommended action: ${b.risk_score >= 70 ? 'schedule an immediate inspection and prioritize NOC renewal' : 'continue routine monitoring per standard inspection cycle'}.`
  }

  const generateBrief = async (building) => {
    setLoadingBrief(true)
    setBrief('')
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a fire safety officer in Mumbai. Give a 3-sentence risk assessment for this building. Be specific and direct. Building data: Name: ${building.name}, Address: ${building.address}, Age: ${building.age_years} years, Floors: ${building.floors}, Type: ${building.occupancy_type}, Construction: ${building.construction_type}, Fire NOC Status: ${building.noc_status}, Complaints in last 3 years: ${building.complaints_last_3yrs}, Sprinkler system: ${building.sprinkler_present ? 'Present' : 'Absent'}, Risk Score: ${building.risk_score}/100. Also mention the network/communication risk during a fire emergency at this building.`
              }]
            }]
          })
        }
      )
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (text) {
        setBrief(text)
      } else {
        setBrief(generateRuleBasedBrief(building))
      }
    } catch (error) {
      setBrief(generateRuleBasedBrief(building))
    }
    setLoadingBrief(false)
  }

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Left Panel */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
        {/* Stats */}
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg mb-3">Mumbai Building Risk</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-red-900/40 rounded-lg p-2 text-center">
              <div className="text-red-400 font-bold text-xl">
                {buildings.filter(b => b.risk_score >= 70).length}
              </div>
              <div className="text-red-300 text-xs">High Risk</div>
            </div>
            <div className="bg-yellow-900/40 rounded-lg p-2 text-center">
              <div className="text-yellow-400 font-bold text-xl">
                {buildings.filter(b => b.risk_score >= 40 && b.risk_score < 70).length}
              </div>
              <div className="text-yellow-300 text-xs">Medium</div>
            </div>
            <div className="bg-green-900/40 rounded-lg p-2 text-center">
              <div className="text-green-400 font-bold text-xl">
                {buildings.filter(b => b.risk_score < 40).length}
              </div>
              <div className="text-green-300 text-xs">Low Risk</div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex gap-2 flex-wrap">
            {['all', 'high', 'medium', 'low'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  filter === f
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Building List */}
        <div className="flex-1 overflow-y-auto">
          {filteredBuildings
            .sort((a, b) => b.risk_score - a.risk_score)
            .map(building => (
              <div
                key={building.id}
                onClick={() => { setSelected(building); setBrief('') }}
                className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-all ${
                  selected?.id === building.id ? 'bg-gray-800 border-l-2 border-l-red-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium truncate flex-1">
                    {building.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-2 font-bold ${getRiskBadgeClass(building.risk_score)}`}>
                    {building.risk_score}
                  </span>
                </div>
                <div className="text-gray-500 text-xs truncate">{building.ward}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[19.0760, 72.8777]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredBuildings.map(building => (
            <CircleMarker
              key={building.id}
              center={[building.lat, building.lng]}
              radius={building.risk_score >= 70 ? 14 : building.risk_score >= 40 ? 10 : 8}
              fillColor={getRiskColor(building.risk_score)}
              color={getRiskColor(building.risk_score)}
              weight={2}
              opacity={1}
              fillOpacity={0.8}
              eventHandlers={{
                click: () => { setSelected(building); setBrief('') }
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Right Panel - Building Detail */}
      {selected && (
        <div className="w-96 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-white font-bold text-base">{selected.name}</h3>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-500 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Risk Score Banner */}
          <div className={`mx-4 mt-4 rounded-xl p-4 text-center ${
            selected.risk_score >= 70
              ? 'bg-red-900/50 border border-red-700'
              : selected.risk_score >= 40
              ? 'bg-yellow-900/50 border border-yellow-700'
              : 'bg-green-900/50 border border-green-700'
          }`}>
            <div className={`text-4xl font-black ${
              selected.risk_score >= 70 ? 'text-red-400' :
              selected.risk_score >= 40 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {selected.risk_score}
            </div>
            <div className="text-gray-300 text-sm">Risk Score / 100</div>
            <div className={`text-xs font-bold mt-1 ${
              selected.risk_score >= 70 ? 'text-red-400' :
              selected.risk_score >= 40 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {getRiskLabel(selected.risk_score)}
            </div>
          </div>

          {/* Details */}
          <div className="p-4 space-y-2">
            {[
              ['📍 Address', selected.address],
              ['🏢 Ward', selected.ward],
              ['📅 Building Age', `${selected.age_years} years`],
              ['🏗️ Floors', selected.floors],
              ['🏠 Occupancy', selected.occupancy_type],
              ['🧱 Construction', selected.construction_type],
              ['📋 Fire NOC', selected.noc_status.toUpperCase()],
              ['⚠️ Complaints (3yr)', selected.complaints_last_3yrs],
              ['🚿 Sprinklers', selected.sprinkler_present ? '✅ Present' : '❌ Absent'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className={`text-white font-medium ${
                  label === '📋 Fire NOC' && selected.noc_status === 'expired'
                    ? 'text-red-400' : ''
                }`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* AI Brief */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => generateBrief(selected)}
              disabled={loadingBrief}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loadingBrief ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Generating AI Brief...
                </>
              ) : (
                <>✨ Generate AI Risk Brief</>
              )}
            </button>

            {brief && (
              <div className="mt-3 bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="text-red-400 text-xs font-bold mb-2">🤖 AI RISK ASSESSMENT</div>
                <p className="text-gray-200 text-sm leading-relaxed">{brief}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}