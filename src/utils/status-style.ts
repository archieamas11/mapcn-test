export function getStatusStyle(status: string) {
  switch (status) {
    case 'available':
      return 'bg-green-400 border-green-600 text-green-900 hover:bg-green-500'
    case 'sold':
      return 'bg-red-400 border-red-600 text-red-900 hover:bg-red-500'
    case 'reserved':
      return 'bg-yellow-400 border-yellow-600 text-yellow-900 hover:bg-yellow-500'
    case 'hold':
      return 'bg-cyan-400 border-cyan-600 text-cyan-900 hover:bg-cyan-500'
    default:
      return 'bg-gray-300 border-gray-500'
  }
}
