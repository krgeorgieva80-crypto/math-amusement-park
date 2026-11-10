import { useState, type CSSProperties } from 'react'
import { useApp } from '../../../core/AppContext'
import { Icon } from '../../../components/ui/Icon'
import type { Grade } from '../../magic-tokens/logic'
import { fmt } from '../build/logic'
import { HallShell, Words } from './HallShell'
import { TASKS_PER_HALL } from './logic/common'
import { topReducer, type TopSession } from './logic/session'
import { checkSky, type SkyKind, type SkyTask } from './logic/sky'

const KIND_NAME: Record<SkyKind, string> = { constellation: 'Свържи съзвездието', pattern: 'Звездна зависимост', puzzle: 'Тайното число', twostep: 'Звездна задача' }
const MAX_DIGITS: Record<Grade, number> = { 2: 3, 3: 4, 4: 7 }
const O = '#3b2a5a'

/** Голямото съзвездие на залата — 5 звезди, 4 линии; всяка решена задача осветява една линия. */
const BIG = [
  [90, 470],
  [230, 360],
  [400, 410],
  [560, 300],
  [710, 360],
]

/** Местата на четирите звезди за свързване (в % от сцената). */
const SPOTS_LAND = [
  [24, 30],
  [74, 26],
  [28, 66],
  [76, 62],
]
/** Вертикално сцената е широка и ниска — звездите са по-раздалечени по хоризонтала. */
const SPOTS_PORT = [
  [22, 24],
  [76, 22],
  [26, 70],
  [78, 68],
]

const Star = ({ x, y, r, fill, cls }: { x: number; y: number; r: number; fill: string; cls?: string }) => (
  <path
    className={cls}
    d={`M${x} ${y - r} l${r * 0.29} ${r * 0.6} ${r * 0.66} ${r * 0.1} -${r * 0.48} ${r * 0.46} ${r * 0.12} ${r * 0.66} -${r * 0.59} -${r * 0.31} -${r * 0.59} ${r * 0.31} ${r * 0.12} -${r * 0.66} -${r * 0.48} -${r * 0.46} ${r * 0.66} -${r * 0.1}z`}
    fill={fill}
    stroke={O}
    strokeWidth={Math.max(2, r * 0.18)}
    strokeLinejoin="round"
  />
)

/** Обсерваторията: купол със звездно небе, телескоп и кристали; голямото съзвездие се осветява. */
function SkyBackdrop({ lit, dim, fresh }: { lit: number; dim: boolean[]; fresh: number }) {
  return (
    <svg className="tt-hallbg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="ts-sky" cx="0.5" cy="0.2" r="0.9">
          <stop offset="0" stopColor="#4b2fa0" />
          <stop offset="1" stopColor="#140a3a" />
        </radialGradient>
        <radialGradient id="ts-glow">
          <stop offset="0" stopColor="#fff6a8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff6a8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ts-crystal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c8fff8" />
          <stop offset="1" stopColor="#2ed1c4" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#ts-sky)" />
      {/* дребни звезди */}
      {Array.from({ length: 46 }, (_, k) => (
        <circle key={k} className="tt-twinkle" style={{ animationDelay: `${(k % 7) * 0.4}s` }} cx={(k * 173) % 800} cy={(k * 97) % 520} r={1.5 + (k % 3)} fill="#fff6c8" />
      ))}
      {/* куполът: ребра */}
      {[160, 320, 480, 640].map((x) => (
        <path key={x} d={`M${x} 0 Q${400 + (x - 400) * 1.25} 300 ${x} 600`} fill="none" stroke="rgba(203,185,255,0.12)" strokeWidth="5" />
      ))}
      {/* голямото съзвездие */}
      {BIG.slice(1).map(([x, y], k) => {
        const [px, py] = BIG[k]
        const on = k < lit
        return (
          <path
            key={k}
            d={`M${px} ${py} L${x} ${y}`}
            className={`tt-cline ${on ? 'is-on' : ''} ${on && dim[k] ? 'is-dim' : ''} ${k === fresh ? 'is-fresh' : ''}`}
            stroke={on ? '#fff6a8' : 'rgba(255,246,168,0.22)'}
            strokeWidth={on ? 7 : 4}
            strokeDasharray={on ? undefined : '6 10'}
            strokeLinecap="round"
          />
        )
      })}
      {BIG.map(([x, y], k) => {
        const on = k <= lit && lit > 0
        return (
          <g key={k}>
            {on && <circle cx={x} cy={y} r="46" fill="url(#ts-glow)" />}
            <Star x={x} y={y} r={on ? 20 : 13} fill={on ? '#ffd23f' : '#8f7cc7'} />
          </g>
        )
      })}
      {/* телескоп и кристали */}
      <g transform="translate(40 470)">
        <path d="M30 120 L70 60 L110 120" fill="none" stroke={O} strokeWidth="8" strokeLinecap="round" />
        <rect x="20" y="20" width="130" height="34" rx="14" fill="#9b5de5" stroke={O} strokeWidth="6" transform="rotate(-28 70 40)" />
        <rect x="128" y="-8" width="30" height="44" rx="8" fill="#ffd23f" stroke={O} strokeWidth="5" transform="rotate(-28 70 40)" />
      </g>
      {[
        [690, 560, 1],
        [740, 575, 0.7],
        [650, 580, 0.6],
      ].map(([x, y, sc]) => (
        <path key={x} d={`M${x} ${y} l${-18 * sc} ${-34 * sc} ${18 * sc} ${-30 * sc} ${18 * sc} ${30 * sc}z`} fill="url(#ts-crystal)" stroke={O} strokeWidth="4" className="tt-crystal" />
      ))}
      <rect y="586" width="800" height="14" fill="#2a1660" />
    </svg>
  )
}

/** Зала 3: задача от обсерваторията. */
export function SkyPlay({ s, dispatch, portrait, grade }: { s: TopSession; dispatch: (a: Parameters<typeof topReducer>[1]) => void; portrait: boolean; grade: Grade }) {
  const { play } = useApp()
  const task = s.tasks[s.index] as SkyTask
  const [tapped, setTapped] = useState<number[]>([])
  const [typed, setTyped] = useState('')
  const first = 2 * TASKS_PER_HALL
  const lit = Math.max(0, s.results.length - first)
  const dim = Array.from({ length: TASKS_PER_HALL }, (_, k) => (s.results[first + k] ? !s.results[first + k].solved : false))
  const solvedNow = s.phase === 'solved' || s.phase === 'key'
  const value = typed ? Number(typed) : null
  const SPOTS = portrait ? SPOTS_PORT : SPOTS_LAND

  const tapStar = (i: number) => {
    if (solvedNow) return
    if (tapped.includes(i)) {
      // докосване на последната свързана звезда я откача (поправка)
      if (tapped[tapped.length - 1] === i) {
        play('remove')
        setTapped(tapped.slice(0, -1))
      }
      return
    }
    play('pick')
    setTapped([...tapped, i])
  }
  const key = (k: string) => {
    if (solvedNow) return
    play('pick')
    setTyped((cur) => (k === 'clear' ? '' : k === 'back' ? cur.slice(0, -1) : cur.length >= MAX_DIGITS[grade] ? cur : cur === '0' ? k : cur + k))
  }

  const shown = value === null ? '?' : fmt(value)
  const prompt =
    task.kind === 'twostep' ? (
      <Words text={task.story!} />
    ) : (
      <Words text={task.prompt} />
    )

  return (
    <HallShell
      s={s}
      dispatch={dispatch}
      portrait={portrait}
      title="Обсерваторията на числата"
      chip={KIND_NAME[task.kind]}
      prompt={prompt}
      hint={task.hint}
      praise={task.praise}
      idle={task.mode === 'order' ? 'Докосвай звездите поред. Докосни последната свързана звезда, за да я откачиш.' : 'Напиши числото с клавиатурата и натисни „Провери“.'}
      incomplete={task.mode === 'order' ? 'Свържи и четирите звезди.' : 'Напиши число с клавиатурата.'}
      evaluate={() => checkSky(task, tapped, value)}
      onClear={() => (setTapped([]), setTyped(''))}
      onKey={(e) => {
        if (task.mode !== 'keypad') return
        if (/^[0-9]$/.test(e.key)) key(e.key)
        else if (e.key === 'Backspace') key('back')
        else if (e.key === 'Delete') key('clear')
      }}
      testKind={task.kind}
      stageClass="tt-stage--sky"
      stage={({ solved }) => (
        <div className="tt-sky">
          <SkyBackdrop lit={lit} dim={dim} fresh={solved ? lit - 1 : -1} />
          {task.mode === 'order' && (
            <>
              <svg className="tt-sky__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {tapped.slice(1).map((i, k) => {
                  const [x1, y1] = SPOTS[tapped[k]]
                  const [x2, y2] = SPOTS[i]
                  return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} className={`tt-sky__line ${solved ? 'is-lit' : ''}`} vectorEffect="non-scaling-stroke" />
                })}
              </svg>
              {task.stars!.map((label, i) => {
                const n = tapped.indexOf(i)
                return (
                  <button
                    key={i}
                    type="button"
                    data-star={i}
                    className={`tt-sstar ${n >= 0 ? 'is-on' : ''} ${solved ? 'is-lit' : ''}`}
                    style={{ left: `${SPOTS[i][0]}%`, top: `${SPOTS[i][1]}%`, '--len': Math.max(3, label.length) } as CSSProperties}
                    onClick={() => tapStar(i)}
                    disabled={solved}
                    aria-label={`Звезда ${label}${n >= 0 ? `, свързана ${n + 1}.` : ''}`}
                  >
                    <svg viewBox="0 0 60 60" className="tt-sstar__icon" aria-hidden="true">
                      <Star x={30} y={32} r={24} fill={n >= 0 || solved ? '#ffd23f' : '#d6c6ff'} />
                    </svg>
                    {n >= 0 && <span className="tt-sstar__n">{n + 1}</span>}
                    <span className="tt-sstar__label">{label}</span>
                  </button>
                )
              })}
            </>
          )}
          {task.kind === 'pattern' && (
            <ol className="tt-seq" aria-label="Звездите на редицата">
              {task.seq!.map((v, i) => (
                <li key={i} className={`tt-seq__star ${v === null ? 'is-ask' : ''} ${v === null && solved ? 'is-lit' : ''}`} style={{ '--i': i } as CSSProperties}>
                  <svg viewBox="0 0 60 60" aria-hidden="true">
                    <Star x={30} y={32} r={26} fill={v === null ? (solved ? '#ffd23f' : '#2a1660') : '#fff6a8'} />
                  </svg>
                  {v === null && !solved && <span className="tt-seq__q">?</span>}
                  <span className="tt-seq__num" style={{ '--len': Math.max(3, fmt(v ?? (solved ? task.answer : (value ?? 0))).length) } as CSSProperties}>
                    {v === null ? (solved ? fmt(task.answer) : shown) : fmt(v)}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {task.kind === 'puzzle' && (
            // свитъкът с условията — на сцената, над звездата
            <ul className="tt-scroll" aria-label="Условията">
              {task.conditions!.map((c) => (
                <li key={c} className="tt-cond">
                  <Words text={c} />
                </li>
              ))}
            </ul>
          )}
          {(task.kind === 'puzzle' || task.kind === 'twostep') && (
            <div className={`tt-bigstar ${solved ? 'is-lit' : ''} ${task.kind === 'puzzle' ? 'is-low' : ''}`}>
              <svg viewBox="0 0 60 60" aria-hidden="true">
                <Star x={30} y={32} r={27} fill={solved ? '#ffd23f' : '#2a1660'} />
              </svg>
              <span className="tt-bigstar__num" style={{ '--len': Math.max(3, shown.length) } as CSSProperties}>
                {solved ? fmt(task.answer) : shown}
              </span>
            </div>
          )}
        </div>
      )}
      side={({ solved }) =>
        task.mode === 'order' ? (
          <div className="tt-chain" aria-live="polite">
            <small>Свързани звезди</small>
            <div className="tt-chain__row">
              {[0, 1, 2, 3].map((k) => (
                <span key={k} className={`tt-chain__slot ${tapped[k] !== undefined ? 'is-on' : ''}`}>
                  {tapped[k] !== undefined ? task.stars![tapped[k]] : k + 1}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="nt-pad">
            <div className="nt-fields">
              <div className={`nt-field is-active ${solved ? 'is-correct' : ''}`} data-field="sky">
                <span className="nt-field__name">Числото</span>
                <span className={`nt-field__value ${value === null && !solved ? 'is-empty' : ''}`} style={{ '--len': Math.max(3, shown.length) } as CSSProperties}>
                  {solved ? fmt(task.answer) : shown}
                </span>
              </div>
            </div>
            <div className="nt-keypad" role="group" aria-label="Цифрова клавиатура">
              {[...'123456789'].map((k, i) => (
                <button key={k} type="button" className="nt-key" style={{ '--o3': i, '--o6': i < 5 ? i : i + 1 } as CSSProperties} onClick={() => key(k)} disabled={solved}>
                  {k}
                </button>
              ))}
              <button type="button" className="nt-key nt-key--clear" style={{ '--o3': 9, '--o6': 11 } as CSSProperties} onClick={() => key('clear')} disabled={solved} aria-label="Изтрий числото">
                <Icon name="clear" size={30} />
              </button>
              <button type="button" className="nt-key" style={{ '--o3': 10, '--o6': 10 } as CSSProperties} onClick={() => key('0')} disabled={solved}>
                0
              </button>
              <button
                type="button"
                className="nt-key nt-key--back"
                style={{ '--o3': 11, '--o6': 5 } as CSSProperties}
                onClick={() => key('back')}
                disabled={solved}
                aria-label="Изтрий последната цифра"
              >
                <Icon name="back" size={30} />
              </button>
            </div>
          </div>
        )
      }
    />
  )
}
