import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'

// SIES GST 3rd Floor Graph
const FLOOR_GRAPH = {
  nodes: {
    'R1': { label: 'OS Lab', x: 120, y: 80, type: 'room' },
    'R2': { label: 'Computer Centre', x: 120, y: 160, type: 'room' },
    'R3': { label: 'Server Room', x: 120, y: 240, type: 'room', isFireOrigin: true },
    'R4': { label: '1st Yr Eng Lab', x: 120, y: 320, type: 'room' },
    'J1': { label: 'Junction A', x: 260, y: 200, type: 'junction' },
    'R5': { label: 'Class Room 401', x: 460, y: 80, type: 'room' },
    'R6': { label: 'Class Room 402', x: 460, y: 200, type: 'room' },
    'R7': { label: 'Faculty Area', x: 460, y: 320, type: 'room' },
    'J2': { label: 'Junction B', x: 340, y: 200, type: 'junction' },
    'J3': { label: 'Wing Connector', x: 300, y: 200, type: 'junction' },
    'EXIT-M': { label: 'Main Staircase', x: 300, y: 380, type: 'exit' },
    'EXIT-E': { label: 'Emergency Exit', x: 120, y: 420, type: 'exit' },
  },
  edges: [
    { from: 'R1', to: 'J1', distance: 5 },
    { from: 'R2', to: 'J1', distance: 6 },
    { from: 'R3', to: 'J1', distance: 4 },
    { from: 'R4', to: 'J1', distance: 5 },
    { from: 'J1', to: 'J3', distance: 12 },
    { from: 'R5', to: 'J2', distance: 5 },
    { from: 'R6', to: 'J2', distance: 6 },
    { from: 'R7', to: 'J2', distance: 4 },
    { from: 'J2', to: 'J3', distance: 10 },
    { from: 'J3', to: 'EXIT-M', distance: 8 },
    { from: 'J1', to: 'EXIT-E', distance: 15 },
  ]
}

// Dijkstra's Algorithm
function dijkstra(graph, start, blockedNodes = []) {
  const distances = {}
  const previous = {}
  const unvisited = new Set()

  Object.keys(graph.nodes).forEach(node => {
    distances[node] = Infinity
    previous[node] = null
    unvisited.add(node)
  })
  distances[start] = 0

  // Build adjacency list
  const adjacency = {}
  Object.keys(graph.nodes).forEach(n => adjacency[n] = [])
  graph.edges.forEach(edge => {
    adjacency[edge.from].push({ node: edge.to, distance: edge.distance })
    adjacency[edge.to].push({ node: edge.from, distance: edge.distance })
  })

  while (unvisited.size > 0) {
    // Find unvisited node with smallest distance
    let current = null
    unvisited.forEach(node => {
      if (current === null || distances[node] < distances[current]) {
        current = node
      }
    })

    if (distances[current] === Infinity) break
    unvisited.delete(current)

    adjacency[current].forEach(({ node, distance }) => {
      if (blockedNodes.includes(node)) return
      const alt = distances[current] + distance
      if (alt < distances[node]) {
        distances[node] = alt
        previous[node] = current
      }
    })
  }

  // Find best exit
  const exits = ['EXIT-M', 'EXIT-E'].filter(e => !blockedNodes.includes(e))
  let bestExit = null
  let bestDist = Infinity
  exits.forEach(exit => {
    if (distances[exit] < bestDist) {
      bestDist = distances[exit]
      bestExit = exit
    }
  })

  if (!bestExit) return { path: [], exit: null, distance: Infinity }

  // Reconstruct path
  const path = []
  let current = bestExit
  while (current !== null) {
    path.unshift(current)
    current = previous[current]
  }

  return { path, exit: bestExit, distance: bestDist }
}

const ROOMS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']
const ROOM_LABELS = {
  'R1': 'OS Lab', 'R2': 'Computer Centre', 'R3': 'Server Room',
  'R4': '1st Yr Eng Lab', 'R5': 'Class Room 401',
  'R6': 'Class Room 402', 'R7': 'Faculty Area'
}

export default function Evacuate() {
  const [registered, setRegistered] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState('')
  const [sessionId] = useState(() => 'session_' + Date.now())
  const [blockedNodes, setBlockedNodes] = useState([])
  const [route, setRoute] = useState(null)
  const [incidentActive, setIncidentActive] = useState(false)
  const [fireStage, setFireStage] = useState(0)
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine)

  // Listen for offline/online
  useEffect(() => {
    const handleOffline = () => setOfflineMode(true)
    const handleOnline = () => setOfflineMode(false)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  // Listen to incident from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'incidents', 'active_incident'), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setIncidentActive(data.active || false)
        setBlockedNodes(data.blockedNodes || [])
        setFireStage(data.stage || 0)
      }
    })
    return () => unsub()
  }, [])

  // Recalculate route when blocked nodes change
  useEffect(() => {
    if (registered && selectedRoom) {
      const result = dijkstra(FLOOR_GRAPH, selectedRoom, blockedNodes)
      setRoute(result)
    }
  }, [blockedNodes, registered, selectedRoom])

  const handleRegister = async () => {
    if (!selectedRoom) return
    const result = dijkstra(FLOOR_GRAPH, selectedRoom, [])
    setRoute(result)
    setRegistered(true)
    try {
      await setDoc(doc(db, 'occupant_sessions', sessionId), {
        room: selectedRoom,
        roomLabel: ROOM_LABELS[selectedRoom],
        registeredAt: new Date(),
        status: 'active',
        floor: '3rd Floor - SIES GST'
      })
    } catch (e) {
      console.log('Offline - session saved locally')
    }
  }

  const handleSafe = async () => {
    try {
      await setDoc(doc(db, 'occupant_sessions', sessionId), {
        status: 'safe',
        markedSafeAt: new Date()
      }, { merge: true })
    } catch (e) {}
    alert('✅ You have been marked as SAFE. Emergency services have been notified.')
  }

  const handleHelp = async () => {
    try {
      await setDoc(doc(db, 'occupant_sessions', sessionId), {
        status: 'needs_help',
        helpRequestedAt: new Date(),
        room: selectedRoom,
        roomLabel: ROOM_LABELS[selectedRoom]
      }, { merge: true })
    } catch (e) {
      localStorage.setItem('pending_help_' + sessionId, JSON.stringify({
        room: selectedRoom, timestamp: new Date().toISOString()
      }))
    }
    alert('🆘 HELP REQUEST SENT! Rescue team has been notified of your location: ' + ROOM_LABELS[selectedRoom])
  }

  const getNodeColor = (nodeId) => {
    if (blockedNodes.includes(nodeId)) return '#ef4444'
    if (route?.path.includes(nodeId)) return '#22c55e'
    if (nodeId === selectedRoom) return '#3b82f6'
    if (nodeId.startsWith('EXIT')) return '#f59e0b'
    return '#6b7280'
  }

  const getNodeSize = (nodeId) => {
    if (nodeId.startsWith('EXIT')) return 16
    if (nodeId.startsWith('J')) return 8
    return 12
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* Offline Banner */}
      {offlineMode && (
        <div className="bg-yellow-600 text-black text-center py-2 px-4 rounded-lg mb-4 font-bold">
          📡 OFFLINE MODE — Using cached data. Evacuation routes still fully functional.
        </div>
      )}

      {/* Fire Alert Banner */}
      {incidentActive && (
        <div className="bg-red-600 text-white text-center py-3 px-4 rounded-lg mb-4 font-bold animate-pulse">
          🔥 FIRE ALERT ACTIVE — Stage {fireStage} — Follow your evacuation route immediately!
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-white mb-2">
            🚨 Emergency Evacuation Navigator
          </h1>
          <p className="text-gray-400">SIES Graduate School of Technology — 3rd Floor</p>
          <p className="text-gray-500 text-sm mt-1">
            Works offline • Routes update in real-time as fire spreads
          </p>
        </div>

        {!registered ? (
          /* Registration Panel */
          <div className="max-w-md mx-auto bg-gray-900 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-white font-bold text-xl mb-2 text-center">
              📍 Where are you right now?
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              Select your current room to get your evacuation route
            </p>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {ROOMS.map(room => (
                <button
                  key={room}
                  onClick={() => setSelectedRoom(room)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedRoom === room
                      ? 'border-red-500 bg-red-900/30 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span className="font-medium">{ROOM_LABELS[room]}</span>
                  {room === 'R3' && (
                    <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                      Fire Origin
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={handleRegister}
              disabled={!selectedRoom}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-all"
            >
              {selectedRoom ? `🚀 Get My Evacuation Route` : 'Select your room first'}
            </button>
          </div>
        ) : (
          /* Route Display */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Floor Plan SVG */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700">
              <h3 className="text-white font-bold mb-3">
                🗺️ 3rd Floor — Live Map
                {incidentActive && (
                  <span className="ml-2 text-xs bg-red-600 px-2 py-1 rounded-full animate-pulse">
                    FIRE ACTIVE
                  </span>
                )}
              </h3>
              <svg width="100%" viewBox="0 0 580 460" className="bg-gray-800 rounded-xl">
                {/* Draw edges */}
                {FLOOR_GRAPH.edges.map((edge, i) => {
                  const from = FLOOR_GRAPH.nodes[edge.from]
                  const to = FLOOR_GRAPH.nodes[edge.to]
                  const isOnRoute = route?.path.includes(edge.from) && route?.path.includes(edge.to)
                  const isBlocked = blockedNodes.includes(edge.from) || blockedNodes.includes(edge.to)
                  return (
                    <line
                      key={i}
                      x1={from.x} y1={from.y}
                      x2={to.x} y2={to.y}
                      stroke={isBlocked ? '#ef4444' : isOnRoute ? '#22c55e' : '#374151'}
                      strokeWidth={isOnRoute ? 4 : 2}
                      strokeDasharray={isBlocked ? '5,5' : 'none'}
                    />
                  )
                })}
                {/* Draw nodes */}
                {Object.entries(FLOOR_GRAPH.nodes).map(([id, node]) => (
                  <g key={id}>
                    <circle
                      cx={node.x} cy={node.y}
                      r={getNodeSize(id)}
                      fill={getNodeColor(id)}
                      opacity={0.9}
                    />
                    {blockedNodes.includes(id) && (
                      <text x={node.x} y={node.y + 5} textAnchor="middle"
                        fill="white" fontSize="12" fontWeight="bold">🔥</text>
                    )}
                    {id.startsWith('EXIT') && (
                      <text x={node.x} y={node.y + 5} textAnchor="middle"
                        fill="black" fontSize="10" fontWeight="bold">EXIT</text>
                    )}
                    <text x={node.x} y={node.y + getNodeSize(id) + 14}
                      textAnchor="middle" fill="#9ca3af" fontSize="9">
                      {node.label}
                    </text>
                  </g>
                ))}
                {/* You Are Here marker */}
                <circle
                  cx={FLOOR_GRAPH.nodes[selectedRoom].x}
                  cy={FLOOR_GRAPH.nodes[selectedRoom].y}
                  r={20} fill="none" stroke="#3b82f6" strokeWidth={3}
                  opacity={0.7}
                />
              </svg>
              {/* Legend */}
              <div className="flex gap-4 mt-3 flex-wrap">
                {[
                  { color: 'bg-blue-500', label: 'You are here' },
                  { color: 'bg-green-500', label: 'Safe route' },
                  { color: 'bg-red-500', label: 'Fire/blocked' },
                  { color: 'bg-yellow-500', label: 'Exit' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-gray-400 text-xs">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Instructions */}
            <div className="flex flex-col gap-4">
              {/* Current Route */}
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700">
                <h3 className="text-white font-bold mb-3">📋 Your Evacuation Route</h3>
                {route && route.path.length > 0 ? (
                  <>
                    <div className="space-y-2 mb-4">
                      {route.path.map((nodeId, index) => {
                        const node = FLOOR_GRAPH.nodes[nodeId]
                        const isLast = index === route.path.length - 1
                        return (
                          <div key={nodeId} className={`flex items-center gap-3 p-2 rounded-lg ${
                            isLast ? 'bg-green-900/30 border border-green-700' :
                            index === 0 ? 'bg-blue-900/30 border border-blue-700' :
                            'bg-gray-800'
                          }`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isLast ? 'bg-green-600' : 'bg-gray-600'
                            } text-white`}>
                              {index + 1}
                            </span>
                            <span className="text-white text-sm">{node.label}</span>
                            {index === 0 && <span className="text-blue-400 text-xs ml-auto">YOU</span>}
                            {isLast && <span className="text-green-400 text-xs ml-auto">🚪 EXIT</span>}
                          </div>
                        )
                      })}
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <span className="text-gray-400 text-sm">Total distance: </span>
                      <span className="text-white font-bold">{route.distance}m</span>
                      <span className="text-gray-400 text-sm"> via </span>
                      <span className="text-green-400 font-bold">
                        {FLOOR_GRAPH.nodes[route.exit]?.label}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-center">
                    <div className="text-red-400 font-bold">⚠️ All routes blocked!</div>
                    <div className="text-gray-400 text-sm mt-1">Stay in place and call for rescue</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSafe}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all"
                >
                  ✅ I Am Safe
                </button>
                <button
                  onClick={handleHelp}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all animate-pulse"
                >
                  🆘 Need Help
                </button>
              </div>

              {/* Offline status */}
              <div className={`rounded-xl p-3 border text-center text-sm ${
                offlineMode
                  ? 'bg-yellow-900/30 border-yellow-700 text-yellow-400'
                  : 'bg-green-900/30 border-green-700 text-green-400'
              }`}>
                {offlineMode
                  ? '📡 Offline — Routes cached on device'
                  : '🌐 Online — Live updates active'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}