import type { ReactNode } from 'react'
import { GameButton } from '../../components/ui/GameButton'
import { SoundControl } from '../../components/ui/SoundControl'
import { useKg } from '../KgContext'
import { groupById } from '../curriculum/structure'

/** Горна лента в приказния парк: назад, група, заглавие, учител, звук. */
export function KgTopBar({
  onBack,
  backLabel,
  onGroup,
  onTeacher,
  title,
  extra,
}: {
  onBack: () => void
  backLabel: string
  onGroup?: () => void
  onTeacher?: () => void
  title?: string
  extra?: ReactNode
}) {
  const { group } = useKg()
  const g = group ? groupById(group) : null
  return (
    <div className="kg-top">
      <GameButton color="yellow" size="md" icon="back" onClick={onBack} aria-label={backLabel} title={backLabel} className="kg-top__back" />
      {g &&
        (onGroup ? (
          <button type="button" className="kg-chip kg-chip--group" style={{ background: g.color }} onClick={onGroup} title="Смени групата">
            {g.name}
          </button>
        ) : (
          <span className="kg-chip kg-chip--group" style={{ background: g.color }}>
            {g.name}
          </span>
        ))}
      {title && <h1 className="kg-top__title">{title}</h1>}
      <span className="kg-top__spacer" />
      {extra}
      {onTeacher && <GameButton color="purple" size="md" icon="teacher" onClick={onTeacher} aria-label="За учителя" title="За учителя" />}
      <SoundControl />
    </div>
  )
}
