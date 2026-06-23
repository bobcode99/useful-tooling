import { createFileRoute } from '@tanstack/react-router'
import { diff } from 'json-diff-ts'
import type { IChange } from 'json-diff-ts'
import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'

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

type Token = {
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'other'
  value: string
}

function tokenize(jsonStr: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < jsonStr.length) {
    if (jsonStr[i] === '"') {
      let j = i + 1
      while (j < jsonStr.length) {
        if (jsonStr[j] === '\\') j += 2
        else if (jsonStr[j] === '"') {
          j++
          break
        } else j++
      }
      const value = jsonStr.slice(i, j)
      const after = jsonStr.slice(j).match(/^\s*:/)
      tokens.push({ type: after ? 'key' : 'string', value })
      i = j
    } else if (jsonStr[i] === '-' || (jsonStr[i] >= '0' && jsonStr[i] <= '9')) {
      const m = jsonStr.slice(i).match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/)
      if (m) {
        tokens.push({ type: 'number', value: m[0] })
        i += m[0].length
      } else {
        tokens.push({ type: 'other', value: jsonStr[i] })
        i++
      }
    } else if (jsonStr.slice(i, i + 4) === 'true') {
      tokens.push({ type: 'boolean', value: 'true' })
      i += 4
    } else if (jsonStr.slice(i, i + 5) === 'false') {
      tokens.push({ type: 'boolean', value: 'false' })
      i += 5
    } else if (jsonStr.slice(i, i + 4) === 'null') {
      tokens.push({ type: 'null', value: 'null' })
      i += 4
    } else {
      tokens.push({ type: 'other', value: jsonStr[i] })
      i++
    }
  }
  return tokens
}

const TOKEN_CLS: Record<Token['type'], string> = {
  key: 'text-purple-400',
  string: 'text-green-400',
  number: 'text-sky-400',
  boolean: 'text-orange-400',
  null: 'text-red-400',
  other: 'text-gray-400',
}

function JsonViewer({ value, label }: { value: unknown; label: string }) {
  const jsonStr = JSON.stringify(value, null, 2) ?? 'null'
  const tokens = tokenize(jsonStr)
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-1">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
      <pre className="bg-gray-950 text-gray-100 p-4 rounded-lg text-xs overflow-auto font-mono max-h-80 leading-relaxed">
        {tokens.map((tok, i) => (
          <span key={i} className={TOKEN_CLS[tok.type]}>
            {tok.value}
          </span>
        ))}
      </pre>
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
              <div className="flex items-center gap-1.5 py-0.5 text-sm text-gray-500">
                <span className="text-yellow-500 font-bold">~</span>
                <span className="font-mono font-semibold text-gray-700">{change.key}</span>
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
                ? 'bg-green-50 text-green-800'
                : isRemove
                  ? 'bg-red-50 text-red-800'
                  : 'bg-yellow-50 text-yellow-900'
            }`}
          >
            <span className="font-bold shrink-0 mt-px">{isAdd ? '+' : isRemove ? '-' : '~'}</span>
            <span className="font-semibold shrink-0">{change.key}:</span>
            {change.type === 'UPDATE' && !change.changes?.length && (
              <span className="flex flex-wrap gap-1 items-center">
                <span className="line-through text-red-500">{JSON.stringify(change.oldValue)}</span>
                <span className="text-gray-400">→</span>
                <span className="text-green-700">{JSON.stringify(change.value)}</span>
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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">JSON Diff</h1>
      <p className="text-sm text-gray-500 mb-6">Paste or upload two JSON files. Array order is ignored.</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {sides.map(({ id, label, val, set, ref }) => (
          <div key={id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <button
                type="button"
                onClick={() => ref.current?.click()}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
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
              className={`w-full h-52 font-mono text-sm p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors[id] ? 'border-red-400 bg-red-50' : 'border-gray-200'
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
              <h2 className="font-semibold text-gray-800">Differences</h2>
              {(() => {
                const { adds, removes, updates } = countChanges(result.changes)
                const none = adds === 0 && removes === 0 && updates === 0
                return (
                  <div className="flex gap-1.5 text-xs">
                    {adds > 0 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                        +{adds} added
                      </span>
                    )}
                    {removes > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                        -{removes} removed
                      </span>
                    )}
                    {updates > 0 && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                        ~{updates} changed
                      </span>
                    )}
                    {none && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">No differences</span>
                    )}
                  </div>
                )
              })()}
            </div>

            {result.changes.length === 0 ? (
              <div className="text-sm text-gray-500 py-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                JSONs are identical (order ignored)
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl p-3 space-y-0">
                <ChangeTree changes={result.changes} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
