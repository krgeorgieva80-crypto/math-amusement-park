import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useApp } from '../../../core/AppContext'
import { Mascot, type MascotMood } from '../../../components/art/Mascot'
import { StarRow } from '../../../components/ui/Effects'
import { GameButton } from '../../../components/ui/GameButton'
import { Icon } from '../../../components/ui/Icon'
import { FitText } from '../FitText'
import { MagicKey } from './TopArt'
import { starsTop } from './logic/common'
import { canSkip, posInHall, topReducer, type TopSession } from './logic/session'

/** Текст, в който думите с тире не се разделят на два реда. */
export function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').flatMap((w, i) => [
        i ? ' ' : '',
        <span key={i} className="nt-word">
          {w}
        </span>,
      ])}
    </>
  )
}

export type Verdict = 'correct' | 'wrong' | 'incomplete'

/**
 * Общата рамка на залите 2 и 3 (същата подредба като зала 1): условие и Звездичка вляво,
 * сцена в средата, отговор и бутони вдясно. Правила: „Провери“, една подсказка, звезди 3/2/1/0,
 * „Продължи нататък“ след 3 неуспешни опита, без разкриване на отговора.
 */
export function HallShell(p: {
  s: TopSession
  dispatch: (a: Parameters<typeof topReducer>[1]) => void
  portrait: boolean
  title: string
  chip: string
  prompt: ReactNode
  hint: string
  praise: string
  idle: string
  incomplete: string
  evaluate: () => Verdict
  onClear: () => void
  clearLabel?: string
  stage: (o: { solved: boolean; shake: number }) => ReactNode
  side: (o: { solved: boolean }) => ReactNode
  /** Клавиши за въвеждане (цифри и др.) — подават се на залата. */
  onKey?: (e: KeyboardEvent) => void
  stageClass?: string
  testKind?: string
}) {
  const { s, dispatch } = p
  const { settings, play } = useApp()
  const [msg, setMsg] = useState<null | { kind: 'wrong' | 'info' | 'hint'; text: string }>(null)
  const [shake, setShake] = useState(0)
  const solved = s.phase === 'solved' || s.phase === 'key'
  const result = s.results[s.index]

  const check = () => {
    if (solved) return
    const r = p.evaluate()
    if (r === 'incomplete') {
      play('hint')
      return setMsg({ kind: 'info', text: p.incomplete })
    }
    dispatch({ type: 'check', correct: r === 'correct' })
    if (r === 'correct') {
      setMsg(null)
      play('success')
      for (let k = 0; k < starsTop(s.wrong, s.usedHint, false); k++) window.setTimeout(() => play('star'), 900 + k * 230)
    } else {
      setShake((x) => x + 1)
      play('tryAgain')
      setMsg({ kind: 'wrong', text: s.wrong + 1 >= 3 ? 'Не се отказвай! Можеш да опиташ пак или да продължиш нататък.' : 'Още не е вярно. Помисли пак — можеш да промениш отговора си.' })
    }
  }
  const help = () => {
    if (solved || !settings.hintsOn || s.usedHint) return
    play('hint')
    dispatch({ type: 'hint' })
    setMsg({ kind: 'hint', text: p.hint })
  }
  const skip = () => {
    play('click')
    dispatch({ type: 'skip' })
    setMsg(null)
  }
  const next = () => {
    play('drop')
    dispatch({ type: 'next' })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && (e.key === 'Enter' || e.key === ' ')) return
      if (e.key === 'Enter') {
        e.preventDefault()
        if (solved) next()
        else check()
        return
      }
      if (!solved) p.onKey?.(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  let mood: MascotMood = 'happy'
  let bubble: ReactNode = <Words text={p.idle} />
  if (solved && result) {
    mood = result.solved ? 'cheer' : 'encourage'
    bubble = result.solved ? (
      <>
        <b className="bubble-title">Браво!</b>
        <Words text={p.praise} />
        <span className="tt-bubble-stars">
          <StarRow stars={result.stars} size={34} animate />
        </span>
      </>
    ) : (
      <Words text="Продължаваме нататък. Ще се върнеш към такива задачи и ще станеш още по-добър!" />
    )
  } else if (msg?.kind === 'wrong') {
    mood = 'encourage'
    bubble = <Words text={msg.text} />
  } else if (msg?.kind === 'hint') {
    mood = 'think'
    bubble = (
      <>
        <b className="bubble-title">Подсказка</b>
        <Words text={msg.text} />
      </>
    )
  } else if (msg) {
    mood = 'think'
    bubble = <Words text={msg.text} />
  }

  return (
    <div className="nt-grid tt-grid tt-grid--x" style={{} as CSSProperties}>
      <section className="nt-task">
        <div className="marquee tb-marquee nt-marquee" key={s.index}>
          <span className="marquee__lights" aria-hidden="true" />
          <FitText text={p.title} max={p.portrait ? 56 : 40} className="marquee__label nt-marquee__title" />
        </div>
        <div className="nt-say">
          <div className="tb-instruction nt-instruction nl-mission">
            <span className="nl-mission__chip">
              Задача {posInHall(s.index) + 1} от 4 · {p.chip}
            </span>
            <span className="nl-mission__q">{p.prompt}</span>
            <span className="tt-inline-keys" aria-label={`Ключове: ${s.keys} от 3`}>
              {[0, 1, 2].map((k) => (
                <MagicKey key={k} size={56} got={k < s.keys} />
              ))}
            </span>
          </div>
          <div className="nt-bubble">
            <Mascot mood={mood} size={72} />
            <div className={`speech-bubble speech-bubble--game ${msg?.kind === 'wrong' ? 'is-wrong' : ''}`} key={`${msg?.text}-${shake}-${solved}`}>
              {bubble}
            </div>
          </div>
        </div>
      </section>
      <section className={`wp-stage nt-stage tt-stage ${p.stageClass ?? ''} ${msg?.kind === 'wrong' ? 'is-shake' : ''}`} data-test-kind={import.meta.env.DEV ? p.testKind : undefined}>
        {p.stage({ solved, shake })}
      </section>
      <section className="nt-side nt-secret-side tt-side">
        {p.side({ solved })}
        <div className="nt-secret-actions">
          {solved ? (
            <GameButton color="purple" size="lg" icon="next" onClick={next} className="is-ready nt-next-side tt-next">
              Следваща задача
            </GameButton>
          ) : (
            <>
              <GameButton color="green" size="lg" icon="check" onClick={check} silent>
                Провери
              </GameButton>
              <GameButton
                color="turquoise"
                size="lg"
                icon="help"
                onClick={help}
                disabled={!settings.hintsOn || s.usedHint}
                title={settings.hintsOn ? 'Подсказка (една на задача)' : 'Подсказките са изключени от учителя'}
                silent
              >
                Помощ
              </GameButton>
            </>
          )}
        </div>
        {!solved && (
          <div className="tt-extra">
            <button type="button" className="tt-clear" onClick={() => (play('remove'), p.onClear(), setMsg(null))}>
              <Icon name="clear" size={22} /> {p.clearLabel ?? 'Изчисти'}
            </button>
            {canSkip(s) && (
              <GameButton color="orange" size="md" icon="next" onClick={skip} className="tt-skip">
                Продължи нататък
              </GameButton>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
