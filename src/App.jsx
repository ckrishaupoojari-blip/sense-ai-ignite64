import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Map from './pages/Map'
import Evacuate from './pages/Evacuate'
import Dispatch from './pages/Dispatch'
import Navbar from './components/Navbar'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Map />} />
          <Route path="/evacuate" element={<Evacuate />} />
          <Route path="/dispatch" element={<Dispatch />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App