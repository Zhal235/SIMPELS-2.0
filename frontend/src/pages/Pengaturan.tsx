import Card from '../components/Card'
import { useUIStore } from '../stores/useUIStore'

export default function Pengaturan() {
  const { theme, setTheme } = useUIStore()
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pengaturan</h2>
      <Card title="Tema">
        <div className="flex gap-2">
          <button className="btn" onClick={() => setTheme('light')}>Light</button>
          <button className="btn" onClick={() => setTheme('dark')}>Dark</button>
          <span className="ml-2 text-sm text-gray-600">Saat ini: {theme}</span>
        </div>
      </Card>
      <Card title="Sesi">
        <button className="btn btn-primary">Logout</button>
      </Card>
    </div>
  )
}