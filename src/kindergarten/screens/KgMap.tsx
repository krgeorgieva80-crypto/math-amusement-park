import { useEffect } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useStage } from '../../core/Stage'
import { KG_ATTRACTION_ART } from '../art/KgAttractions'
import { KgMapScene } from '../art/KgScenery'
import { activitiesFor, activityById } from '../curriculum/activities'
import { KG_ATTRACTIONS } from '../curriculum/structure'
import type { KgAttractionId } from '../curriculum/types'
import { useKg } from '../KgContext'
import { KgTopBar } from './KgTopBar'

/**
 * Разположение на атракциите по пътеката: размерът се изчислява от реалното място —
 * ширина и височина на сцената, височина на горната лента и на табелките с имената (те са с минимален реален размер).
 */
function layoutSpots(w: number, h: number, scale: number, portrait: boolean) {
  const topH = Math.max(110, 62 / scale)
  const fName = Math.max(28, 18 / scale)
  const fState = Math.max(22, 16 / scale)
  const signH = 2.25 * fName + 1.9 * fState + 44
  const n = KG_ATTRACTIONS.length
  if (portrait) {
    // зигзаг в две колони; атракциите в една колона са през ред и не бива да се застъпват:
    // разстоянието между тях е 2·(h − лентата − S)/(n − 1) ≥ S + 10, т.е. S ≤ (h − лентата − 50)/3 при n = 5
    const sMax = (2 * (h - topH - 30) - 10 * (n - 1)) / (n + 1)
    const art = Math.max(120, Math.min(300, sMax - signH, w * 0.44 - 40))
    const S = art + signH
    const first = topH + 10 + S / 2
    const last = h - 20 - S / 2
    return { art, pos: KG_ATTRACTIONS.map((_, i) => [i % 2 ? 0.72 * w : 0.28 * w, first + ((last - first) * i) / (n - 1)] as const) }
  }
  // хоризонтално: два реда, колоните се редуват
  const art = Math.max(120, Math.min(250, w * 0.19 - 64, h - topH - signH - 40))
  const S = art + signH
  const y1 = topH + 10 + S / 2
  const y2 = Math.max(y1, h - 14 - S / 2)
  return { art, pos: KG_ATTRACTIONS.map((_, i) => [(0.12 + 0.19 * i) * w, i % 2 ? y2 : y1] as const) }
}

export function KgMap({
  onOpen,
  onHome,
  onGroup,
  onTeacher,
  onPlay,
}: {
  onOpen: (id: KgAttractionId) => void
  onHome: () => void
  onGroup: () => void
  onTeacher: () => void
  onPlay: (activityId: string) => void
}) {
  const { width: w, height: h, portrait, scale } = useStage()
  const { group, settings, play, say } = useKg()
  useEffect(() => {
    say('kg.map')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const { art, pos } = layoutSpots(w, h, scale, portrait)
  const pts = pos.map(([x, y]) => [x, y] as const)
  const path = pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`
    const [px, py] = pts[i - 1]
    const my = (py + y) / 2
    return `${d} C ${px} ${my} ${x} ${my} ${x} ${y}`
  }, '')
  const lesson = settings.lesson ? activityById(settings.lesson.activityId) : undefined
  const lessonReady = lesson && lesson.status === 'ready' && lesson.group === group

  return (
    <div className="screen kg-screen kg-map">
      <KgMapScene w={w} h={h} path={path} />
      <KgTopBar onBack={onHome} backLabel="Начален избор на парк" onGroup={onGroup} onTeacher={onTeacher} title="Приказен математически парк" />
      {KG_ATTRACTIONS.map((a, i) => {
        const [x, y] = pos[i]
        const ready = group ? activitiesFor(group, a.core).filter((x) => x.status === 'ready') : []
        const Art = KG_ATTRACTION_ART[a.id]
        const isLesson = lessonReady && lesson!.attraction === a.id
        return (
          <button
            key={a.id}
            type="button"
            className={`kg-spot ${ready.length ? 'is-ready' : 'is-soon'} ${isLesson ? 'is-lesson' : ''}`}
            style={{ left: x, top: y, width: art + 40 }}
            data-attraction={a.id}
            aria-label={`${a.name}${ready.length ? '' : ' — подготвя се'}`}
            onClick={() => {
              play('click')
              onOpen(a.id)
            }}
          >
            {isLesson && <span className="kg-spot__ribbon">Днешна игра</span>}
            <svg className="kg-spot__art" viewBox="0 0 240 240" width={art} height={art} aria-hidden="true">
              <Art size={240} />
            </svg>
            <span className="kg-spot__sign" style={{ borderColor: a.color }}>
              <span className="kg-spot__name">{a.name}</span>
              {ready.length ? (
                <span className="kg-spot__state is-ready">
                  <Icon name="play" size={26} /> Играй
                </span>
              ) : (
                <span className="kg-spot__state">
                  <Icon name="lock" size={22} /> Подготвя се
                </span>
              )}
            </span>
          </button>
        )
      })}
      {lessonReady && (
        <button type="button" className="kg-lesson-go" onClick={() => onPlay(lesson!.id)}>
          <Icon name="star" size={34} /> {lesson!.title}
        </button>
      )}
    </div>
  )
}
