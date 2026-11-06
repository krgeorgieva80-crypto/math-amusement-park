import type { CSSProperties } from 'react'
import { multiplicationText } from '../logic'
import { cellKey, cellState, stepText, type GridTask, type PatternTask } from './logic'

interface GridProps {
  task: GridTask
  /** Видимите колони (при страници — половината). */
  cols: number[]
  cell: number
  answers: Record<string, string>
  marked: Set<string>
  locked: Set<string>
  flash: Set<string>
  selected: string | null
  /** Откривател: в избраната празна клетка се вижда „3 · 7“. */
  showExpr: boolean
  celebrate: boolean
  disabled: boolean
  onCell: (key: string) => void
}

/** Светещото табло: заглавен ред (колко пъти) и заглавна колона (таблицата). */
export function TableGrid({ task, cols, cell, answers, marked, locked, flash, selected, showExpr, celebrate, disabled, onCell }: GridProps) {
  const sel = selected ? task.cells.find((x) => cellKey(x.r, x.c) === selected) : null
  const font = Math.round(cell * 0.4)
  const style = { '--cell': `${cell}px`, '--cell-font': `${font}px`, gridTemplateColumns: `repeat(${cols.length + 1}, var(--cell))` } as CSSProperties
  return (
    <div className={`tt-board ${celebrate ? 'is-celebrate' : ''}`} role="grid" aria-label={`Таблица за умножение: редове ${task.rows.join(', ')}`}>
      <span className="tt-board__lights" aria-hidden="true" />
      <div className="tt-grid" style={style}>
        <div className="tt-head tt-head--corner" role="columnheader" aria-label="Умножение">
          ·
        </div>
        {cols.map((c) => (
          <div key={`h${c}`} role="columnheader" className={`tt-head tt-head--col ${sel?.c === c ? 'is-cross' : ''}`}>
            {c}
          </div>
        ))}
        {task.rows.map((r, ri) => (
          <div key={r} className="tt-row" role="row" style={{ display: 'contents' }}>
            <div role="rowheader" className={`tt-head tt-head--row ${sel?.r === r ? 'is-cross' : ''}`}>
              {r}
            </div>
            {cols.map((c) => {
              const key = cellKey(r, c)
              const x = task.cells.find((y) => y.r === r && y.c === c)!
              const st = cellState(task, key, answers, marked, locked)
              const shown = st === 'given' ? x.value : st === 'wrongShown' ? x.wrong : st === 'locked' ? (x.blank || x.wrong !== undefined ? Number(answers[key]) : x.value) : answers[key] ?? ''
              // неоткритата грешка изглежда (и в кода на страницата) като обикновена клетка
              const pub = st === 'wrongShown' ? 'given' : st
              const isSel = selected === key
              const cross = sel && (sel.r === r || sel.c === c) && !isSel
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  data-cell={key}
                  data-state={pub}
                  disabled={disabled}
                  aria-selected={isSel}
                  aria-label={`${multiplicationText(r, c)}: ${st === 'blank' ? 'празно' : shown}${st === 'locked' ? ', вярно' : ''}`}
                  className={`tt-cell tt-cell--${pub} ${isSel ? 'is-selected' : ''} ${cross ? 'is-cross' : ''} ${flash.has(key) ? 'is-flash' : ''}`}
                  style={{ animationDelay: celebrate ? `${ri * 0.12 + c * 0.03}s` : undefined }}
                  onClick={() => onCell(key)}
                >
                  {st === 'blank' && isSel && showExpr ? <span className="tt-cell__expr">{multiplicationText(r, c)}</span> : shown}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

interface StripProps {
  task: PatternTask
  cell: number
  /** На два реда (тесен екран). */
  wrap?: boolean
  stepChosen: boolean
  answers: Record<number, string>
  locked: Set<number>
  flash: Set<number>
  selected: number | null
  celebrate: boolean
  disabled: boolean
  onCell: (i: number) => void
}

/** Редица от лампички с дъгички между тях: „+3“ се появява, щом стъпката е избрана. */
export function PatternStrip({ task, cell, wrap = false, stepChosen, answers, locked, flash, selected, celebrate, disabled, onCell }: StripProps) {
  const style = { '--cell': `${cell}px`, '--cell-font': `${Math.round(cell * 0.4)}px` } as CSSProperties
  return (
    <div className={`tt-strip ${wrap ? 'is-wrap' : ''} ${celebrate ? 'is-celebrate' : ''}`} style={{ ...style, maxWidth: wrap ? `calc(var(--cell) * ${Math.ceil(task.terms.length / 2) * 1.6 + 0.6} + 70px)` : undefined }} role="group" aria-label="Числова редица">
      {task.terms.map((v, i) => {
        const blank = task.blanks.includes(i)
        const st = !blank ? 'given' : locked.has(i) ? 'locked' : answers[i] ? 'filled' : 'blank'
        return (
          <div key={i} className="tt-strip__item">
            {i > 0 && (
              <span className={`tt-step ${stepChosen ? 'is-known' : ''}`} aria-hidden="true">
                <svg viewBox="0 0 100 40" className="tt-step__arc">
                  <path d="M6 36 Q50 -6 94 36" fill="none" strokeWidth="6" strokeLinecap="round" />
                </svg>
                <b>{stepChosen ? stepText(task.step).replace(' ', '') : '?'}</b>
              </span>
            )}
            <button
              type="button"
              data-term={i}
              data-state={st}
              disabled={disabled || !blank || !stepChosen}
              aria-label={`Място ${i + 1}: ${st === 'blank' ? 'празно' : blank ? answers[i] : v}`}
              className={`tt-cell tt-lamp tt-cell--${st} ${selected === i ? 'is-selected' : ''} ${flash.has(i) ? 'is-flash' : ''}`}
              style={{ animationDelay: celebrate ? `${i * 0.1}s` : undefined }}
              onClick={() => onCell(i)}
            >
              {blank ? (locked.has(i) ? task.terms[i] : answers[i] ?? '') : v}
            </button>
          </div>
        )
      })}
    </div>
  )
}
