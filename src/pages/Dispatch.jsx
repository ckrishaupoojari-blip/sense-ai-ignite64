import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'

const SPREAD_STAGES = [
  { stage: 0, blocked: [], description: 'No active fire' },
  { stage: 1, blocked: ['R3'], description: 'Fire confirmed at Server Room' },
  { stage: 2, blocked: ['R3', 'J1'], description: 'Fire spreading — Junction A blocked' },
  { stage: 3, blocked: ['R3', 'J1', 'R2'], description: 'Fire reached Computer Centre corridor' },
  { stage: 4, blocked: ['R3', 'J1', 'R2', 'R1'], description: 'Fire spreading — OS Lab threatened' },
]

export default function Dispatch() {
  const [incident, setIncident] = useState(null)
  const [currentStage, setCurrentStage] = useState(0)
  const [occupants, setOccupants] = useState([])
  const [alertShown, setAlertShown] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'incidents', 'active_incident'), (snap) => {
      if (snap.exists()) {
        setIncident(snap.data())
        setCurrentStage(snap.data().stage || 0)
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'occupant_sessions', 'placeholder'),
      () => {}
    )
    // Listen to all occupant sessions
    import('firebase/firestore').then(({ collection, onSnapshot: onSnap }) => {
      const unsub2 = onSnap(collection(db, 'occupant_sessions'), (snap) => {
        setOccupants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      })
      return () => unsub2()
    })
    return () => unsub()
  }, [])

  const triggerFire = async () => {
    await setDoc(doc(db, 'incidents', 'active_incident'), {
      active: true,
      stage: 1,
      blockedNodes: SPREAD_STAGES[1].blocked,
      description: SPREAD_STAGES[1].description,
      triggeredAt: new Date(),
      building: 'SIES Graduate School of Technology',
      floor: '3rd Floor',
      origin: 'Server Room',
      city: 'Mumbai'
    })
    setAlertShown(true)
  }

  const advanceSpread = async () => {
    const nextStage = Math.min(currentStage + 1, SPREAD_STAGES.length - 1)
    await setDoc(doc(db, 'incidents', 'active_incident'), {
      active: true,
      stage: nextStage,
      blockedNodes: SPREAD_STAGES[nextStage].blocked,
      description: SPREAD_STAGES[nextStage].description,
      triggeredAt: incident?.triggeredAt || new Date(),
      building: 'SIES Graduate School of Technology',
      floor: '3rd Floor',
      origin: 'Server Room',
      city: 'Mumbai'
    })
  }

  const resetIncident = async () => {
    await setDoc(doc(db, 'incidents', 'active_incident'), {
      active: false,
      stage: 0,
      blockedNodes: [],
      description: 'No active fire',
    })
    setAlertShown(false)
  }

  const isActive = incident?.active || false
  const safeCount = occupants.filter(o => o.status === 'safe').length
  const helpCount = occupants.filter(o => o.status === 'needs_help').length
  const activeCount = occupants.filter(o => o.status === 'active').length

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white mb-1">
            📡 Multi-Agency Dispatch Board
          </h1>
          <p className="text-gray-400">
            SenseAI — Real-time emergency coordination for Mumbai buildings
          </p>
        </div>

        {/* Fire Control Panel */}
        <div className={`rounded-2xl p-6 mb-6 border-2 ${
          isActive
            ? 'bg-red-950 border-red-600'
            : 'bg-gray-900 border-gray-700'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-bold text-xl">
                {isActive ? '🔥 INCIDENT ACTIVE' : '✅ No Active Incident'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {incident?.description || 'System monitoring all buildings'}
              </p>
              {isActive && (
                <p className="text-red-400 text-sm font-bold mt-1">
                  📍 {incident?.building} — {incident?.floor} — Origin: {incident?.origin}
                </p>
              )}
            </div>
            <div className={`text-6xl font-black ${isActive ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
              {isActive ? '🚨' : '🛡️'}
            </div>
          </div>

          {/* Fire Spread Stages */}
          {isActive && (
            <div className="mb-4">
              <div className="flex gap-2 mb-3">
                {SPREAD_STAGES.slice(1).map((s) => (
                  <div
                    key={s.stage}
                    className={`flex-1 h-2 rounded-full ${
                      currentStage >= s.stage ? 'bg-red-500' : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-yellow-400 text-sm font-medium">
                Stage {currentStage}/4 — {SPREAD_STAGES[currentStage]?.description}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Blocked zones: {SPREAD_STAGES[currentStage]?.blocked.join(', ') || 'None'}
              </p>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            {!isActive ? (
              <button
                onClick={triggerFire}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all text-lg"
              >
                🔥 TRIGGER FIRE — Server Room
              </button>
            ) : (
              <>
                <button
                  onClick={advanceSpread}
                  disabled={currentStage >= SPREAD_STAGES.length - 1}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                >
                  📈 Advance Fire Spread (Stage {currentStage} → {Math.min(currentStage + 1, 4)})
                </button>
                <button
                  onClick={resetIncident}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                >
                  ✅ Reset Incident
                </button>
              </>
            )}
          </div>
        </div>

        {/* Simulated Alert Banner */}
        {alertShown && (
          <div className="bg-green-900/40 border border-green-700 rounded-2xl p-4 mb-6">
            <div className="text-green-400 font-bold mb-2">
              📲 Simulated Alerts Sent (Production: via Twilio WhatsApp + SMS)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  agency: '🚒 Mumbai Fire Brigade',
                  msg: 'FIRE ALERT: SIES GST, 3rd Floor, Server Room. 6 occupants registered. Proceed via Sion-Trombay Road.',
                  color: 'border-red-700 bg-red-900/20'
                },
                {
                  agency: '🏥 Sion Hospital',
                  msg: 'Possible casualties from electrical fire. Burns/smoke inhalation. Prepare emergency bay. ETA: 8 mins.',
                  color: 'border-blue-700 bg-blue-900/20'
                },
                {
                  agency: '🏛️ British High Commission',
                  msg: '1 foreign national registered in building. Incident active at SIES GST Mumbai. Tracking for updates.',
                  color: 'border-yellow-700 bg-yellow-900/20'
                }
              ].map(alert => (
                <div key={alert.agency} className={`rounded-xl p-3 border ${alert.color}`}>
                  <div className="text-white font-bold text-sm mb-1">{alert.agency}</div>
                  <div className="text-gray-300 text-xs">{alert.msg}</div>
                  <div className="text-green-400 text-xs mt-2">✓ Delivered</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agency Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Fire Department */}
          <div className={`rounded-2xl p-4 border ${
            isActive ? 'bg-red-900/20 border-red-700' : 'bg-gray-900 border-gray-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🚒</span>
              <div>
                <div className="text-white font-bold">Mumbai Fire Brigade</div>
                <div className={`text-xs font-medium ${isActive ? 'text-red-400' : 'text-gray-500'}`}>
                  {isActive ? '🔴 DISPATCHED' : '🟢 ON STANDBY'}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Building</span>
                <span className="text-white text-xs">SIES GST, Sion</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Floor</span>
                <span className="text-white">3rd Floor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fire Origin</span>
                <span className="text-red-400 font-bold">Server Room</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Spread Stage</span>
                <span className={`font-bold ${isActive ? 'text-orange-400' : 'text-gray-500'}`}>
                  {isActive ? `${currentStage}/4` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Access Route</span>
                <span className="text-white text-xs">Sion-Trombay Rd</span>
              </div>
            </div>
          </div>

          {/* Hospital */}
          <div className={`rounded-2xl p-4 border ${
            isActive ? 'bg-blue-900/20 border-blue-700' : 'bg-gray-900 border-gray-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏥</span>
              <div>
                <div className="text-white font-bold">Sion Hospital</div>
                <div className={`text-xs font-medium ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>
                  {isActive ? '🔵 ALERTED' : '🟢 NORMAL OPS'}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Injury Type</span>
                <span className="text-white text-xs">Burns / Smoke</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Est. Casualties</span>
                <span className={`font-bold ${isActive ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {isActive ? `${helpCount + activeCount} at risk` : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Distance</span>
                <span className="text-white">2.1 km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ETA</span>
                <span className={isActive ? 'text-blue-400 font-bold' : 'text-gray-500'}>
                  {isActive ? '~8 mins' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Burns Beds</span>
                <span className="text-green-400">6 available</span>
              </div>
            </div>
          </div>

          {/* Embassy */}
          <div className={`rounded-2xl p-4 border ${
            isActive ? 'bg-yellow-900/20 border-yellow-700' : 'bg-gray-900 border-gray-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏛️</span>
              <div>
                <div className="text-white font-bold">British High Commission</div>
                <div className={`text-xs font-medium ${isActive ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {isActive ? '🟡 NOTIFIED' : '⚪ MONITORING'}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Nationals at Risk</span>
                <span className={`font-bold ${isActive ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {isActive ? '1 registered' : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-white text-xs">
                  {isActive ? 'Tracking' : 'No incident'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Alert Sent</span>
                <span className={isActive ? 'text-green-400' : 'text-gray-500'}>
                  {isActive ? '✓ Yes' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">MEA Notified</span>
                <span className={isActive ? 'text-green-400' : 'text-gray-500'}>
                  {isActive ? '✓ Yes' : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Occupant Status */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700">
          <h3 className="text-white font-bold mb-4">
            👥 Registered Occupants — 3rd Floor
          </h3>
          {occupants.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No occupants registered yet. Go to the Evacuate page and register a room to see occupants here.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-3 text-center">
                <div className="text-yellow-400 font-black text-2xl">{activeCount}</div>
                <div className="text-yellow-300 text-xs">Active / Unaccounted</div>
              </div>
              <div className="bg-green-900/30 border border-green-700 rounded-xl p-3 text-center">
                <div className="text-green-400 font-black text-2xl">{safeCount}</div>
                <div className="text-green-300 text-xs">Marked Safe</div>
              </div>
              <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-center">
                <div className="text-red-400 font-black text-2xl">{helpCount}</div>
                <div className="text-red-300 text-xs">Need Rescue</div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {occupants.map(occ => (
              <div key={occ.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                occ.status === 'safe' ? 'bg-green-900/20 border-green-800' :
                occ.status === 'needs_help' ? 'bg-red-900/20 border-red-800' :
                'bg-gray-800 border-gray-700'
              }`}>
                <div>
                  <div className="text-white text-sm font-medium">
                    {occ.roomLabel || occ.room}
                  </div>
                  <div className="text-gray-500 text-xs">{occ.floor}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  occ.status === 'safe' ? 'bg-green-600 text-white' :
                  occ.status === 'needs_help' ? 'bg-red-600 text-white animate-pulse' :
                  'bg-yellow-600 text-black'
                }`}>
                  {occ.status === 'safe' ? '✅ SAFE' :
                   occ.status === 'needs_help' ? '🆘 NEEDS RESCUE' :
                   '⚠️ UNACCOUNTED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}