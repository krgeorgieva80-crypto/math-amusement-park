/**
 * „Нахрани трите мечета“ — пилотна игра за първа група (3–4 г.), ядро „Количествени отношения“.
 * Детето дава лакомства на мечетата: влачи плод до мечето, или докосва мечето (то взема плод от кошничката),
 * или избира плод и после мечето (и с клавиатура). Докосване на плод в чинийката го връща в кошничката.
 * Без таймер и без наказателни звуци: при грешка — нов опит с визуална подсказка.
 */
import { useEffect, useReducer, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Mascot } from '../../../components/art/Mascot'
import { Confetti } from '../../../components/ui/Effects'
import { GameButton } from '../../../components/ui/GameButton'
import { Icon } from '../../../components/ui/Icon'
import { useStage } from '../../../core/Stage'
import { Bear, Plate, type BearMood } from '../../art/Bears'
import { BasketBack, BasketFront, Fruit } from '../../art/Fruits'
import { GladeScene } from '../../art/KgScenery'
import { activityById } from '../../curriculum/activities'
import { useKg } from '../../KgContext'
import { KgTopBar } from '../../screens/KgTopBar'
import { BEARS, BEAR_NAME, FIXED_PHRASES, feedReducer, instructionId, instructionText, makeTasks, newGame, type BearId, type FeedState, type Hint } from './logic'

const ACTIVITY_ID = 'feed-bears'
const BEAR_SCALE: Record<BearId, number> = { big: 1, mid: 0.84, small: 0.68 }
const PRAISE = ['feed.praise.1', 'feed.praise.2', 'feed.praise.3', 'feed.praise.4']
const phraseText = (id: string) => FIXED_PHRASES.find((p) => p.id === id)?.text ?? ''
const HINT_PHRASE: Record<Hint, string> = { bear: 'feed.hint.bear', more: 'feed.hint.more', less: 'feed.hint.less', each: 'feed.hint.each', many: 'feed.hint.many' }

interface Drag {
  pointerId: number
  sx: number
  sy: number
  x: number
  y: number
  moved: boolean
}

export function FeedBearsGame({ onExit, onMap }: { onExit: () => void; onMap: () => void }) {
  const [round, setRound] = useState(0)
  return <FeedRound key={round} seed={round} onExit={onExit} onMap={onMap} onRestart={() => setRound((r) => r + 1)} />
}

function FeedRound({ seed, onExit, onMap, onRestart }: { seed: number; onExit: () => void; onMap: () => void; onRestart: () => void }) {
  const { width: w, height: h, portrait, toStage } = useStage()
  const { group, settings, play, say, hasVoice, saveResult } = useKg()
  const activity = activityById(ACTIVITY_ID)!
  const count = settings.taskCounts[ACTIVITY_ID] ?? activity.taskCount.default
  const [s, dispatch] = useReducer(feedReducer, count, (n: number) => newGame(makeTasks(n, Math.random)))
  const [selected, setSelected] = useState(false)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [praise, setPraise] = useState(PRAISE[0])
  const [hover, setHover] = useState<BearId | null>(null)
  // начало на играта — за продължителността в обобщения отчет
  const started = useRef(0)
  useEffect(() => {
    started.current = Date.now()
  }, [])
  const saved = useRef(false)
  const t = s.tasks[s.index]
  const group1 = settings.workMode === 'group'
  const targets: BearId[] = t.kind === 'each' ? BEARS : [t.bear!]

  // инструкцията звучи в началото на всяка задача (ако има запис)
  useEffect(() => {
    if (s.phase === 'play') say(instructionId(t))
  }, [s.index, s.phase === 'play']) // eslint-disable-line react-hooks/exhaustive-deps

  // край — запис на обобщен резултат (без лични данни)
  useEffect(() => {
    if (s.phase !== 'done' || saved.current || !group) return
    saved.current = true
    saveResult({ activity: ACTIVITY_ID, group, mode: settings.workMode, tasks: s.tasks.length, firstTry: s.firstTry, hinted: s.hinted, durationSec: Math.round((Date.now() - started.current) / 1000) })
    play('fanfare')
    say(group1 ? 'feed.end.group' : 'feed.end')
  }, [s.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const give = (bear: BearId) => {
    if (s.phase !== 'play' || s.basket <= 0) return
    const n = s.plates[bear] + 1
    dispatch({ type: 'give', bear })
    play('drop')
    if (n <= 7) say(`count.${n}`)
    setSelected(false)
    if (message) setMessage(null)
  }
  const takeBack = (bear: BearId) => {
    if (s.phase !== 'play') return
    dispatch({ type: 'takeBack', bear })
    play('remove')
  }
  const check = () => {
    const next: FeedState = feedReducer(s, { type: 'check', hintsOn: settings.hintsOn })
    dispatch({ type: 'check', hintsOn: settings.hintsOn })
    if (next.phase === 'success') {
      const p = PRAISE[(s.index + s.wrong) % PRAISE.length]
      setPraise(p)
      play('success')
      say(group1 ? 'feed.next.child' : p)
    } else {
      play('hint')
      const id = next.hint ? HINT_PHRASE[next.hint] : 'feed.hint.more'
      setMessage(next.hint ? phraseText(id) : 'Да опитаме пак!')
      say(id)
    }
  }
  const nextTask = () => {
    play('click')
    setMessage(null)
    setSelected(false)
    dispatch({ type: 'next' })
  }
  const restart = () => {
    play('click')
    onRestart()
  }

  // ───── влачене ─────
  const bearAt = (cx: number, cy: number): BearId | null => {
    for (const el of document.elementsFromPoint(cx, cy)) {
      const b = (el as HTMLElement).closest?.('[data-bear]')?.getAttribute('data-bear')
      if (b) return b as BearId
    }
    return null
  }
  const onFruitDown = (e: ReactPointerEvent) => {
    if (s.phase !== 'play') return
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    const p = toStage(e.clientX, e.clientY)
    setDrag({ pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, x: p.x, y: p.y, moved: false })
    play('pick')
  }
  const onFruitMove = (e: ReactPointerEvent) => {
    if (!drag || drag.pointerId !== e.pointerId) return
    const p = toStage(e.clientX, e.clientY)
    const moved = drag.moved || Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 10
    setDrag({ ...drag, x: p.x, y: p.y, moved })
    if (moved) setHover(bearAt(e.clientX, e.clientY))
  }
  const onFruitUp = (e: ReactPointerEvent) => {
    if (!drag || drag.pointerId !== e.pointerId) return
    const d = drag
    setDrag(null)
    setHover(null)
    if (d.moved) {
      const b = bearAt(e.clientX, e.clientY)
      if (b) give(b)
    } else setSelected((v) => !v)
  }

  const mood = (b: BearId): BearMood => {
    if (s.phase === 'success' || s.phase === 'done') return targets.includes(b) || s.phase === 'done' ? 'happy' : 'idle'
    if (s.hint === 'bear' && targets.includes(b)) return 'hungry'
    return targets.includes(b) ? 'hungry' : 'idle'
  }
  const ghosts = (b: BearId) => {
    if (!s.hint || !targets.includes(b)) return 0
    return t.kind === 'each' ? 1 : t.need
  }

  if (s.phase === 'done') {
    return (
      <div className="screen kg-screen kg-feed is-done">
        <GladeScene w={w} h={h} horizon={h * (portrait ? 0.3 : 0.42)} />
        <Confetti seed={seed + 11} />
        <KgTopBar onBack={onExit} backLabel="Към атракцията" />
        <div className="kg-done">
          <h1 className="kg-done__title">{group1 ? 'Браво, деца!' : 'Мечетата са сити!'}</h1>
          <div className="kg-done__bears" aria-hidden="true">
            {BEARS.map((b) => (
              <Bear key={b} id={b} mood="happy" size={(portrait ? 230 : 250) * BEAR_SCALE[b]} />
            ))}
          </div>
          <p className="kg-done__text">{phraseText(group1 ? 'feed.end.group' : 'feed.end')}</p>
          <div className="kg-done__hearts" aria-label={`${s.tasks.length} нахранени мечета`}>
            {s.tasks.map((_, i) => (
              <svg key={i} viewBox="0 0 40 36" className="kg-heart" style={{ animationDelay: `${i * 0.15}s` }} aria-hidden="true">
                <path d="M20 34 C 8 24 2 18 2 11 C 2 5 7 2 11.5 2 C 15 2 18 4 20 7 C 22 4 25 2 28.5 2 C 33 2 38 5 38 11 C 38 18 32 24 20 34 Z" fill="#ff7a9a" stroke="#4a2f2a" strokeWidth="2.5" />
              </svg>
            ))}
          </div>
          <div className="kg-done__buttons">
            <GameButton color="green" size="lg" icon="refresh" onClick={restart}>
              Играй пак
            </GameButton>
            <GameButton color="turquoise" size="lg" icon="back" onClick={onExit}>
              Към въртележката
            </GameButton>
            <GameButton color="yellow" size="lg" icon="map" onClick={onMap}>
              Към картата
            </GameButton>
          </div>
        </div>
      </div>
    )
  }

  const instrId = instructionId(t)
  return (
    <div
      className={`screen kg-screen kg-feed ${drag?.moved ? 'is-dragging' : ''} ${selected ? 'is-selecting' : ''}`}
      data-task={JSON.stringify(t)}
      data-plates={JSON.stringify(s.plates)}
      data-phase={s.phase}
    >
      <GladeScene w={w} h={h} horizon={h * (portrait ? 0.3 : 0.42)} />
      <KgTopBar
        onBack={onExit}
        backLabel="Към атракцията"
        extra={hasVoice(instrId) ? <GameButton color="turquoise" size="md" icon="sound" onClick={() => say(instrId)} aria-label="Чуй отново" title="Чуй отново" silent className="kg-replay" /> : null}
      />

      {/* задачата: картинка + текст */}
      <div className="kg-task" aria-live="polite">
        <div className="kg-task__picture" aria-hidden="true">
          {t.kind === 'each' ? (
            BEARS.map((b) => (
              <span key={b} className="kg-task__pair">
                <Bear id={b} mood="hungry" size={70 * BEAR_SCALE[b] + 20} />
                <Fruit id={t.fruit} size={54} />
              </span>
            ))
          ) : (
            <span className="kg-task__pair">
              <Bear id={t.bear!} mood="hungry" size={96} />
              <span className="kg-task__arrow">
                <Icon name="back" size={44} />
              </span>
              <span className={`kg-task__fruits ${t.kind === 'many' ? 'is-many' : ''}`}>
                {Array.from({ length: t.kind === 'many' ? 6 : t.need }, (_, i) => (
                  <Fruit key={i} id={t.fruit} size={t.kind === 'many' ? 46 : 60} />
                ))}
              </span>
            </span>
          )}
        </div>
        <div className="kg-task__words">
          <p className="kg-task__text">{instructionText(t)}</p>
          {(message || s.phase === 'success' || selected) && (
            <div className={`kg-task__say ${s.phase === 'success' ? 'is-praise' : ''}`} role="status">
              <Mascot mood={s.phase === 'success' ? 'cheer' : 'encourage'} size={76} />
              <span className="kg-task__say-text">
                {s.phase === 'success' ? (
                  <>
                    <b>{phraseText(praise)}</b>
                    {group1 && <> {phraseText('feed.next.child')}</>}
                  </>
                ) : selected ? (
                  'Сега докосни мечето.'
                ) : (
                  message
                )}
              </span>
            </div>
          )}
        </div>
        <span className="kg-task__step" aria-label={`Задача ${s.index + 1} от ${s.tasks.length}`}>
          {s.tasks.map((_, i) => (
            <i key={i} className={i < s.index || (i === s.index && s.phase === 'success') ? 'is-done' : i === s.index ? 'is-now' : ''} />
          ))}
        </span>
      </div>

      {/* мечетата и чинийките */}
      <div className="kg-bears">
        {BEARS.map((b) => (
          <div
            key={b}
            className={`kg-bear-col kg-bear-col--${b} ${hover === b ? 'is-hover' : ''} ${s.hint && targets.includes(b) ? 'is-hint' : ''} ${s.phase === 'success' && targets.includes(b) ? 'is-fed' : ''}`}
            data-bear={b}
          >
            <button
              type="button"
              className="kg-bear-btn"
              aria-label={`Дай на ${BEAR_NAME[b]}`}
              onClick={() => give(b)}
              disabled={s.phase !== 'play'}
              style={{ '--bs': BEAR_SCALE[b] } as CSSProperties}
            >
              <Bear id={b} mood={mood(b)} size={300} />
            </button>
            <div className="kg-plate-area">
              <Plate id={b} className="kg-plate-area__plate" />
              <div className="kg-plate-area__items">
                {Array.from({ length: Math.max(s.plates[b], ghosts(b)) }, (_, i) =>
                  i < s.plates[b] ? (
                    s.phase === 'play' ? (
                      <button
                        key={`f${i}`}
                        type="button"
                        className={`kg-on-plate ${s.hint === 'less' && targets.includes(b) && i >= t.need ? 'is-extra' : ''} ${s.hint === 'bear' && !targets.includes(b) ? 'is-extra' : ''}`}
                        aria-label="Върни в кошничката"
                        onClick={() => takeBack(b)}
                      >
                        <Fruit id={t.fruit} size={100} />
                      </button>
                    ) : (
                      <span key={`f${i}`} className="kg-on-plate" aria-hidden="true">
                        <Fruit id={t.fruit} size={100} />
                      </span>
                    )
                  ) : (
                    <span key={`g${i}`} className="kg-ghost" aria-hidden="true">
                      <Fruit id={t.fruit} size={100} />
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* кошничката */}
      <div className="kg-basket">
        <BasketBack className="kg-basket__back" />
        <div className="kg-basket__fruits">
          {Array.from({ length: s.basket }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`kg-fruit ${selected && i === s.basket - 1 ? 'is-selected' : ''}`}
              aria-label={`${t.fruit === 'apple' ? 'Ябълка' : t.fruit === 'pear' ? 'Круша' : 'Ягода'} — избери и докосни мечето`}
              aria-pressed={selected && i === s.basket - 1}
              onPointerDown={onFruitDown}
              onPointerMove={onFruitMove}
              onPointerUp={onFruitUp}
              onPointerCancel={() => (setDrag(null), setHover(null))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected((v) => !v)
                }
              }}
              disabled={s.phase !== 'play'}
              style={drag?.moved && i === s.basket - 1 ? { opacity: 0.25 } : undefined}
            >
              <Fruit id={t.fruit} size={100} />
            </button>
          ))}
        </div>
        <BasketFront className="kg-basket__front" />
      </div>

      {/* плодът, който се влачи */}
      {drag?.moved && (
        <div className="kg-drag" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <Fruit id={t.fruit} size={100} />
        </div>
      )}

      {/* действия */}
      <div className="kg-actions">
        {s.phase === 'play' ? (
          <button type="button" className="kg-round-btn kg-round-btn--check" onClick={check}>
            <span className="kg-round-btn__face">
              <Icon name="check" size={84} />
            </span>
            <span className="kg-round-btn__label">Готово</span>
          </button>
        ) : (
          <button type="button" className="kg-round-btn kg-round-btn--next" onClick={nextTask}>
            <span className="kg-round-btn__face">
              <Icon name="next" size={84} />
            </span>
            <span className="kg-round-btn__label">Напред</span>
          </button>
        )}
      </div>

      {s.phase === 'success' && (
        <div className="kg-hearts" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <svg key={i} viewBox="0 0 40 36" className="kg-heart kg-heart--float" style={{ left: `${10 + i * 12}%`, animationDelay: `${i * 0.12}s` }}>
              <path
                d="M20 34 C 8 24 2 18 2 11 C 2 5 7 2 11.5 2 C 15 2 18 4 20 7 C 22 4 25 2 28.5 2 C 33 2 38 5 38 11 C 38 18 32 24 20 34 Z"
                fill={['#ff7a9a', '#ffb3c7', '#ffd25e'][i % 3]}
                stroke="#4a2f2a"
                strokeWidth="2.5"
              />
            </svg>
          ))}
        </div>
      )}
    </div>
  )
}
