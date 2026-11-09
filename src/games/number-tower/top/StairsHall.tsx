import { useState, type CSSProperties } from 'react'
import { Mascot } from '../../../components/art/Mascot'
import { usePointerDrag } from '../../magic-tokens/usePointerDrag'
import { fmt } from '../build/logic'
import { checkStairs, type StairsTask } from './logic/stairs'

export interface StairsAnswer {
  /** Плочките по празните стъпала (отдолу нагоре). */
  placed: (number | null)[]
  /** „Сгрешено стъпало“: избраното стъпало. */
  selected: number | null
}

/**
 * Сцената на зала 1: каменна стълба в приказна зала с факли.
 * Плочките се поставят с влачене, с докосване (избор → стъпало) или с клавиатура (Enter → Enter).
 * Героят стои долу; при верен отговор стъпалата светват и той се изкачва до върха.
 */
export function StairsScene({
  task,
  answer,
  picked,
  solved,
  onSlot,
  onStep,
}: {
  task: StairsTask
  answer: StairsAnswer
  picked: number | null
  solved: boolean
  onSlot: (slot: number) => void
  onStep: (i: number) => void
}) {
  const n = task.steps.length
  const empties = task.steps.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0)
  // геометрия на стълбата (в % от сцената): колони отляво надясно, всяка по-висока от предишната
  const colW = 86 / n
  const stepTop = (i: number) => 16 + ((i + 1) * 60) / n
  const hero = solved ? { left: 7 + (n - 1) * colW + colW / 2 - 6, bottom: stepTop(n - 1) - 1 } : { left: 1, bottom: 2 }
  return (
    <div className="tt-stairs" style={{ '--n': n } as CSSProperties}>
      {/* залата: каменни арки, факли, знаме */}
      <svg className="tt-hallbg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="tt-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6b49c9" />
            <stop offset="1" stopColor="#a77de8" />
          </linearGradient>
          <radialGradient id="tt-torch">
            <stop offset="0" stopColor="#fff6a8" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffb400" stopOpacity="0" />
          </radialGradient>
          <pattern id="tt-stone" width="80" height="50" patternUnits="userSpaceOnUse">
            <path d="M0 25 H80 M40 0 V25 M0 25 V50 M80 25 V50" stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#tt-wall)" />
        <rect width="800" height="600" fill="url(#tt-stone)" />
        {[130, 400, 670].map((x) => (
          <path key={x} d={`M${x - 80} 600 V250 Q${x} 140 ${x + 80} 250 V600`} fill="rgba(42,22,96,0.35)" stroke="rgba(255,255,255,0.18)" strokeWidth="6" />
        ))}
        {[60, 740].map((x) => (
          <g key={x}>
            <circle cx={x} cy="190" r="70" fill="url(#tt-torch)" className="tt-flame-glow" />
            <rect x={x - 8} y="200" width="16" height="50" rx="4" fill="#8d6e63" stroke="#3b2a5a" strokeWidth="4" />
            <path d={`M${x} 160 q16 22 0 40 q-16 -18 0 -40z`} fill="#ffb400" stroke="#3b2a5a" strokeWidth="3" className="tt-flame" />
          </g>
        ))}
        <path d="M360 40 h80 v90 l-40 -20 -40 20z" fill="#ff5fa2" stroke="#3b2a5a" strokeWidth="5" />
        <path d="M400 62 l6 12 13 2 -9 9 2 13 -12 -6 -12 6 2 -13 -9 -9 13 -2z" fill="#fff6a8" stroke="#3b2a5a" strokeWidth="2.5" />
        <rect y="560" width="800" height="40" fill="#5b3fb0" />
      </svg>

      {/* стъпалата: отдолу-вляво → горе-вдясно */}
      <ol className="tt-steps" aria-label="Стълбата (отдолу нагоре)">
        {task.steps.map((v, i) => {
          const slot = empties.indexOf(i)
          const shown = v ?? (slot >= 0 ? answer.placed[slot] : null)
          const isEmpty = v === null
          const lit = solved
          const sel = task.kind === 'wrong' && answer.selected === i
          return (
            <li key={i} className="tt-step-li" style={{ left: `${7 + i * colW}%`, width: `${colW}%`, height: `${stepTop(i)}%`, '--i': i } as CSSProperties}>
              <button
                type="button"
                className={`tt-step ${isEmpty ? 'is-slot' : ''} ${isEmpty && shown === null ? 'is-empty' : ''} ${lit ? 'is-lit' : ''} ${sel ? 'is-selected' : ''} ${isEmpty && picked !== null && shown === null ? 'is-ready' : ''}`}
                data-drop={isEmpty ? `slot:${slot}` : undefined}
                data-step={i}
                onClick={() => (task.kind === 'wrong' ? onStep(i) : isEmpty ? onSlot(slot) : onStep(i))}
                disabled={solved}
                aria-label={`Стъпало ${i + 1}: ${shown === null ? 'празно' : fmt(shown)}${sel ? ', избрано' : ''}`}
                aria-pressed={task.kind === 'wrong' ? sel : undefined}
              >
                <span className="tt-step__top" />
                <span className="tt-step__plate">{shown === null ? '?' : fmt(shown)}</span>
              </button>
            </li>
          )
        })}
      </ol>
      <div className={`tt-hero ${solved ? 'is-up' : ''}`} style={{ left: `${hero.left}%`, bottom: `${hero.bottom}%` }} aria-hidden="true">
        <Mascot mood={solved ? 'cheer' : 'happy'} size={74} />
      </div>
    </div>
  )
}

/** Тавата с плочките (влачене / докосване / клавиатура). */
export function StairsBank({ task, answer, picked, solved, onPick, onDrop }: { task: StairsTask; answer: StairsAnswer; picked: number | null; solved: boolean; onPick: (v: number) => void; onDrop: (v: number, slot: number | null) => void }) {
  const used = answer.placed.filter((x): x is number => x !== null)
  const free = task.bank.filter((b) => !used.includes(b))
  const { drag, bind } = usePointerDrag<number>({
    disabled: solved,
    onTap: onPick,
    onDrop: (v, target) => onDrop(v, target?.startsWith('slot:') ? Number(target.slice(5)) : null),
  })
  return (
    <>
      <div className="tt-bank" role="group" aria-label="Плочки за стъпалата">
        {free.length === 0 && <div className="tt-bank__empty">Всички плочки са на стъпалата. Натисни „Провери“.</div>}
        {free.map((v) => (
          <button
            key={v}
            type="button"
            className={`tt-tile ${picked === v ? 'is-picked' : ''}`}
            data-tile={v}
            aria-pressed={picked === v}
            aria-label={`Плочка ${fmt(v)}${picked === v ? ', избрана' : ''}`}
            disabled={solved}
            {...bind(v)}
            onClick={(e) => {
              if (e.detail === 0) onPick(v) // клавиатура
            }}
            style={{ '--len': Math.max(3, fmt(v).length) } as CSSProperties}
          >
            {fmt(v)}
          </button>
        ))}
      </div>
      {drag && (
        <div className={`drag-ghost tt-tile tt-tile--ghost ${drag.over ? 'is-over' : ''}`} style={{ left: drag.x, top: drag.y } as CSSProperties} aria-hidden="true">
          {fmt(drag.payload)}
        </div>
      )}
    </>
  )
}

/** Проверка на отговора в залата. */
export const stairsResult = (task: StairsTask, a: StairsAnswer) => checkStairs(task, a.placed, a.selected)

/** Празен отговор за задачата. */
export const emptyStairsAnswer = (task: StairsTask): StairsAnswer => ({ placed: task.steps.filter((v) => v === null).map(() => null), selected: null })

/** Състоянието на отговора в залата (поставяне, връщане, избор). */
export function useStairsAnswer(task: StairsTask) {
  const [answer, setAnswer] = useState<StairsAnswer>(() => emptyStairsAnswer(task))
  const [picked, setPicked] = useState<number | null>(null)
  const place = (v: number, slot: number) =>
    setAnswer((a) => {
      const placed = a.placed.map((x) => (x === v ? null : x))
      placed[slot] = v
      return { ...a, placed }
    })
  const slotTap = (slot: number) => {
    const cur = answer.placed[slot]
    if (picked !== null) {
      place(picked, slot)
      setPicked(null)
      return 'placed'
    }
    if (cur !== null) {
      setAnswer((a) => ({ ...a, placed: a.placed.map((x, k) => (k === slot ? null : x)) }))
      return 'returned'
    }
    return 'nothing'
  }
  const select = (i: number) => setAnswer((a) => ({ ...a, selected: a.selected === i ? null : i }))
  const clear = () => {
    setAnswer(emptyStairsAnswer(task))
    setPicked(null)
  }
  return { answer, picked, setPicked, place, slotTap, select, clear }
}
