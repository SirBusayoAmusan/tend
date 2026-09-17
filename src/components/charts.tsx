import { clamp } from '@/lib/util'

export function Ring({
  label,
  value,
  color,
  size = 84,
}: {
  label: string
  /** 0..1 */
  value: number
  color: string
  size?: number
}) {
  const stroke = 8
  const r = (size - stroke) / 2
  const C = 2 * Math.PI * r
  const v = clamp(value, 0, 1)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity="0.16" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(C * v).toFixed(2)} ${C.toFixed(2)}`}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums">
          {Math.round(v * 100)}
        </span>
      </div>
      <span className="text-xs font-medium text-mist">{label}</span>
    </div>
  )
}

export function Bars({
  data,
  color,
  height = 88,
  title,
}: {
  data: { label: string; value: number }[]
  color: string
  height?: number
  title?: (value: number) => string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <div
            className="w-full max-w-5 rounded-t-md"
            style={{
              height: `${Math.max(d.value > 0 ? 4 : 0, (d.value / max) * (height - 16))}px`,
              backgroundColor: d.value > 0 ? color : 'transparent',
            }}
            title={title ? title(d.value) : String(d.value)}
          />
          <span className="text-[10px] text-mist">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export function Sparkline({
  data,
  color,
  height = 56,
  width = 240,
}: {
  data: number[]
  color: string
  height?: number
  width?: number
}) {
  if (data.length < 2) {
    return <p className="text-xs text-mist">Log a few entries to see the trend.</p>
  }
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const pts = data.map(
    (v, i) => `${(i * stepX).toFixed(1)},${(height - 6 - ((v - min) / range) * (height - 14)).toFixed(1)}`
  )
  const area = `M0,${height} L${pts.join(' L')} L${width},${height} Z`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-14 w-full" preserveAspectRatio="none" aria-hidden>
      <path d={area} fill={color} opacity="0.14" />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
