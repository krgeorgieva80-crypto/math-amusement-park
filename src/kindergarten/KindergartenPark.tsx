/**
 * „Приказен математически парк“ — самостоятелен модул за детската градина.
 * Собствени карта, атракции, герои, игри и учителски настройки; училищният парк не се засяга.
 */
import { useState, type CSSProperties } from 'react'
import { useStage } from '../core/Stage'
import { KgProvider, useKg } from './KgContext'
import type { KgAttractionId } from './curriculum/types'
import { AttractionScreen } from './screens/AttractionScreen'
import { GroupScreen } from './screens/GroupScreen'
import { KgMap } from './screens/KgMap'
import { KgTeacherScreen } from './screens/KgTeacherScreen'
import { FeedBearsGame } from './games/feed-bears/FeedBearsGame'
import { GiantBootsGame } from './games/giant-boots/GiantBootsGame'
import { activityById } from './curriculum/activities'
import './kg.css'

type KgScreen = 'group' | 'map' | 'teacher' | { attraction: KgAttractionId } | { play: string }

export function KindergartenPark({ onExit }: { onExit: () => void }) {
  return (
    <KgProvider>
      <KgRouter onExit={onExit} />
    </KgProvider>
  )
}

function KgRouter({ onExit }: { onExit: () => void }) {
  const { group } = useKg()
  const { scale, portrait } = useStage()
  const [screen, setScreen] = useState<KgScreen>(group ? 'map' : 'group')
  const [returnTo, setReturnTo] = useState<KgScreen>('map')

  const openTeacher = () => {
    setReturnTo(screen)
    setScreen('teacher')
  }

  let content
  if (typeof screen === 'object' && 'play' in screen) {
    const a = activityById(screen.play)
    const back = () => setScreen(a ? { attraction: a.attraction } : 'map')
    content = screen.play === 'giant-boots' ? <GiantBootsGame onExit={back} onMap={() => setScreen('map')} /> : <FeedBearsGame onExit={back} onMap={() => setScreen('map')} />
  } else if (typeof screen === 'object') {
    content = <AttractionScreen id={screen.attraction} onBack={() => setScreen('map')} onPlay={(id) => setScreen({ play: id })} onTeacher={openTeacher} onGroup={() => setScreen('group')} />
  } else if (screen === 'group') {
    content = <GroupScreen onChosen={() => setScreen('map')} onBack={group ? () => setScreen('map') : onExit} />
  } else if (screen === 'teacher') {
    content = <KgTeacherScreen onBack={() => setScreen(returnTo)} onPlay={(id) => setScreen({ play: id })} onGroup={() => setScreen('group')} />
  } else {
    content = <KgMap onOpen={(id) => setScreen({ attraction: id })} onHome={onExit} onGroup={() => setScreen('group')} onTeacher={openTeacher} onPlay={(id) => setScreen({ play: id })} />
  }

  const key = typeof screen === 'object' ? JSON.stringify(screen) : screen
  // реален размер ≥ 64 px за зоните, които докосват малките деца
  const tap = Math.max(120, Math.ceil(64 / scale))
  return (
    <div className={`kg-root ${portrait ? 'is-portrait' : 'is-landscape'}`} style={{ '--kg-s': scale, '--kg-tap': `${tap}px` } as CSSProperties}>
      <div key={key} className="screen-enter">
        {content}
      </div>
    </div>
  )
}
