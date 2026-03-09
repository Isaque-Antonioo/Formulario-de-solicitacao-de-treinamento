import { Routes, Route } from 'react-router-dom'
import FormPage from './pages/FormPage'
import SuccessPage from './pages/SuccessPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FormPage />} />
      <Route path="/sucesso" element={<SuccessPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}
