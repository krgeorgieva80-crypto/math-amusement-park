import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ATTRACTIONS, type AttractionId } from '../attractions/registry'
import { useApp } from '../core/AppContext'
import { useStage } from '../core/Stage'
import { passportFor } from '../core/passport'
import { bestStars } from '../core/storage'
import { Mascot } from '../components/art/Mascot'
import { PassportStamp } from '../components/art/PassportStamp'
import { SkyAndHills, SkyDefs } from '../components/scenery/Scenery'
import { StarRow } from '../components/ui/Effects'
import { GameButton, RoundButton } from '../components/ui/GameButton'
import { GradeTicket } from '../components/ui/GradeTicket'
import { Icon } from '../components/ui/Icon'
import { SoundControl } from '../components/ui/SoundControl'
import { DIFFICULTIES, type Grade } from '../games/magic-tokens/logic'

const ACCENT: Record<string, string> = { 'magic-tokens': '#ffd23f', 'multiplication-wheel': '#ff8cc0', 'number-tower': '#ffd23f' }

/**
 * Приключенският паспорт: книжка с корица и разгръщащи се страници.
 * Хоризонтално — разтворена книжка (две страници); вертикално — по една страница.
 */
export function PassportScreen({ grade, onBack, onOpen, fresh }: { grade: Grade; onBack: () => void; onOpen: (id: AttractionId) => void; fresh?: string[] }) {
  const { width: w, height: h, portrait, scale } = useStage()
  const { results, play } = useApp()
  const state = passportFor(results, grade)
  // страници: 0 — корица; после за всяка атракция: печат и игри (вертикално — поотделно)
  const perAttraction = portrait ? 2 : 1
  const pageCount = 1 + state.pages.length * perAttraction
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const go = (n: number) => {
    const next = Math.max(0, Math.min(pageCount - 1, n))
    if (next === page) return
    play('pick')
    setDir(next > page ? 1 : -1)
    setPage(next)
  }

  // клавиатура и плъзгане
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(page + 1)
      else if (e.key === 'ArrowLeft') go(page - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  const swipe = useRef<number | null>(null)

  const tap = Math.ceil(52 / Math.max(0.1, scale))
  // размерът на книжката — от наличното място (горната лента е ~116 px, долу — бутоните)
  const bookW = portrait ? w - 40 : Math.min(w - 80, (h - 230) * 1.6)
  // под книжката са бутоните за прелистване (размер за докосване)
  const bookH = portrait ? h - 116 - 40 - tap - 40 : Math.min(h - 116 - tap - 70, bookW / 1.6)
  const stampSize = Math.round(Math.min(portrait ? bookW * 0.62 : bookW * 0.3, bookH * 0.62))

  const ai = page === 0 ? -1 : Math.floor((page - 1) / perAttraction)
  const side = portrait ? (page - 1) % 2 : -1
  const entry = ai >= 0 ? state.pages[ai] : null
  const attraction = entry ? ATTRACTIONS.find((a) => a.id === entry.page.attraction)! : null

  const stampPage = entry && attraction && (
    <div className="pp-page pp-page--stamp">
      <div className="pp-page__title">{entry.page.name}</div>
      <div className="pp-stamp-slot">
        <PassportStamp Art={attraction.Art} name={entry.page.name} motto={entry.page.motto} color={attraction.color} accent={ACCENT[attraction.id] ?? '#ffd23f'} size={stampSize} stamped={entry.stamped} fresh={fresh?.includes(attraction.id)} grade={grade} />
      </div>
      <div className="pp-page__note">
        {entry.stamped ? 'Печатът е ударен! Браво!' : `Завърши всички игри (${entry.done.length} от ${entry.page.games.length}), за да получиш печата.`}
      </div>
    </div>
  )
  const gamesPage = entry && attraction && (
    <div className="pp-page pp-page--games">
      <div className="pp-page__title">Игрите</div>
      <ul className="pp-visas">
        {entry.page.games.map((g) => {
          const done = entry.done.includes(g.key)
          return (
            <li key={g.key} className={`pp-visa ${done ? 'is-done' : ''}`}>
              <span className="pp-visa__mark" aria-hidden="true">
                {done ? <Icon name="check" size={Math.round(tap * 0.5)} /> : null}
              </span>
              <span className="pp-visa__name">{g.name}</span>
              <span className="pp-visa__state">{done ? 'Завършена' : 'Още не е посетена'}</span>
            </li>
          )
        })}
      </ul>
      <div className="pp-page__best">
        Най-добър резултат: <StarRow stars={Math.max(0, ...DIFFICULTIES.map((d) => bestStars(results, attraction.id, grade, d) ?? 0))} size={Math.round(tap * 0.5)} />
      </div>
      <GameButton color="green" size="lg" icon="play" onClick={() => onOpen(attraction.id)} className="pp-go">
        Към „{entry.page.name}“
      </GameButton>
    </div>
  )

  const cover = (
    <div className="pp-cover">
      <div className="pp-cover__lights" aria-hidden="true" />
      <div className="pp-cover__title">Приключенски паспорт</div>
      <div className="pp-cover__sub">Математически увеселителен парк</div>
      <Mascot mood="wave" size={Math.round(Math.min(bookH * (portrait ? 0.3 : 0.22), 220))} />
      <div className="pp-cover__grade">{grade}. клас</div>
      <div className="pp-cover__count">
        <span>
          Печати: <b>{state.stamps}</b> от {state.pages.length}
        </span>
        <span>
          Игри: <b>{state.games}</b> от {state.totalGames}
        </span>
      </div>
      <GameButton color="purple" size="lg" icon="next" onClick={() => go(1)} className="pp-open">
        Отвори паспорта
      </GameButton>
    </div>
  )

  return (
    <div className="screen passport-screen" style={{ '--tap': `${tap}px` } as CSSProperties}>
      <svg className="scene" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <SkyDefs />
        <SkyAndHills w={w} h={h} horizon={h * 0.78} />
      </svg>
      <div className="top-bar">
        <RoundButton icon="map" label="Към парка" color="yellow" onClick={onBack} />
        <GradeTicket grade={grade} />
        <h2 className="top-bar__title pp-topbar-title">
          <Icon name="star" size={36} /> Паспорт
        </h2>
        <div className="top-bar__spacer" />
        <SoundControl />
      </div>

      <div
        className={`pp-book ${portrait ? 'is-single' : 'is-spread'} ${page === 0 ? 'is-closed' : ''}`}
        style={{ width: bookW, height: bookH }}
        onPointerDown={(e) => (swipe.current = e.clientX)}
        onPointerUp={(e) => {
          if (swipe.current === null) return
          const dx = e.clientX - swipe.current
          swipe.current = null
          if (Math.abs(dx) > 60 * scale) go(page + (dx < 0 ? 1 : -1))
        }}
        role="region"
        aria-label={`Приключенски паспорт, страница ${page + 1} от ${pageCount}`}
      >
        <div className={`pp-sheet pp-turn-${dir}`} key={page}>
          {page === 0 ? (
            cover
          ) : portrait ? (
            side === 0 ? (
              stampPage
            ) : (
              gamesPage
            )
          ) : (
            <div className="pp-spread">
              {stampPage}
              <div className="pp-spine" aria-hidden="true" />
              {gamesPage}
            </div>
          )}
        </div>
      </div>

      <div className="pp-nav" role="group" aria-label="Прелистване">
        <button type="button" className="pp-nav__btn" onClick={() => go(page - 1)} disabled={page === 0} aria-label="Предишна страница">
          <Icon name="back" size={Math.round(tap * 0.5)} />
        </button>
        <span className="pp-dots">
          {Array.from({ length: pageCount }, (_, i) => (
            <button key={i} type="button" className={`pp-dot ${i === page ? 'is-on' : ''}`} aria-label={`Страница ${i + 1}`} onClick={() => go(i)} />
          ))}
        </span>
        <button type="button" className="pp-nav__btn" onClick={() => go(page + 1)} disabled={page === pageCount - 1} aria-label="Следваща страница">
          <Icon name="next" size={Math.round(tap * 0.5)} />
        </button>
      </div>
    </div>
  )
}
