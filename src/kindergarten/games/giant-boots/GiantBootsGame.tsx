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
import { ITEM_NAME } from '../../art/GiantsArt'
import { ArtProvider, useArt } from '../../art/sprites/Sprite'
import { useApp } from '../../../core/AppContext'
import { ART_GAME, type HeroState } from './art'
import { BootsBackground, HeroSprite, ItemSprite, MatSprite, ShelfSprite, SuccessBurst } from './BootsSprites'
import { GiantsTowerArt } from '../../art/KgAttractions'
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
  return (
    <ArtProvider game={ART_GAME}>
      <BootsRound key={round} seed={round} onExit={onExit} onMap={onMap} onRestart={() => setRound((r) => r + 1)} />
    </ArtProvider>
  )
}

function BootsRound({ seed, onExit, onMap, onRestart }: { seed: number; onExit: () => void; onMap: () => void; onRestart: () => void }) {
  const { width: w, height: h, portrait, toStage, scale, ref: stageRef } = useStage()
  const app = useApp()
  const art = useArt()
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
  // предметът „полита“ от рафта към героя (само при разрешено движение; не забавя играта)
  const [fly, setFly] = useState<{ key: number; item: Item; from: DOMRect; to: DOMRect; base: DOMRect } | null>(null)
  const motion = app.settings.animationsOn && !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
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
      if (motion) {
        const from = document.querySelector(`[data-item="${itemId}"]`)?.getBoundingClientRect()
        const to = document.querySelector(`[data-hero="${hero}"] .kg-boots__mat-items`)?.getBoundingClientRect()
        const base = stageRef.current?.getBoundingClientRect()
        if (from && to && base) setFly({ key: Date.now(), item, from, to, base })
      }
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

  const heroState = (hero: HeroId): Exclude<HeroState, 'blink'> => {
    if (s.phase !== 'play') return 'happy'
    if (s.hint?.hero === hero || hover === hero || selected || drag?.moved) return 'hopeful'
    return 'idle'
  }

  const placedOn = (hero: HeroId) => t.items.filter((i) => s.placed[i.id] === hero)
  const draggedItem = drag?.moved ? t.items.find((i) => i.id === drag.item) : undefined

  if (s.phase === 'done') {
    return (
      <div className="screen kg-screen kg-boots is-done">
        <BootsBackground w={w} h={h} portrait={portrait} />
        <Confetti seed={seed + 21} />
        <KgTopBar onBack={onExit} backLabel="Към атракцията" />
        <div className="kg-done">
          <h1 className="kg-done__title">{groupMode ? 'Браво, деца!' : 'Чудесно!'}</h1>
          <div className="kg-done__bears kg-boots__finale" aria-hidden="true">
            <span className="kg-boots__finale-hero kg-boots__finale-hero--giant">
              <HeroSprite hero="giant" state="boots" motion={false} />
            </span>
            <span className="kg-boots__finale-hero kg-boots__finale-hero--dwarf">
              <HeroSprite hero="dwarf" state="boots" motion={false} />
            </span>
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
      <BootsBackground w={w} h={h} portrait={portrait} />
      {/* кулата е част от рисувания фон; отделно се показва само при заместващата векторна поляна */}
      {!art.has('bg-wide') && !art.has('bg-tall') && (
        <svg className="kg-boots__tower" viewBox="0 0 240 240" aria-hidden="true">
          <GiantsTowerArt size={240} />
        </svg>
      )}
      <KgTopBar
        onBack={onExit}
        backLabel="Към атракцията"
        extra={hasVoice(leadId) ? <GameButton color="turquoise" size="md" icon="sound" onClick={() => say(leadId)} aria-label="Чуй отново" title="Чуй отново" silent className="kg-replay" /> : null}
      />

      {/* задачата */}
      <div className="kg-task kg-boots__task" aria-live="polite">
        <div className="kg-task__picture" aria-hidden="true">
          <span className="kg-task__pair">
            <span className="kg-mini kg-mini--giant">
              <HeroSprite hero="giant" state="idle" motion={false} />
            </span>
            <span className="kg-mini kg-mini--big">
              <ItemSprite kind="boot" color="blue" />
            </span>
          </span>
          <span className="kg-task__pair">
            <span className="kg-mini kg-mini--dwarf">
              <HeroSprite hero="dwarf" state="idle" motion={false} />
            </span>
            <span className="kg-mini kg-mini--small">
              <ItemSprite kind="boot" color="blue" />
            </span>
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
        <div
          key={hero}
          className={`kg-boots__hero kg-boots__hero--${hero} ${hover === hero ? 'is-hover' : ''} ${s.hint?.hero === hero ? 'is-hint' : ''} ${s.phase === 'success' ? 'is-cheer' : ''}`}
          data-hero={hero}
          data-state={heroState(hero)}
        >
          <button type="button" className="kg-boots__hero-btn" aria-label={`Дай на ${HERO_LABEL[hero]}`} onClick={() => tapHero(hero)} disabled={s.phase !== 'play'}>
            <HeroSprite hero={hero} state={heroState(hero)} motion={motion} />
          </button>
          <div className="kg-boots__mat">
            <MatSprite hero={hero} />
            <div className="kg-boots__mat-items">
              {placedOn(hero).map((i) => (
                <span key={i.id} className={`kg-boots__placed is-${i.size} ${motion && fly?.item.id === i.id ? 'is-arriving' : ''}`} data-placed-item={i.id}>
                  <ItemSprite kind={i.kind} color={i.color} />
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
                    <ItemSprite kind={i.kind} color={i.color} />
                  </button>
                ),
              )}
            </div>
            <ShelfSprite rows={1} />
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
          <ItemSprite kind={draggedItem.kind} color={draggedItem.color} />
        </div>
      )}

      {s.phase === 'success' && <SuccessBurst />}

      {fly && <Flight key={fly.key} item={fly.item} from={fly.from} to={fly.to} base={fly.base} scale={scale} onDone={() => setFly(null)} />}
    </div>
  )
}

/** Предметът плавно прелита от рафта до постелката на героя (0,4 с); не блокира играта. */
function Flight({ item, from, to, base, scale, onDone }: { item: Item; from: DOMRect; to: DOMRect; base: DOMRect; scale: number; onDone: () => void }) {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!el.current) return onDone()
    const dx = (to.left + to.width / 2 - (from.left + from.width / 2)) / scale
    const dy = (to.top + to.height * 0.7 - (from.top + from.height * 0.8)) / scale
    const a = el.current.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(0.9)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 0 },
      ],
      { duration: 420, easing: 'ease-in-out', fill: 'forwards' },
    )
    a.onfinish = onDone
    return () => a.cancel()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div
      ref={el}
      className={`kg-boots__fly is-${item.size}`}
      aria-hidden="true"
      style={{ left: (from.left - base.left) / scale, top: (from.top - base.top) / scale, width: from.width / scale, height: from.height / scale }}
    >
      <ItemSprite kind={item.kind} color={item.color} />
    </div>
  )
}
