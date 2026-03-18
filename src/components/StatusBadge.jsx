import { Circle } from 'lucide-react'

const STATUS_MAP = {
  'Currently Airing': { color: 'bg-emerald/20 text-emerald border-emerald/30', dot: 'bg-emerald', label: 'Airing' },
  'Finished Airing': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', dot: 'bg-blue-400', label: 'Completed' },
  'Not yet aired': { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', dot: 'bg-amber-400', label: 'Upcoming' },
}

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status]
  if (!config) return null

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  )
}
