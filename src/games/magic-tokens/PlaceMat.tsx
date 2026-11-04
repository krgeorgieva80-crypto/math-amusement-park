import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { TokenCoin } from '../../components/art/TokenCoin'
import { formatNumber } from './logic'
import { PLACE_NAMES, canExchangeDown, canExchangeUp, higherPlace, lowerPlace, valueOf, type Counts, type Place } from './placeValue'

export type RowKey = 'a' | 'b' | 'result' | 'board' | 'removed' | 'built' | 'added' | 'base'

export interface MatRow {
  key: RowKey
  label: string
  /** Относителна височина на реда. */
  weight: number
  /** Може ли да се пускат жетони тук. */
  drop?: boolean
  /** Могат ли жетоните да се влачат/докосват. */
  interactive?: boolean
  /** Разрешени размени в реда. */
  up?: boolean
  down?: boolean
  tone: 'group' | 'result' | 'board' | 'removed' | 'build' | 'locked'
}

export type DragPayload = { row: RowKey | 'supply'; place: Place }

type Bind = (payload: DragPayload) => {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
  onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void
  onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void
  onPointerCancel: () => void
}

interface Props {
  places: Place[]
  rows: MatRow[]
  counts: Partial<Record<RowKey, Counts>>
  bind: Bind
  dragOver: string | null
  onExchange: (row: RowKey, place: Place, dir: 'up' | 'down') => void
  onKeyTap: (row: RowKey, place: Place) => void
  highlight?: { row?: string; place?: Place } | null
  flash?: { row: RowKey; places: Place[]; n: number } | null
  tokenSize: number
  /** Колко жетона максимум да се рисуват в клетка (останалите — с число). */
  cap: number
  disabled?: boolean
  /** Текст до етикета на реда вместо стойността (напр. „?“ — за да не се разкрива резултатът). */
  rowValues?: Partial<Record<RowKey, string>>
  /** Подреждане на жетоните по 10 (за събиране). */
  tenFrames?: boolean
  /** Фиксирана височина на редовете (px) — по-компактна дъска на телефон. */
  rowHeights?: Partial<Record<RowKey, number>>
  /** Ширина на колоната с етикетите на редовете. */
  labelWidth?: number
}

/** Разрядна дъска: колони по разряди, редове по групи. */
/**
 * Жетоните в една клетка: размерът и броят в ред се избират според
 * реалния размер на клетката, така че всички жетони да се виждат.
 */
function CellTokens({ n, maxSize, bottom, className, render, frames, ...rest }: { n: number; maxSize: number; bottom: number; className: string; render: (size: number) => ReactNode; frames?: boolean } & Record<string, unknown>) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setBox({ w: el.offsetWidth, h: el.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  if (frames) {
    // Жетоните се групират по 10 (две редици по 5) — „десетка“ се вижда веднага.
    const groups = Math.max(1, Math.ceil(n / 10))
    let best = { size: Math.min(maxSize, 40), perLine: 1 }
    if (box.w > 0 && n > 0) {
      best = { size: 0, perLine: 1 }
      for (let perLine = 1; perLine <= Math.min(3, groups); perLine++) {
        const lines = Math.ceil(groups / perLine)
        const rowsPerFrame = n <= 5 ? 1 : 2
        // точни размери: рамка = 5 жетона + 4 отстъпа по 4px + вътрешен отстъп 2×5px + рамка 2×3px
        const w = (box.w - 12 - (perLine - 1) * 12 - perLine * 32) / (perLine * 5)
        const h = (box.h - 34 - bottom - (lines - 1) * 10 - lines * (16 + (rowsPerFrame - 1) * 4)) / (lines * rowsPerFrame)
        const size = Math.floor(Math.min(w, h, maxSize)) - 1
        if (size > best.size) best = { size, perLine }
      }
      best.size = Math.max(12, best.size)
    }
    const tokens = render(best.size) as ReactNode[]
    const list = Array.isArray(tokens) ? tokens : [tokens]
    const chunks: ReactNode[][] = []
    for (let i = 0; i < list.length; i += 10) chunks.push(list.slice(i, i + 10))
    return (
      <div ref={ref} className={`${className} is-framed`} style={{ paddingBottom: bottom, ['--frames-per-line' as string]: best.perLine }} {...rest}>
        {chunks.map((c, i) => (
          <span key={i} className={`ten-frame ${c.length === 10 ? 'is-full' : ''}`} style={{ gridTemplateColumns: `repeat(5, ${best.size}px)` }}>
            {c}
          </span>
        ))}
      </div>
    )
  }
  let best = { size: Math.min(maxSize, 40), perRow: 5 }
  if (box.w > 0 && n > 0) {
    best = { size: 0, perRow: 1 }
    for (let perRow = 2; perRow <= 10; perRow++) {
      const rows = Math.ceil(n / perRow)
      const size = Math.floor(Math.min((box.w - 12) / perRow - 4, (box.h - 34 - bottom) / rows - 4, maxSize))
      if (size > best.size) best = { size, perRow }
    }
    best.size = Math.max(14, best.size)
  }
  return (
    <div ref={ref} className={className} style={{ gridTemplateColumns: `repeat(${best.perRow}, ${best.size}px)`, paddingBottom: bottom }} {...rest}>
      {render(best.size)}
    </div>
  )
}

export function PlaceMat({ places, rows, counts, bind, dragOver, onExchange, onKeyTap, highlight, flash, tokenSize, cap, disabled, rowValues, tenFrames, rowHeights, labelWidth = 128 }: Props) {
  return (
    <div className="place-mat" style={{ gridTemplateColumns: `${labelWidth}px repeat(${places.length}, minmax(0, 1fr))`, gridTemplateRows: `auto ${rows.map((r) => (rowHeights?.[r.key] ? `${rowHeights[r.key]}px` : `minmax(0, ${r.weight}fr)`)).join(' ')}` }}>
      <div className="place-mat__corner" />
      {places.map((p) => (
        <div key={p} className={`place-mat__head place-mat__head--${p}`}>
          <TokenCoin value={p} size={34} />
          <span>{p === 10000 && places.length >= 5 ? 'Дес. хиляди' : PLACE_NAMES[p].header}</span>
        </div>
      ))}
      {rows.map((row) => {
        const c = counts[row.key]
        if (!c) return null
        return [
          <div key={`${row.key}-label`} className={`place-mat__label place-mat__label--${row.tone}`}>
            <span className="place-mat__label-name">{row.label}</span>
            <span className="place-mat__label-value">{rowValues ? (rowValues[row.key] ?? '') : formatNumber(valueOf(c))}</span>
          </div>,
          ...places.map((p) => {
            const n = c[p]
            const zone = `${row.key}:${p}`
            const shown = Math.min(n, cap)
            const lit = highlight && (highlight.row === row.key || highlight.row === undefined) && highlight.place === p
            const flashing = flash && flash.row === row.key && flash.places.includes(p)
            const canUp = !disabled && row.up && canExchangeUp(c, p, places)
            const canDown = !disabled && row.down && canExchangeDown(c, p, places)
            return (
              <div
                key={zone}
                className={`mat-cell mat-cell--${row.tone} ${row.drop ? 'is-drop' : ''} ${dragOver === zone || dragOver === row.key ? 'is-over' : ''} ${lit ? 'is-hinted' : ''} ${flashing ? 'is-flash' : ''} ${n > 9 ? 'is-overfull' : ''}`}
                data-drop={zone}
              >
                <CellTokens
                  n={shown}
                  maxSize={tokenSize}
                  frames={tenFrames}
                  bottom={canUp || canDown ? 46 : 10}
                  className={`mat-cell__tokens ${row.interactive && n > 0 && !disabled ? 'is-interactive' : ''}`}
                  {...(row.interactive && n > 0 && !disabled ? bind({ row: row.key, place: p }) : {})}
                  role={row.interactive && n > 0 ? 'button' : undefined}
                  tabIndex={row.interactive && n > 0 && !disabled ? 0 : undefined}
                  aria-label={`${n} ${n === 1 ? PLACE_NAMES[p].one : PLACE_NAMES[p].many}`}
                  onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onKeyTap(row.key, p)
                    }
                  }}
                  render={(size: number) =>
                    Array.from({ length: shown }, (_, i) => (
                      <span key={i} className="mat-token" style={{ animationDelay: flashing ? `${(i % 10) * 0.02}s` : undefined }}>
                        <TokenCoin value={p} size={size} />
                      </span>
                    ))
                  }
                />
                {n > 0 && <span className={`mat-cell__count ${n > 9 ? 'is-warn' : ''}`}>{n > cap ? `${n}` : n}</span>}
                {(canUp || canDown) && (
                  <div className="mat-cell__swaps">
                    {canUp && (
                      <button type="button" className="mat-swap mat-swap--up" onClick={() => onExchange(row.key, p, 'up')} title={`10 ${PLACE_NAMES[p].many} = 1 ${PLACE_NAMES[higherPlace(p)!].one}`}>
                        10 {PLACE_NAMES[p].short} → 1 {PLACE_NAMES[higherPlace(p)!].short}
                      </button>
                    )}
                    {canDown && (
                      <button type="button" className="mat-swap mat-swap--down" onClick={() => onExchange(row.key, p, 'down')} title={`1 ${PLACE_NAMES[p].one} = 10 ${PLACE_NAMES[lowerPlace(p)!].many}`}>
                        1 {PLACE_NAMES[p].short} → 10 {PLACE_NAMES[lowerPlace(p)!].short}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          }),
        ]
      })}
    </div>
  )
}
