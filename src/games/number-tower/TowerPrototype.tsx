/**
 * Визуален прототип (Етап 1) — само макети на екраните, без игрова логика.
 * Отваря се само при разработка: ?prototype=number-tower
 */
import { useState, type CSSProperties, type ReactNode } from 'react'
import { useStage } from '../../core/Stage'
import { Mascot } from '../../components/art/Mascot'
import { NumberTowerArt } from '../../components/art/Attractions'
import { GameButton } from '../../components/ui/GameButton'
import { GradeTicket } from '../../components/ui/GradeTicket'
import { Icon } from '../../components/ui/Icon'
import { SoundControl } from '../../components/ui/SoundControl'
import { FLOOR_COLORS, TowerBackdrop, TowerScene } from './TowerScene'

type View = 'modes' | 'build' | 'secret' | 'lift' | 'top'

const MODES: { id: Exclude<View, 'modes'>; name: string; desc: string; color: string }[] = [
  { id: 'build', name: 'Построй кулата', desc: 'Подреди етажите', color: 'pink' },
  { id: 'secret', name: 'Тайните етажи', desc: 'Открий липсващото число', color: 'purple' },
  { id: 'lift', name: 'Числовият асансьор', desc: 'Сравни и намери етажа', color: 'turquoise' },
  { id: 'top', name: 'Върхът на кулата', desc: 'Приключение в три етапа', color: 'orange' },
]

function MiniFloors({ labels, ghost = -1, hidden = -1 }: { labels: string[]; ghost?: number; hidden?: number }) {
  return (
    <svg viewBox="0 0 160 130" width="170" height="138" aria-hidden="true">
      {labels.map((l, i) => {
        const [c] = FLOOR_COLORS[i % FLOOR_COLORS.length]
        const y = 100 - i * 30
        return (
          <g key={i} transform={`translate(30 ${y})`}>
            <rect width="100" height="26" rx="8" fill={i === ghost ? 'none' : c} stroke="#3b2a5a" strokeWidth="3" strokeDasharray={i === ghost ? '6 5' : undefined} />
            <rect x="28" y="4" width="44" height="18" rx="5" fill={i === hidden ? '#2a1660' : '#fffaf0'} stroke="#3b2a5a" strokeWidth="2" />
            <text x="50" y="18" textAnchor="middle" className="art-text" fontSize="13" fill={i === hidden ? '#fff6a8' : '#3b2a5a'}>
              {i === hidden ? '?' : i === ghost ? '' : l}
            </text>
          </g>
        )
      })}
      <path d="M80 2 l5 10 11 1.6 -8 7.8 1.9 11 -9.9 -5.2 -9.9 5.2 1.9 -11 -8 -7.8 11 -1.6z" fill="#ffd23f" stroke="#3b2a5a" strokeWidth="2.5" />
    </svg>
  )
}

function Shell({ title, label, instruction, bubble, stage, side, onBack }: { title: string; label: string; instruction: string; bubble: ReactNode; stage: ReactNode; side: ReactNode; onBack: () => void }) {
  return (
    <div className="nt-grid">
      <section className="nt-task">
        <div className="marquee tb-marquee nt-marquee">
          <span className="marquee__lights" aria-hidden="true" />
          <span className="marquee__label">{label}</span>
          <span className="marquee__number tb-marquee__text nt-marquee__text">{title}</span>
        </div>
        <div className="nt-say">
          <div className="tb-instruction">{instruction}</div>
          <div className="nt-bubble">
            <Mascot mood="happy" size={84} />
            <div className="speech-bubble speech-bubble--game">{bubble}</div>
          </div>
        </div>
      </section>
      <section className="wp-stage nt-stage">
        <TowerBackdrop />
        {stage}
      </section>
      <section className="nt-side">
        {side}
        <div className="actions nt-actions">
          <GameButton color="green" size="lg" icon="check">
            Провери
          </GameButton>
          <GameButton color="turquoise" size="lg" icon="help">
            Помощ
          </GameButton>
          <GameButton color="purple" size="lg" icon="back" onClick={onBack}>
            Игрите
          </GameButton>
        </div>
      </section>
    </div>
  )
}

const Keypad = () => (
  <div className="wheel-compute tp-pad nt-pad">
    <div className="keypad">
      {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((k) => (
        <button key={k} type="button" className="keypad__key">
          {k}
        </button>
      ))}
      <button type="button" className="keypad__key keypad__key--clear" aria-label="Изчисти">
        <Icon name="clear" size={30} />
      </button>
      <button type="button" className="keypad__key">
        0
      </button>
      <button type="button" className="keypad__key keypad__key--back" aria-label="Назад">
        <Icon name="back" size={30} />
      </button>
    </div>
  </div>
)

export function TowerPrototype() {
  const { width: W, height: H, portrait, scale } = useStage()
  const [view, setView] = useState<View>((new URLSearchParams(window.location.search).get('view') as View) || 'modes')
  const tap = Math.ceil(52 / Math.max(0.1, scale))
  const towerW = portrait ? Math.min(W * 0.62, (H - 700) * 0.55) : Math.min(W * 0.34, (H - 200) * 0.6)

  let body: ReactNode
  if (view === 'modes')
    body = (
      <div className="mode-select__body">
        <div className="mode-select__head">
          <h2 className="game-intro__title">Кулата на числата</h2>
          <div className="nt-head-art">
            <NumberTowerArt size={120} />
          </div>
        </div>
        <div className="mode-cards nt-mode-cards">
          {MODES.map((m, i) => (
            <button key={m.id} type="button" className={`mode-card mode-card--${m.color}`} onClick={() => setView(m.id)}>
              <span className="mode-card__num">{i + 1}</span>
              <span className="mode-art">
                {m.id === 'build' && <MiniFloors labels={['12', '35', '', '81']} ghost={2} />}
                {m.id === 'secret' && <MiniFloors labels={['20', '30', '40', '50']} hidden={2} />}
                {m.id === 'lift' && <MiniFloors labels={['100', '200', '300', '400']} />}
                {m.id === 'top' && <MiniFloors labels={['1', '2', '3', '★']} />}
              </span>
              <span className="mode-card__name">{m.name}</span>
              <span className="mode-card__desc">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>
    )
  else if (view === 'build')
    body = (
      <Shell
        onBack={() => setView('modes')}
        label="Построй кулата · 3. клас"
        title="От най-малкото към най-голямото"
        instruction="Плъзни етаж или го докосни и после докосни празното място."
        bubble="Най-долу е най-малкото число!"
        stage={
          <div className="nt-build">
            <div className="nt-tray" role="group" aria-label="Етажи за подреждане">
              {['704', '470', '407', '740'].map((n, i) => (
                <button key={n} type="button" className={`nt-block ${i === 1 ? 'is-picked' : ''}`} style={{ '--c': FLOOR_COLORS[(i + 2) % 7][0] } as CSSProperties}>
                  {n}
                </button>
              ))}
            </div>
            <TowerScene width={towerW} floors={[{ label: '74' }, { label: '247' }, { label: null, state: 'ghost' }, { label: null, state: 'ghost' }, { label: null, state: 'ghost' }, { label: null, state: 'ghost' }]} />
          </div>
        }
        side={<div className="nt-note">Подреди етажите. Кулата расте с всеки правилен етаж.</div>}
      />
    )
  else if (view === 'secret')
    body = (
      <Shell
        onBack={() => setView('modes')}
        label="Тайните етажи · 3. клас"
        title="Кое число липсва?"
        instruction="Всеки етаж е с 25 по-голям. Напиши числото в празния прозорец."
        bubble="Погледни съседните етажи."
        stage={<TowerScene width={towerW} floors={[{ label: '150' }, { label: '175' }, { label: '200' }, { label: null, state: 'hidden' }, { label: '250' }, { label: '275', state: 'glow' }]} />}
        side={<Keypad />}
      />
    )
  else if (view === 'lift')
    body = (
      <Shell
        onBack={() => setView('modes')}
        label="Числовият асансьор · 4. клас"
        title="На кой етаж е 45 600?"
        instruction="Докосни етажа, в който е числото. Асансьорът ще те закара там."
        bubble="Сравни със започващите числа."
        stage={
          <TowerScene
            width={towerW}
            elevatorAt={2}
            floors={[{ label: '10 000' }, { label: '20 000' }, { label: '40 000' }, { label: '50 000' }, { label: '60 000' }]}
            side={['10 000 – 19 999', '20 000 – 39 999', '40 000 – 49 999', '50 000 – 59 999', '60 000 – 69 999']}
          />
        }
        side={
          <div className="nt-choices">
            {['40 000 – 49 999', '50 000 – 59 999'].map((t, i) => (
              <button key={t} type="button" className={`nt-choice ${i === 0 ? 'is-on' : ''}`}>
                {t}
              </button>
            ))}
            <div className="nt-numline" aria-hidden="true">
              <svg viewBox="0 0 300 70">
                <path d="M10 40 H290" stroke="#3b2a5a" strokeWidth="5" strokeLinecap="round" />
                {[0, 1, 2, 3, 4, 5].map((k) => (
                  <g key={k}>
                    <path d={`M${10 + k * 56} 30 V50`} stroke="#3b2a5a" strokeWidth="4" />
                    <text x={10 + k * 56} y="68" textAnchor="middle" className="art-text" fontSize="13" fill="#3b2a5a">
                      {40 + k * 2}к
                    </text>
                  </g>
                ))}
                <circle cx={10 + 2.8 * 56} cy="40" r="10" fill="#ff5fa2" stroke="#3b2a5a" strokeWidth="3" />
              </svg>
            </div>
          </div>
        }
      />
    )
  else
    body = (
      <Shell
        onBack={() => setView('modes')}
        label="Върхът на кулата · етап 3 от 3"
        title="Колко стотици има в 3 482?"
        instruction="Последното изпитание! Реши и върхът ще светне."
        bubble="Подреди → закономерност → разряди."
        stage={
          <div className="nt-top-stage">
            <div className="ch-path nt-path">
              {['Подреди', 'Закономерност', 'Разряди'].map((n, i) => (
                <span key={n} className={`ch-lantern ${i === 2 ? 'is-on' : 'is-done'}`}>
                  <svg viewBox="0 0 40 52" aria-hidden="true">
                    <path d="M8 12 H32 L28 44 H12 Z" fill="currentColor" stroke="#3b2a5a" strokeWidth="4" />
                    <rect x="6" y="42" width="28" height="8" rx="4" fill="#ffc928" stroke="#3b2a5a" strokeWidth="3" />
                  </svg>
                  <span className="ch-lantern__name">{n}</span>
                </span>
              ))}
            </div>
            <TowerScene width={towerW * 0.92} topLit floors={[{ label: '3' }, { label: '4' }, { label: '8' }, { label: '2' }]} side={['хиляди', 'стотици', 'десетици', 'единици']} />
          </div>
        }
        side={<Keypad />}
      />
    )

  return (
    <div className="screen wheel-play nt-play" style={{ '--tap': `${tap}px` } as CSSProperties}>
      <TowerBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="map">
          Към парка
        </GameButton>
        <GradeTicket grade={3} />
        <div className="level-chip">Прототип · Етап 1</div>
        <div className="top-bar__spacer" />
        <div className="nt-proto-tabs" role="tablist">
          {(['modes', 'build', 'secret', 'lift', 'top'] as View[]).map((v, i) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} className={`setup-pill ${view === v ? 'is-on' : ''}`} onClick={() => setView(v)}>
              {i === 0 ? 'Карти' : `Игра ${i}`}
            </button>
          ))}
        </div>
        <SoundControl />
      </div>
      {body}
    </div>
  )
}
