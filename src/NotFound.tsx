import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-5xl font-bold mb-2">404</h1>
      <p className="text-lg text-gray-600 mb-4">Page not found</p>
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  )
}
