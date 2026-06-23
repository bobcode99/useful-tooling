import { Link, createFileRoute } from '@tanstack/react-router'
import { GitCompare, Shuffle } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Home })

const tools = [
  {
    to: '/json-diff' as const,
    label: 'JSON Diff',
    desc: 'Compare two JSON files, order-insensitive with syntax highlighting.',
    Icon: GitCompare,
  },
  {
    to: '/random' as const,
    label: 'Random Number',
    desc: 'Generate random integers within a configurable range.',
    Icon: Shuffle,
  },
]

function Home() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Useful Tooling</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">A collection of developer utilities.</p>
      <div className="flex flex-col gap-3">
        {tools.map(({ to, label, desc, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
          >
            <div className="mt-0.5 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
              <Icon size={18} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">{label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
