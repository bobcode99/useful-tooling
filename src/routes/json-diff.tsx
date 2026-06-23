import { createFileRoute } from '@tanstack/react-router'
import { diff } from 'json-diff-ts'
import type { IChange } from 'json-diff-ts'
import { useRef, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Upload } from 'lucide-react'
import { useTheme } from '#/context/theme'

export const Route = createFileRoute('/json-diff')({ component: JsonDiff })

function sortDeep(val: unknown): unknown {
  if (Array.isArray(val)) {
    return [...val]
      .map(sortDeep)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  }
  if (val !== null && typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortDeep(v)]),
    )
  }
  return val
}

function JsonViewer({ value, label }: { value: unknown; label: string }) {
  const { theme } = useTheme()
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-1">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</div>
      <SyntaxHighlighter
        language="json"
        style={theme === 'dark' ? oneDark : oneLight}
        customStyle={{ borderRadius: 8, maxHeight: 320, fontSize: 12, margin: 0, flexShrink: 0 }}
      >
        {JSON.stringify(value, null, 2)}
      </SyntaxHighlighter>
    </div>
  )
}

function countChanges(changes: IChange[]): { adds: number; removes: number; updates: number } {
  let adds = 0,
    removes = 0,
    updates = 0
  for (const c of changes) {
    if (c.type === 'ADD') adds++
    else if (c.type === 'REMOVE') removes++
    else if (c.type === 'UPDATE') {
      if (c.changes?.length) {
        const n = countChanges(c.changes)
        adds += n.adds
        removes += n.removes
        updates += n.updates
      } else updates++
    }
  }
  return { adds, removes, updates }
}

function ChangeTree({ changes, depth = 0 }: { changes: IChange[]; depth?: number }) {
  return (
    <>
      {changes.map((change, i) => {
        if (change.type === 'UPDATE' && change.changes?.length) {
          return (
            <div key={i} style={{ paddingLeft: depth * 16 }}>
              <div className="flex items-center gap-1.5 py-0.5 text-sm text-gray-500 dark:text-gray-400">
                <span className="text-yellow-500 font-bold">~</span>
                <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{change.key}</span>
              </div>
              <ChangeTree changes={change.changes} depth={depth + 1} />
            </div>
          )
        }
        const isAdd = change.type === 'ADD'
        const isRemove = change.type === 'REMOVE'
        return (
          <div
            key={i}
            style={{ marginLeft: depth * 16 }}
            className={`flex items-start gap-2 py-1 px-3 rounded text-sm font-mono my-0.5 ${
              isAdd
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : isRemove
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-300'
            }`}
          >
            <span className="font-bold shrink-0 mt-px">{isAdd ? '+' : isRemove ? '-' : '~'}</span>
            <span className="font-semibold shrink-0">{change.key}:</span>
            {change.type === 'UPDATE' && !change.changes?.length && (
              <span className="flex flex-wrap gap-1 items-center">
                <span className="line-through text-red-500 dark:text-red-400">{JSON.stringify(change.oldValue)}</span>
                <span className="text-gray-400 dark:text-gray-500">→</span>
                <span className="text-green-700 dark:text-green-400">{JSON.stringify(change.value)}</span>
              </span>
            )}
            {isAdd && <span>{JSON.stringify(change.value)}</span>}
            {isRemove && <span className="line-through opacity-75">{JSON.stringify(change.oldValue)}</span>}
          </div>
        )
      })}
    </>
  )
}

function JsonDiff() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [result, setResult] = useState<{
    leftParsed: unknown
    rightParsed: unknown
    changes: IChange[]
  } | null>(null)
  const [errors, setErrors] = useState<{ left?: string; right?: string }>({})
  const leftFileRef = useRef<HTMLInputElement>(null)
  const rightFileRef = useRef<HTMLInputElement>(null)

  function readFile(file: File, side: 'left' | 'right') {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      side === 'left' ? setLeft(text) : setRight(text)
    }
    reader.readAsText(file)
  }

  function compare() {
    const errs: { left?: string; right?: string } = {}
    let leftParsed: unknown, rightParsed: unknown
    try {
      leftParsed = JSON.parse(left)
    } catch {
      errs.left = 'Invalid JSON'
    }
    try {
      rightParsed = JSON.parse(right)
    } catch {
      errs.right = 'Invalid JSON'
    }
    if (errs.left || errs.right) {
      setErrors(errs)
      setResult(null)
      return
    }
    setErrors({})
    const sorted1 = sortDeep(leftParsed)
    const sorted2 = sortDeep(rightParsed)
    setResult({ leftParsed: sorted1, rightParsed: sorted2, changes: diff(sorted1, sorted2) })
  }

  const sides = [
    { id: 'left' as const, label: 'Original', val: left, set: setLeft, ref: leftFileRef },
    { id: 'right' as const, label: 'Modified', val: right, set: setRight, ref: rightFileRef },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">JSON Diff</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Paste or upload two JSON files. Array order is ignored.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {sides.map(({ id, label, val, set, ref }) => (
          <div key={id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
              <button
                type="button"
                onClick={() => ref.current?.click()}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <Upload size={12} />
                Upload file
              </button>
              <input
                ref={ref}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], id)}
              />
            </div>
            <textarea
              className={`w-full h-52 font-mono text-sm p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                errors[id] ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
              }`}
              placeholder={`Paste ${label.toLowerCase()} JSON…`}
              value={val}
              onChange={(e) => set(e.target.value)}
              spellCheck={false}
            />
            {errors[id] && <span className="text-xs text-red-500">{errors[id]}</span>}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={compare}
        disabled={!left.trim() || !right.trim()}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Compare
      </button>

      {result && (
        <div className="mt-8 space-y-6">
          <div className="flex gap-4">
            <JsonViewer value={result.leftParsed} label="Original (sorted)" />
            <JsonViewer value={result.rightParsed} label="Modified (sorted)" />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">Differences</h2>
              {(() => {
                const { adds, removes, updates } = countChanges(result.changes)
                const none = adds === 0 && removes === 0 && updates === 0
                return (
                  <div className="flex gap-1.5 text-xs">
                    {adds > 0 && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full font-medium">
                        +{adds} added
                      </span>
                    )}
                    {removes > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full font-medium">
                        -{removes} removed
                      </span>
                    )}
                    {updates > 0 && (
                      <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-full font-medium">
                        ~{updates} changed
                      </span>
                    )}
                    {none && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                        No differences
                      </span>
                    )}
                  </div>
                )
              })()}
            </div>

            {result.changes.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                JSONs are identical (order ignored)
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900">
                <ChangeTree changes={result.changes} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
