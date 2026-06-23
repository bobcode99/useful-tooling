import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Check, Copy, RefreshCw } from 'lucide-react'

export const Route = createFileRoute('/random')({ component: RandomNumber })

function RandomNumber() {
  const [min, setMin] = useState('1')
  const [max, setMax] = useState('100')
  const [count, setCount] = useState('1')
  const [results, setResults] = useState<number[]>([])
  const [copied, setCopied] = useState(false)

  const lo = Number(min)
  const hi = Number(max)
  const n = Number(count)
  const invalid = lo >= hi || n < 1 || !Number.isFinite(lo) || !Number.isFinite(hi) || !Number.isFinite(n)

  function generate() {
    if (invalid) return
    const clampedN = Math.min(Math.max(1, Math.floor(n)), 1000)
    setResults(Array.from({ length: clampedN }, () => Math.floor(Math.random() * (hi - lo + 1)) + lo))
    setCopied(false)
  }

  function copy() {
    navigator.clipboard.writeText(results.join(', '))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Random Number Generator</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Generate random integers within a range.</p>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { label: 'Min', value: min, set: setMin },
              { label: 'Max', value: max, set: setMax },
              { label: 'Count', value: count, set: setCount },
            ] as const
          ).map(({ label, value, set }) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {label}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => set(e.target.value)}
                className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          ))}
        </div>

        {lo >= hi && <p className="text-xs text-red-500">Min must be less than Max.</p>}

        <button
          type="button"
          onClick={generate}
          disabled={invalid}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw size={14} />
          Generate
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {results.length === 1 ? 'Result' : `Results (${results.length})`}
            </span>
            {results.length > 1 && (
              <button
                type="button"
                onClick={copy}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy all'}
              </button>
            )}
          </div>

          {results.length === 1 ? (
            <div
              className="text-7xl font-bold text-center py-12 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 cursor-pointer select-all"
              onClick={copy}
              title="Click to copy"
            >
              {results[0]}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {results.map((num, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg font-mono text-sm font-semibold border border-blue-100 dark:border-blue-800"
                >
                  {num}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
