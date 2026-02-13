import { Route, Routes } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import ViewMap from '@/pages/ViewMap'
import NotFound from './NotFound'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/map" element={<ViewMap />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
