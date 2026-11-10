import { useState, type CSSProperties } from 'react'
import { useApp } from '../../../core/AppContext'
import { Mascot } from '../../../components/art/Mascot'
import { HallShell, Words } from './HallShell'
import { TASKS_PER_HALL } from './logic/common'
import { checkBridge, type BridgeKind, type BridgeTask } from './logic/bridge'
import { topReducer, type TopSession } from './logic/session'

const KIND_NAME: Record<BridgeKind, string> = { calc: 'Пресметни', compare: 'Сравни', riddle: 'Загадка', error: 'Напуканата плоча' }
const O = '#3b2a5a'
const PLANK_X = (k: number) => 170 + k * 115

/** Мостът над пропастта: каменни скали, въжета, плочите (построени / празни) и героят. */
function BridgeScene({ built, skipped, fresh, question, solved }: { built: number; skipped: boolean[]; fresh: number; question: string; solved: boolean }) {
  // героят стои на края на последната построена плоча (или на отсрещната скала, когато мостът е готов)
  const heroX = built >= TASKS_PER_HALL ? 88 : built === 0 ? 12 : ((PLANK_X(built - 1) + 57) / 800) * 100
  return (
    <div className="tt-bridge">
      {/* рамка с постоянни пропорции 4:3 — скалите, мостът и героят винаги са заедно */}
      <div className="tt-bridge__frame">
        <svg className="tt-hallbg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <linearGradient id="tb-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7fd8f0" />
              <stop offset="0.6" stopColor="#c9b6ff" />
              <stop offset="1" stopColor="#ffc2dc" />
            </linearGradient>
            <linearGradient id="tb-abyss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5b3fb0" stopOpacity="0.2" />
              <stop offset="1" stopColor="#2a1660" />
            </linearGradient>
            <linearGradient id="tb-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff3a0" />
              <stop offset="1" stopColor="#ffb400" />
            </linearGradient>
            <radialGradient id="tb-spark">
              <stop offset="0" stopColor="#fff6a8" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fff6a8" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="600" fill="url(#tb-sky)" />
          {/* далечни планини и облаци */}
          <path d="M0 330 L120 230 L220 300 L340 190 L460 290 L580 210 L700 290 L800 240 V600 H0 Z" fill="#a98be8" opacity="0.55" />
          {[
            [120, 90, 60],
            [520, 70, 70],
            [690, 140, 46],
          ].map(([x, y, r]) => (
            <g key={x} className="tt-cloud" fill="#fff" opacity="0.92">
              <ellipse cx={x} cy={y} rx={r} ry={r * 0.42} />
              <ellipse cx={x - r * 0.5} cy={y + 6} rx={r * 0.55} ry={r * 0.32} />
              <ellipse cx={x + r * 0.55} cy={y + 8} rx={r * 0.5} ry={r * 0.3} />
            </g>
          ))}
          {/* пропастта с мъгла */}
          <rect x="150" y="330" width="500" height="270" fill="url(#tb-abyss)" />
          {[230, 400, 560].map((x, k) => (
            <ellipse key={x} cx={x} cy={470 + k * 18} rx="110" ry="20" fill="#fff" opacity="0.22" className="tt-mist" style={{ animationDelay: `${k * 0.8}s` }} />
          ))}
          {/* скалите */}
          <path d="M0 300 H178 Q190 300 186 330 L160 600 H0 Z" fill="#8d6e63" stroke={O} strokeWidth="6" />
          <path d="M800 300 H622 Q610 300 614 330 L640 600 H800 Z" fill="#8d6e63" stroke={O} strokeWidth="6" />
          <path d="M0 300 H180 V318 H0 Z M800 300 H620 V318 H800 Z" fill="#6bd66b" stroke={O} strokeWidth="5" />
          {/* стълбове и въжета */}
          {[176, 624].map((x) => (
            <g key={x}>
              <rect x={x - 9} y="210" width="18" height="96" rx="6" fill="#a1887f" stroke={O} strokeWidth="5" />
              <circle cx={x} cy="206" r="13" fill="url(#tb-gold)" stroke={O} strokeWidth="4" />
            </g>
          ))}
          <path d="M176 222 Q400 300 624 222" fill="none" stroke="#5d4037" strokeWidth="6" strokeDasharray="14 8" />
          {/* плочите на моста */}
          {Array.from({ length: TASKS_PER_HALL }, (_, k) => {
            const x = PLANK_X(k)
            const done = k < built
            const isFresh = k === fresh
            return (
              <g key={k} className={`tt-plank ${done ? 'is-built' : 'is-ghost'} ${isFresh ? 'is-fresh' : ''} ${done && skipped[k] ? 'is-plain' : ''}`}>
                {done ? (
                  <>
                    {isFresh && <circle cx={x + 57} cy="300" r="90" fill="url(#tb-spark)" className="tt-plank__spark" />}
                    <rect x={x + 3} y="292" width="109" height="30" rx="9" fill={skipped[k] ? '#c9b693' : 'url(#tb-gold)'} stroke={O} strokeWidth="5" />
                    {!skipped[k] && <path d={`M${x + 30} 307 l8 -6 8 6 -8 6z M${x + 70} 307 l8 -6 8 6 -8 6z`} fill="#fff6a8" stroke={O} strokeWidth="2" className="tt-rune" />}
                    <path d={`M${x + 10} 292 Q${x + 57} ${282} ${x + 105} 292`} fill="none" stroke="#fffaf0" strokeWidth="4" opacity="0.7" />
                  </>
                ) : (
                  <rect x={x + 6} y="294" width="103" height="26" rx="9" fill="rgba(255,255,255,0.25)" stroke="#fff6a8" strokeWidth="4" strokeDasharray="10 8" />
                )}
              </g>
            )
          })}
        </svg>
        <div className="tt-tablet" aria-live="polite">
          <span className="tt-tablet__text">
            <Words text={question} />
          </span>
        </div>
        <div className={`tt-hero tt-hero--bridge ${solved ? 'is-up' : ''}`} style={{ left: `${heroX - 5}%`, bottom: '46%' }} aria-hidden="true">
          <Mascot mood={solved ? 'cheer' : 'happy'} size={74} />
        </div>
      </div>
    </div>
  )
}

/** Зала 2: задача от моста. */
export function BridgePlay({ s, dispatch, portrait }: { s: TopSession; dispatch: (a: Parameters<typeof topReducer>[1]) => void; portrait: boolean }) {
  const { play } = useApp()
  const task = s.tasks[s.index] as BridgeTask
  const [chosen, setChosen] = useState<number | null>(null)
  const first = TASKS_PER_HALL // индексът на първата задача от моста
  const solvedNow = s.phase === 'solved' || s.phase === 'key'
  const built = Math.max(0, s.results.length - first)
  const skipped = Array.from({ length: TASKS_PER_HALL }, (_, k) => (s.results[first + k] ? !s.results[first + k].solved : false))
  const long = Math.max(...task.options.map((x) => x.length))
  return (
    <HallShell
      s={s}
      dispatch={dispatch}
      portrait={portrait}
      title="Мостът на загадките"
      chip={KIND_NAME[task.kind]}
      prompt={<Words text={task.prompt} />}
      hint={task.hint}
      praise={task.praise}
      idle="Избери плоча и натисни „Провери“. Верният отговор добавя плоча към моста."
      incomplete="Първо избери една от плочите."
      evaluate={() => checkBridge(task, chosen)}
      onClear={() => setChosen(null)}
      testKind={task.kind}
      stageClass="tt-stage--bridge"
      stage={({ solved }) => (
        <BridgeScene built={built} skipped={skipped} fresh={solved ? built - 1 : -1} question={task.kind === 'error' ? 'Кое пресмятане е грешно?' : task.question} solved={solvedNow} />
      )}
      side={({ solved }) => (
        <div className={`tt-cards ${task.options.length === 3 ? 'is-three' : ''} ${task.kind === 'error' ? 'is-long' : ''}`} role="radiogroup" aria-label="Избери плоча">
          {task.options.map((o, i) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={chosen === i}
              data-option={i}
              className={`tt-card ${chosen === i ? 'is-on' : ''}`}
              disabled={solved}
              onClick={() => {
                play('pick')
                setChosen(i)
              }}
              style={{ '--len': Math.max(3, long) } as CSSProperties}
            >
              <span className="tt-card__text">{o}</span>
            </button>
          ))}
        </div>
      )}
    />
  )
}
