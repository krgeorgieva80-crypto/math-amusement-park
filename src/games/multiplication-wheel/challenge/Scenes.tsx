/**
 * Илюстрираните сцени на приключението. Всяка сцена е интерактивна:
 * табелите на детектива се докосват, шапката на фокусника реагира,
 * кабинките в загадката се броят с докосване, везните се накланят.
 */
import type { CSSProperties, ReactNode } from 'react'
import { OUTLINE as O } from '../../../components/art/Attractions'
import { Kid } from '../KidArt'
import { multiplicationText } from '../logic'
import type { DetectiveTask, MasterTask, MissingTask } from './logic'

const Lights = ({ n, w, y, r = 7 }: { n: number; w: number; y: number; r?: number }) => (
  <g>
    {Array.from({ length: n }, (_, k) => (
      <circle key={k} className="bulb" style={{ animationDelay: `${(k % 4) * 0.25}s` }} cx={(k + 0.5) * (w / n)} cy={y} r={r} fill="#fff6a8" stroke="#e08a00" strokeWidth="2" />
    ))}
  </g>
)

const Sparkle = ({ x, y, s, c = '#fff6a8', delay = 0 }: { x: number; y: number; s: number; c?: string; delay?: number }) => (
  <path
    className="twinkle"
    style={{ animationDelay: `${delay}s` }}
    d={`M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`}
    fill={c}
  />
)

/** Общ нощен фон на приключението с шатри и звезди. */
function NightSky({ tint = '#3b1f86', top = false, children }: { tint?: string; top?: boolean; children?: ReactNode }) {
  return (
    <svg className="ch-sky" viewBox="0 0 1000 700" preserveAspectRatio={top ? 'xMidYMin slice' : 'xMidYMax slice'} aria-hidden="true">
      <defs>
        <linearGradient id="ch-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tint} />
          <stop offset="0.6" stopColor="#6a3fc9" />
          <stop offset="1" stopColor="#b07ae8" />
        </linearGradient>
      </defs>
      <rect width="1000" height="700" fill="url(#ch-sky)" />
      {Array.from({ length: 26 }, (_, k) => (
        <Sparkle key={k} x={(k * 337) % 1000} y={20 + ((k * 131) % 300)} s={4 + (k % 3) * 3} delay={(k % 5) * 0.4} c={k % 3 ? '#fff6a8' : '#fff'} />
      ))}
      <path d="M0 600 Q500 540 1000 600 V700 H0 Z" fill="#4b2a95" />
      {children}
    </svg>
  )
}

// ───────────────────────── 1. Детектив ─────────────────────────

function Lens({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="48" cy="48" r="36" fill="rgba(191,239,255,0.35)" stroke={O} strokeWidth="9" />
      <circle cx="48" cy="48" r="36" fill="none" stroke="#ffc928" strokeWidth="5" />
      <path d="M74 74 L110 110" stroke={O} strokeWidth="18" strokeLinecap="round" />
      <path d="M74 74 L110 110" stroke="#9b5de5" strokeWidth="10" strokeLinecap="round" />
      <path d="M30 34 Q40 22 54 22" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}

/** Шатрата на детектива: табели с равенства, лупа над избраната. */
export function DetectiveScene({
  task,
  picked,
  solved,
  wrongTries,
  font,
  onPick,
}: {
  task: DetectiveTask
  picked: number | null
  solved: boolean
  /** Табели, които детето вече е проверило (верни). */
  wrongTries: Set<number>
  font: number
  onPick: (i: number) => void
}) {
  return (
    <div className="ch-scene ch-detective" style={{ '--sign-font': `${font}px` } as CSSProperties}>
      <NightSky top>
        {/* шатрата */}
        <g transform="translate(0 40)">
          <path d="M60 120 L500 20 L940 120 Z" fill="#ff5fa2" stroke={O} strokeWidth="8" strokeLinejoin="round" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (k % 2 ? <path key={k} d={`M500 20 L${60 + k * 110} 120 L${170 + k * 110} 120 Z`} fill="#ffd23f" stroke={O} strokeWidth="4" /> : null))}
          <rect x="70" y="118" width="860" height="26" rx="13" fill="url(#ch-gold)" stroke={O} strokeWidth="5" />
          <Lights n={18} w={860} y={131} r={6} />
          <path d="M100 144 V600 M900 144 V600" stroke={O} strokeWidth="18" />
          <path d="M100 144 V600 M900 144 V600" stroke="#9b5de5" strokeWidth="10" />
          {/* завеси */}
          <path d="M108 144 Q150 380 108 600 L170 600 Q200 360 220 144 Z" fill="#c2185b" stroke={O} strokeWidth="5" />
          <path d="M892 144 Q850 380 892 600 L830 600 Q800 360 780 144 Z" fill="#c2185b" stroke={O} strokeWidth="5" />
        </g>
        <defs>
          <linearGradient id="ch-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3a0" />
            <stop offset="0.5" stopColor="#ffc928" />
            <stop offset="1" stopColor="#e08a00" />
          </linearGradient>
        </defs>
      </NightSky>
      <div className={`ch-signs ch-signs--${task.equations.length}`} role="group" aria-label="Равенства — докосни грешното">
        {task.equations.map((e, i) => {
          const isWrong = i === task.wrong
          const fixed = solved && isWrong
          const checked = wrongTries.has(i)
          return (
            <button
              key={i}
              type="button"
              data-eq={i}
              disabled={solved || checked}
              className={`ch-sign ${picked === i ? 'is-picked' : ''} ${fixed ? 'is-fixed' : ''} ${checked ? 'is-checked' : ''}`}
              aria-label={`${multiplicationText(e.a, e.b)} = ${e.shown}${checked ? ', вярно' : ''}`}
              onClick={() => onPick(i)}
            >
              <span className="ch-sign__chain" aria-hidden="true" />
              <span className="ch-sign__text">
                {multiplicationText(e.a, e.b)} = {fixed ? <s>{e.shown}</s> : e.shown}
                {fixed && <b className="ch-sign__right"> {e.a * e.b}</b>}
              </span>
              {checked && <span className="ch-sign__ok" aria-hidden="true">✓</span>}
              {picked === i && <Lens className="ch-lens ch-lens--on" />}
              {fixed && <span className="ch-sign__stamp" aria-hidden="true">Поправено!</span>}
            </button>
          )
        })}
      </div>
      {/* лупата чака в ъгъла, докато детето не избере табела */}
      {picked === null && <Lens className="ch-lens" />}
    </div>
  )
}

// ───────────────────────── 2. Фокусникът ─────────────────────────

/** Сцената на фокусника: шапка, пръчица и карта със скрития множител. */
export function MagicianScene({ task, answer, solved, font, wiggle, onHat }: { task: MissingTask; answer: string; solved: boolean; font: number; wiggle: number; onHat: () => void }) {
  const p = task.a * task.b
  const box = <span className={`ch-card__box ${answer || solved ? '' : 'is-empty'} ${solved ? 'is-right' : ''}`}>{solved ? (task.hide === 'first' ? task.a : task.b) : answer || '?'}</span>
  return (
    <div className="ch-scene ch-magician" style={{ '--eq-font': `${font}px` } as CSSProperties}>
      <NightSky tint="#2a1660">
        {/* сцена с прожектори */}
        <path d="M200 0 L120 600 L360 600 Z" fill="#fff6a8" opacity="0.12" />
        <path d="M800 0 L640 600 L880 600 Z" fill="#fff6a8" opacity="0.12" />
        <ellipse cx="500" cy="620" rx="430" ry="60" fill="#ff5fa2" stroke={O} strokeWidth="6" />
        <ellipse cx="500" cy="606" rx="400" ry="44" fill="#ff8cc0" />
        <Lights n={20} w={1000} y={18} r={7} />
        {[0, 1].map((side) => (
          <g key={side} transform={side ? 'translate(1000 0) scale(-1 1)' : undefined}>
            <path d="M0 0 H150 Q120 200 160 420 Q100 560 130 700 H0 Z" fill="#c2185b" stroke={O} strokeWidth="6" />
            <path d="M40 0 Q20 300 60 700 M90 0 Q70 300 100 700" stroke="#ff5fa2" strokeWidth="10" fill="none" opacity="0.7" />
            <circle cx="150" cy="420" r="16" fill="#ffc928" stroke={O} strokeWidth="5" />
          </g>
        ))}
      </NightSky>
      <div className="ch-card" aria-live="polite">
        <span className="ch-card__label">Скритият множител</span>
        <span className="ch-card__eq">
          {task.hide === 'first' ? (
            <>
              {box}
              <span> · {task.b} = {p}</span>
            </>
          ) : (
            <>
              <span>{task.a} · </span>
              {box}
              <span> = {p}</span>
            </>
          )}
        </span>
      </div>
      <button type="button" className={`ch-hat ${solved ? 'is-open' : ''}`} key={wiggle} onClick={onHat} aria-label="Шапката на фокусника">
        <svg viewBox="0 0 300 260" aria-hidden="true">
          {/* звезда/заек изскача при верен отговор */}
          <g className="ch-hat__pop">
            <path d="M150 20 l14 30 33 5 -24 23 6 33 -29 -16 -29 16 6 -33 -24 -23 33 -5z" fill="#ffd23f" stroke={O} strokeWidth="5" strokeLinejoin="round" />
            <text x="150" y="78" textAnchor="middle" className="art-text" fontSize="34" fill={O}>
              {task.hide === 'first' ? task.a : task.b}
            </text>
          </g>
          <ellipse cx="150" cy="232" rx="120" ry="22" fill={O} opacity="0.25" />
          <path d="M80 120 L90 222 Q150 238 210 222 L220 120 Z" fill="#3b2a5a" stroke={O} strokeWidth="6" />
          <path d="M84 150 Q150 166 216 150 L214 176 Q150 192 86 176 Z" fill="#ff5fa2" stroke={O} strokeWidth="4" />
          <ellipse cx="150" cy="120" rx="96" ry="26" fill="#5a3f88" stroke={O} strokeWidth="6" />
          {/* зайче надзърта от шапката */}
          <g className="ch-bunny">
            <path d="M130 118 Q118 70 132 58 Q144 70 142 116 Z M158 116 Q156 70 168 58 Q182 70 170 118 Z" fill="#fff" stroke={O} strokeWidth="5" />
            <path d="M133 112 Q128 80 133 70 M165 112 Q170 80 165 70" stroke="#ff8cc0" strokeWidth="6" strokeLinecap="round" />
          </g>
          <ellipse cx="150" cy="118" rx="70" ry="14" fill="#1f1530" />
          {/* пръчица */}
          <g className="ch-wand">
            <path d="M232 214 L282 120" stroke={O} strokeWidth="16" strokeLinecap="round" />
            <path d="M232 214 L282 120" stroke="#1f1530" strokeWidth="9" strokeLinecap="round" />
            <path d="M272 138 L286 112" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
          </g>
          <Sparkle x={270} y={92} s={14} />
          <Sparkle x={40} y={110} s={10} c="#ff8cc0" delay={0.5} />
          <Sparkle x={60} y={60} s={8} delay={1} />
        </svg>
      </button>
    </div>
  )
}

// ───────────────────────── 3. Майсторът ─────────────────────────

/** Кабинките от загадката: докосване светва кабинка и показва натрупването. */
function CabinRow({ task, counted, showTotals, onCabin }: { task: MasterTask; counted: number; showTotals: boolean; onCabin: (i: number) => void }) {
  const n = task.b
  const kids = task.a
  const W = 150
  return (
    // повече от 5 кабинки — на два реда и по-малки, за да се побере всичко
    <div className={`ch-cabins ${n > 5 ? 'is-two-rows' : ''}`} role="group" aria-label={`${n} кабинки по ${kids} деца`}>
      {Array.from({ length: n }, (_, i) => (
        <button key={i} type="button" data-cabin={i} className={`ch-cabin ${i < counted ? 'is-counted' : ''}`} onClick={() => onCabin(i)} aria-label={`Кабинка ${i + 1}`}>
          <svg viewBox={`0 0 ${W} 140`} aria-hidden="true">
            <path d={`M10 40 Q75 4 140 40 Z`} fill={['#ff5fa2', '#2ed1c4', '#9b5de5', '#ff9f43'][i % 4]} stroke={O} strokeWidth="5" />
            <rect x="16" y="38" width="118" height="54" rx="10" fill="#fff3fa" stroke={O} strokeWidth="4" />
            {Array.from({ length: kids }, (_, k) => {
              const per = Math.min(kids, 5)
              const row = Math.floor(k / per)
              const col = k % per
              const s = Math.min(34, 110 / per)
              return <Kid key={k} x={30 + (col + 0.5) * (90 / per)} y={88 - row * 16} s={s} v={i * 7 + k} />
            })}
            <path d="M10 88 H140 Q136 132 75 134 Q14 132 10 88 Z" fill="#ff6fae" stroke={O} strokeWidth="5" />
            <rect x="6" y="84" width="138" height="12" rx="6" fill="#ffc928" stroke={O} strokeWidth="3" />
          </svg>
          {showTotals && i < counted && <span className="ch-cabin__tally">{kids * (i + 1)}</span>}
        </button>
      ))}
    </div>
  )
}

/** Везните за „a · b = c · □“: накланят се към по-тежката страна. */
function Balance({ task, answer, solved }: { task: MasterTask; answer: string; solved: boolean }) {
  const left = task.a * task.b
  const right = answer ? task.c! * Number(answer) : null
  const tilt = solved || right === left ? 0 : right === null ? -6 : right < left ? -10 : 10
  return (
    <svg className="ch-balance" viewBox="0 0 400 220" aria-hidden="true">
      <path d="M200 60 V200" stroke={O} strokeWidth="14" strokeLinecap="round" />
      <path d="M200 60 V200" stroke="#ffc928" strokeWidth="7" strokeLinecap="round" />
      <path d="M150 210 H250" stroke={O} strokeWidth="16" strokeLinecap="round" />
      <g className="ch-balance__beam" style={{ transform: `rotate(${tilt}deg)` }}>
        <path d="M40 60 H360" stroke={O} strokeWidth="12" strokeLinecap="round" />
        <path d="M40 60 H360" stroke="#ff5fa2" strokeWidth="6" strokeLinecap="round" />
        {[60, 340].map((x) => (
          <g key={x}>
            <path d={`M${x} 60 L${x - 40} 130 M${x} 60 L${x + 40} 130`} stroke={O} strokeWidth="3" />
            <path d={`M${x - 52} 130 H${x + 52} Q${x} 166 ${x - 52} 130 Z`} fill="#ffd23f" stroke={O} strokeWidth="4" />
          </g>
        ))}
        <text x="60" y="122" textAnchor="middle" className="art-text" fontSize="30" fill="#fff" stroke={O} strokeWidth="6" paintOrder="stroke">
          {multiplicationText(task.a, task.b)}
        </text>
        <text x="340" y="122" textAnchor="middle" className="art-text" fontSize="30" fill="#fff" stroke={O} strokeWidth="6" paintOrder="stroke">
          {task.c} · {answer || '?'}
        </text>
      </g>
      <circle cx="200" cy="60" r="12" fill="#9b5de5" stroke={O} strokeWidth="4" />
    </svg>
  )
}

export function MasterScene({
  task,
  riddle,
  answer,
  solved,
  font,
  counted,
  showTotals,
  onCabin,
}: {
  task: MasterTask
  riddle: string | null
  answer: string
  solved: boolean
  font: number
  counted: number
  showTotals: boolean
  onCabin: (i: number) => void
}) {
  const before =
    task.kind === 'swapped' ? multiplicationText(task.b, task.a) : task.kind === 'think' ? '' : task.kind === 'balance' ? `${multiplicationText(task.a, task.b)} = ${task.c} ·` : multiplicationText(task.a, task.b)
  const value = task.kind === 'think' ? task.b : task.kind === 'balance' ? (task.a * task.b) / task.c! : task.a * task.b
  const box = <span className={`ch-card__box ${answer || solved ? '' : 'is-empty'} ${solved ? 'is-right' : ''}`}>{solved ? value : answer || '?'}</span>
  return (
    <div className={`ch-scene ch-master ch-master--${task.kind} ${solved ? 'is-solved' : ''}`} style={{ '--eq-font': `${font}px` } as CSSProperties}>
      <NightSky tint="#1d1050">
        {/* върхът на колелото: обръч и спици */}
        <g transform="translate(500 760)" opacity="0.9">
          <circle r="520" fill="none" stroke={O} strokeWidth="40" />
          <circle r="520" fill="none" stroke="#ff6fae" strokeWidth="28" />
          {Array.from({ length: 9 }, (_, k) => {
            const a = Math.PI + (k * Math.PI) / 8
            return <path key={k} d={`M0 0 L${520 * Math.cos(a)} ${520 * Math.sin(a)}`} stroke="#ffd23f" strokeWidth="8" />
          })}
          {Array.from({ length: 30 }, (_, k) => {
            const a = Math.PI + (k * Math.PI) / 29
            return <circle key={k} className="bulb" style={{ animationDelay: `${(k % 4) * 0.25}s` }} cx={520 * Math.cos(a)} cy={520 * Math.sin(a)} r="9" fill="#fff6a8" />
          })}
        </g>
        {/* купата */}
        <g transform="translate(860 470)">
          <path d="M-46 -60 H46 Q44 10 0 22 Q-44 10 -46 -60 Z" fill="#ffc928" stroke={O} strokeWidth="6" />
          <path d="M-46 -48 Q-80 -40 -60 -10 M46 -48 Q80 -40 60 -10" fill="none" stroke={O} strokeWidth="8" />
          <rect x="-10" y="20" width="20" height="30" fill="#e08a00" stroke={O} strokeWidth="5" />
          <rect x="-36" y="48" width="72" height="18" rx="6" fill="#9b5de5" stroke={O} strokeWidth="5" />
          <path d="M0 -44 l7 14 15 2 -11 11 3 15 -14 -7 -14 7 3 -15 -11 -11 15 -2z" fill="#fff6a8" />
        </g>
        {/* фойерверки при успех */}
        <g className="ch-fireworks">
          {[
            [160, 150, '#ff5fa2'],
            [320, 90, '#2ed1c4'],
            [700, 120, '#ffd23f'],
          ].map(([x, y, c], k) => (
            <g key={k} transform={`translate(${x} ${y})`}>
              {Array.from({ length: 12 }, (_, j) => {
                const a = (j * Math.PI) / 6
                return <path key={j} d={`M${18 * Math.cos(a)} ${18 * Math.sin(a)} L${60 * Math.cos(a)} ${60 * Math.sin(a)}`} stroke={c as string} strokeWidth="7" strokeLinecap="round" />
              })}
            </g>
          ))}
        </g>
      </NightSky>
      <div className="ch-master__body">
        {riddle && <div className="ch-riddle">{riddle}</div>}
        {task.kind === 'groups' && <CabinRow task={task} counted={counted} showTotals={showTotals} onCabin={onCabin} />}
        {task.kind === 'balance' && <Balance task={task} answer={answer} solved={solved} />}
        <div className="ch-card ch-card--master" aria-live="polite">
          <span className="ch-card__eq">
            {task.kind === 'think' ? (
              <>
                {box}
                <span>
                  {' '}
                  · {task.a} = {task.a * task.b}
                </span>
              </>
            ) : (
              <>
                {/* загадката с кабинките: записът с умножение не е даден — детето го открива само */}
                <span>{task.kind === 'groups' ? 'Общо деца: ' : task.kind === 'balance' ? `${before} ` : `${before} = `}</span>
                {box}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

// ───────────────────────── Пътеката на приключението ─────────────────────────

export function AdventurePath({ current, done }: { current: number; done: boolean[] }) {
  const names = ['Детектив', 'Множителят', 'Майстор']
  return (
    <div className="ch-path" aria-label="Пътят на приключението">
      {names.map((n, i) => (
        <span key={n} className={`ch-lantern ${i === current ? 'is-on' : ''} ${done[i] ? 'is-done' : ''}`} aria-current={i === current ? 'step' : undefined}>
          <svg viewBox="0 0 40 52" aria-hidden="true">
            <path d="M20 2 V10" stroke={O} strokeWidth="4" />
            <path d="M8 12 H32 L28 44 H12 Z" fill="currentColor" stroke={O} strokeWidth="4" strokeLinejoin="round" />
            <rect x="6" y="42" width="28" height="8" rx="4" fill="#ffc928" stroke={O} strokeWidth="3" />
            {done[i] && <path d="M20 20 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#fff" />}
          </svg>
          <span className="ch-lantern__name">{n}</span>
        </span>
      ))}
    </div>
  )
}
