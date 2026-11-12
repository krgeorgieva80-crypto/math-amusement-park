import { useEffect, type CSSProperties } from 'react'
import { useStage } from '../../core/Stage'
import { Bear } from '../art/Bears'
import { ChooserScene } from '../art/KgScenery'
import { AGE_GROUPS } from '../curriculum/structure'
import type { AgeGroupId } from '../curriculum/types'
import type { BearId } from '../games/feed-bears/logic'
import { useKg } from '../KgContext'
import { KgTopBar } from './KgTopBar'

const BEAR_OF: Record<AgeGroupId, BearId> = { 1: 'small', 2: 'mid', 3: 'big', 4: 'big' }
/** Мечето расте с групата (дял от височината на мястото за илюстрация). */
const BEAR_SIZE: Record<AgeGroupId, number> = { 1: 0.72, 2: 0.82, 3: 0.92, 4: 1 }

/** Избор на възрастова група. Изборът се пази в текущия раздел на браузъра. */
export function GroupScreen({ onChosen, onBack }: { onChosen: () => void; onBack: () => void }) {
  const { width: w, height: h } = useStage()
  const { group, setGroup, play, say } = useKg()
  useEffect(() => {
    say('kg.groups')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="screen kg-screen kg-groups">
      <ChooserScene w={w} h={h} />
      <KgTopBar onBack={onBack} backLabel="Назад" />
      <h1 className="kg-heading">Коя група сме?</h1>
      <div className="kg-groups__grid">
        {AGE_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`kg-group-card ${group === g.id ? 'is-current' : ''}`}
            style={{ '--card': g.color, '--gs': BEAR_SIZE[g.id] } as CSSProperties}
            data-group={g.id}
            onClick={() => {
              play('pick')
              setGroup(g.id)
              onChosen()
            }}
          >
            <span className="kg-group-card__num">{g.id}</span>
            <span className="kg-group-card__art" aria-hidden="true">
              <Bear id={BEAR_OF[g.id]} mood={group === g.id ? 'happy' : 'idle'} size={300} />
            </span>
            <span className="kg-group-card__name">{g.name}</span>
            <span className="kg-group-card__ages">{g.ages}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
