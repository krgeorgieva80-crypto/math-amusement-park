/**
 * „Големи и малки ботуши“ — първа група (3–4 г.), ядро „Измерване“, атракция „Кулата на великаните“.
 * Детето избира предмет (докосване) и посочва за кого е — великана или джуджето; може и да го завлачи.
 * Работи и с клавиатура (Enter върху предмета, после върху героя).
 * При грешка предметът остава на пейката за нов опит, а Звездичка дава кратка насочваща подсказка.
 * Без таймер и без наказателни реакции.
 */
import { useEffect, useReducer, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Mascot } from '../../../components/art/Mascot'
import { Confetti } from '../../../components/ui/Effects'
import { GameButton } from '../../../components/ui/GameButton'
import { Icon } from '../../../components/ui/Icon'
import { useStage } from '../../../core/Stage'
import { Dwarf, Giant, HeroMat, ITEM_NAME, ItemArt, type HeroMood } from '../../art/GiantsArt'
import { GiantsTowerArt } from '../../art/KgAttractions'
import { GladeScene } from '../../art/KgScenery'
import { activityById } from '../../curriculum/activities'
import { useKg } from '../../KgContext'
import { KgTopBar } from '../../screens/KgTopBar'
import { bootsReducer, bootsText, currentLead, hintPhrase, makeTasks, newGame, shelfRows, type BootsState, type HeroId, type Item } from './logic'

const ACTIVITY_ID = 'giant-boots'
const PRAISE = ['boots.praise.1', 'boots.praise.2', 'boots.praise.3']
const HEROES: HeroId[] = ['giant', 'dwarf']
const HERO_LABEL: Record<HeroId, string> = { giant: 'великана', dwarf: 'джуджето' }

interface Drag {
  item: string
  pointerId: number
  sx: number
  sy: number
  x: number
  y: number
  moved: boolean
}

export function GiantBootsGame({ onExit, onMap }: { onExit: () => void; onMap: () => void }) {
  const [round, setRound] = useState(0)
  return <BootsRound key={round} seed={round} onExit={onExit} onMap={onMap} onRestart={() => setRound((r) => r + 1)} />
}

function BootsRound({ seed, onExit, onMap, onRestart }: { seed: number; onExit: () => void; onMap: () => void; onRestart: () => void }) {
  const { width: w, height: h, portrait, toStage } = useStage()
  const { group, settings, play, say, sayAll, hasVoice, saveResult } = useKg()
  const activity = activityById(ACTIVITY_ID)!
  const count = settings.taskCounts[ACTIVITY_ID] ?? activity.taskCount.default
  const [s, dispatch] = useReducer(bootsReducer, count, (n: number) => newGame(makeTasks(n, Math.random)))
  const [selected, setSelected] = useState<string | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [hover, setHover] = useState<HeroId | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [shake, setShake] = useState<{ item: string; n: number } | null>(null)
  const [praise, setPraise] = useState(PRAISE[0])
  const started = useRef(0)
  const saved = useRef(false)
  const t = s.tasks[s.index]
  const lead = currentLead(s)
  const leadId = `boots.${lead}`
  const groupMode = settings.workMode === 'group'

  useEffect(() => {
    started.current = Date.now()
  }, [])

  // инструкцията на задачата; в началото на играта — първо „Виж великана и джуджето!“
  useEffect(() => {
    if (s.phase !== 'play') return
    if (s.index === 0 && Object.keys(s.placed).length === 0) sayAll(['boots.intro', leadId])
    else say(leadId)
  }, [s.index, leadId, s.phase === 'play']) // eslint-disable-line react-hooks/exhaustive-deps

  // край — обобщен резултат без лични данни
  useEffect(() => {
    if (s.phase !== 'done' || saved.current || !group) return
    saved.current = true
    saveResult({ activity: ACTIVITY_ID, group, mode: settings.workMode, tasks: s.tasks.length, firstTry: s.firstTry, hinted: s.hinted, durationSec: Math.round((Date.now() - started.current) / 1000) })
    play('fanfare')
    say(groupMode ? 'boots.end.group' : 'boots.end')
  }, [s.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const place = (itemId: string, hero: HeroId) => {
    if (s.phase !== 'play') return
    const item = t.items.find((i) => i.id === itemId)
    if (!item || s.placed[itemId]) return
    const next: BootsState = bootsReducer(s, { type: 'place', item: itemId, hero, hintsOn: settings.hintsOn })
    dispatch({ type: 'place', item: itemId, hero, hintsOn: settings.hintsOn })
    setSelected(null)
    if (next.placed[itemId]) {
      play('drop')
      setMessage(null)
      if (next.phase === 'success') {
        const p = PRAISE[(s.index + s.wrong) % PRAISE.length]
        setPraise(p)
        play('success')
        say(groupMode ? 'boots.next.child' : p)
      }
    } else {
      play('hint')
      setShake({ item: itemId, n: (shake?.n ?? 0) + 1 })
      const id = settings.hintsOn ? hintPhrase(item) : 'boots.retry'
      setMessage(bootsText(id))
      say(id)
    }
  }
  const tapHero = (hero: HeroId) => {
    if (selected) place(selected, hero)
  }
  const select = (id: string) => {
    if (s.phase !== 'play' || s.placed[id]) return
    play('pick')
    setSelected((cur) => (cur === id ? null : id))
    setMessage(null)
  }
  const nextTask = () => {
    play('click')
    setMessage(null)
    setSelected(null)
    setShake(null)
    dispatch({ type: 'next' })
  }

  // ───── влачене ─────
  const heroAt = (cx: number, cy: number): HeroId | null => {
    for (const el of document.elementsFromPoint(cx, cy)) {
      const v = (el as HTMLElement).closest?.('[data-hero]')?.getAttribute('data-hero')
      if (v) return v as HeroId
    }
    return null
  }
  const onDown = (e: ReactPointerEvent, item: string) => {
    if (s.phase !== 'play' || s.placed[item]) return
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    const p = toStage(e.clientX, e.clientY)
    setDrag({ item, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, x: p.x, y: p.y, moved: false })
  }
  const onMove = (e: ReactPointerEvent) => {
    if (!drag || drag.pointerId !== e.pointerId) return
    const p = toStage(e.clientX, e.clientY)
    const moved = drag.moved || Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 12
    setDrag({ ...drag, x: p.x, y: p.y, moved })
    if (moved) setHover(heroAt(e.clientX, e.clientY))
  }
  const onUp = (e: ReactPointerEvent) => {
    if (!drag || drag.pointerId !== e.pointerId) return
    const d = drag
    setDrag(null)
    setHover(null)
    if (d.moved) {
      const hero = heroAt(e.clientX, e.clientY)
      if (hero) place(d.item, hero)
    } else select(d.item)
  }

  const mood = (hero: HeroId): HeroMood => {
    if (s.phase !== 'play') return 'happy'
    if (s.hint?.hero === hero || hover === hero || selected || drag?.moved) return 'hopeful'
    return 'idle'
  }

  const placedOn = (hero: HeroId) => t.items.filter((i) => s.placed[i.id] === hero)
  const draggedItem = drag?.moved ? t.items.find((i) => i.id === drag.item) : undefined

  if (s.phase === 'done') {
    return (
      <div className="screen kg-screen kg-boots is-done">
        <GladeScene w={w} h={h} horizon={h * (portrait ? 0.3 : 0.42)} />
        <Confetti seed={seed + 21} />
        <KgTopBar onBack={onExit} backLabel="Към атракцията" />
        <div className="kg-done">
          <h1 className="kg-done__title">{groupMode ? 'Браво, деца!' : 'Чудесно!'}</h1>
          <div className="kg-done__bears kg-boots__finale" aria-hidden="true">
            <Giant mood="happy" size={portrait ? 280 : 260} />
            <Dwarf mood="happy" size={portrait ? 150 : 140} />
          </div>
          <p className="kg-done__text">{bootsText(groupMode ? 'boots.end.group' : 'boots.end')}</p>
          <div className="kg-done__buttons">
            <GameButton color="green" size="lg" icon="refresh" onClick={() => (play('click'), onRestart())}>
              Играй пак
            </GameButton>
            <GameButton color="turquoise" size="lg" icon="back" onClick={onExit}>
              Към кулата
            </GameButton>
            <GameButton color="yellow" size="lg" icon="map" onClick={onMap}>
              Към картата
            </GameButton>
          </div>
        </div>
      </div>
    )
  }

  const itemLabel = (i: Item) => ITEM_NAME[i.kind][0][0].toUpperCase() + ITEM_NAME[i.kind][0].slice(1)
  return (
    <div
      className={`screen kg-screen kg-boots ${drag?.moved ? 'is-dragging' : ''} ${selected ? 'is-selecting' : ''}`}
      data-task={JSON.stringify({ lead: t.lead, ratio: t.ratio, items: t.items })}
      data-placed={JSON.stringify(s.placed)}
      data-phase={s.phase}
      style={{ '--ratio': t.ratio } as CSSProperties}
    >
      <GladeScene w={w} h={h} horizon={h * (portrait ? 0.3 : 0.42)} />
      <svg className="kg-boots__tower" viewBox="0 0 240 240" aria-hidden="true">
        <GiantsTowerArt size={240} />
      </svg>
      <KgTopBar
        onBack={onExit}
        backLabel="Към атракцията"
        extra={hasVoice(leadId) ? <GameButton color="turquoise" size="md" icon="sound" onClick={() => say(leadId)} aria-label="Чуй отново" title="Чуй отново" silent className="kg-replay" /> : null}
      />

      {/* задачата */}
      <div className="kg-task kg-boots__task" aria-live="polite">
        <div className="kg-task__picture" aria-hidden="true">
          <span className="kg-task__pair">
            <Giant mood="idle" size={62} />
            <ItemArt kind="boot" color="blue" size={58} />
          </span>
          <span className="kg-task__pair">
            <Dwarf mood="idle" size={44} />
            <ItemArt kind="boot" color="blue" size={28} />
          </span>
        </div>
        <div className="kg-task__words">
          <p className="kg-task__text">
            {s.index === 0 && Object.keys(s.placed).length === 0 && <>{bootsText('boots.intro')} </>}
            {bootsText(leadId)}
          </p>
          {(message || s.phase === 'success' || selected) && (
            <div className={`kg-task__say ${s.phase === 'success' ? 'is-praise' : ''}`} role="status">
              <Mascot mood={s.phase === 'success' ? 'cheer' : 'encourage'} size={76} />
              <span className="kg-task__say-text">
                {s.phase === 'success' ? (
                  <>
                    <b>{bootsText(praise)}</b>
                    {groupMode && <> {bootsText('boots.next.child')}</>}
                  </>
                ) : selected ? (
                  bootsText('boots.select')
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

      {/* героите с постелките */}
      {HEROES.map((hero) => (
        <div key={hero} className={`kg-boots__hero kg-boots__hero--${hero} ${hover === hero ? 'is-hover' : ''} ${s.hint?.hero === hero ? 'is-hint' : ''}`} data-hero={hero}>
          <button type="button" className="kg-boots__hero-btn" aria-label={`Дай на ${HERO_LABEL[hero]}`} onClick={() => tapHero(hero)} disabled={s.phase !== 'play'}>
            {hero === 'giant' ? <Giant mood={mood(hero)} size={300} /> : <Dwarf mood={mood(hero)} size={200} />}
          </button>
          <div className="kg-boots__mat">
            <HeroMat hero={hero} className="kg-boots__mat-bg" />
            <div className="kg-boots__mat-items">
              {placedOn(hero).map((i) => (
                <span key={i.id} className={`kg-boots__placed is-${i.size}`} data-placed-item={i.id}>
                  <ItemArt kind={i.kind} color={i.color} size={100} />
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* пейката с предметите */}
      <div className="kg-boots__bench">
        {shelfRows(t.items).map((row, r) => (
          <div key={r} className="kg-boots__row">
            <div className="kg-boots__items">
              {row.map((i) =>
                s.placed[i.id] ? (
                  <span key={i.id} className="kg-boots__slot is-empty" aria-hidden="true" />
                ) : (
                  <button
                    key={i.id + (shake?.item === i.id ? `-${shake.n}` : '')}
                    type="button"
                    className={`kg-boots__slot kg-boots__item is-${i.size} ${selected === i.id ? 'is-selected' : ''} ${shake?.item === i.id ? 'is-wrong' : ''} ${drag?.moved && drag.item === i.id ? 'is-lifted' : ''}`}
                    data-item={i.id}
                    data-size={i.size}
                    aria-label={itemLabel(i)}
                    aria-pressed={selected === i.id}
                    onPointerDown={(e) => onDown(e, i.id)}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={() => (setDrag(null), setHover(null))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        select(i.id)
                      }
                    }}
                    disabled={s.phase !== 'play'}
                  >
                    <ItemArt kind={i.kind} color={i.color} size={100} />
                  </button>
                ),
              )}
            </div>
            <svg className="kg-boots__bench-art" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
              <rect x="4" y="4" width="592" height="26" rx="12" fill="#c98a5a" stroke="#4a2f3a" strokeWidth="4" />
              <path d="M20 12 H 580" stroke="#e7b07c" strokeWidth="5" strokeLinecap="round" />
              <rect x="40" y="28" width="22" height="30" rx="5" fill="#a76b3d" stroke="#4a2f3a" strokeWidth="4" />
              <rect x="538" y="28" width="22" height="30" rx="5" fill="#a76b3d" stroke="#4a2f3a" strokeWidth="4" />
            </svg>
          </div>
        ))}
        {s.phase === 'success' && (
          <div className="kg-boots__next">
            <button type="button" className="kg-round-btn kg-round-btn--next" onClick={nextTask}>
              <span className="kg-round-btn__face">
                <Icon name="next" size={84} />
              </span>
              <span className="kg-round-btn__label">Напред</span>
            </button>
          </div>
        )}
      </div>

      {draggedItem && (
        <div className={`kg-boots__drag is-${draggedItem.size}`} style={{ left: drag!.x, top: drag!.y }} aria-hidden="true">
          <ItemArt kind={draggedItem.kind} color={draggedItem.color} size={100} />
        </div>
      )}

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
