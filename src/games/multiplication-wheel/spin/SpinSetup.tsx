import { useApp } from '../../../core/AppContext'
import { bestStars } from '../../../core/storage'
import { FerrisWheelArt } from '../../../components/art/Attractions'
import { StarRow } from '../../../components/ui/Effects'
import { GameButton } from '../../../components/ui/GameButton'
import { GradeTicket } from '../../../components/ui/GradeTicket'
import { Icon } from '../../../components/ui/Icon'
import { SoundControl } from '../../../components/ui/SoundControl'
import { BoothBackdrop } from '../../magic-tokens/BoothBackdrop'
import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty, type Grade } from '../../magic-tokens/logic'
import { SPIN_HELP } from './logic'

export const SPIN_RESULT_MODE = 'Колелото: Завърти колелото'

const LEVEL_TEXT: Record<Difficulty, string> = {
  explorer: 'Една таблица, с подсказки с точки',
  researcher: 'Няколко таблици, една подсказка на задача',
  master: 'Смесени задачи, смяташ сам',
}

/** Настройки на „Завърти колелото“: ниво, брой задачи и таблица (за „Откривател“). */
export function SpinSetup(p: {
  grade: Grade
  gameId: string
  difficulty: Difficulty
  count: number
  locked: boolean
  tables: number[]
  table: number
  onDifficulty: (d: Difficulty) => void
  onCount: (n: number) => void
  onTable: (n: number) => void
  onStart: () => void
  onBack: () => void
  onExit: () => void
}) {
  const { results, settings, play } = useApp()
  const best = bestStars(
    results.filter((r) => r.mode === SPIN_RESULT_MODE),
    p.gameId,
    p.grade,
    p.difficulty,
  )
  const pills = <T extends string | number>(label: string, value: T, options: { value: T; label: string; hint?: string }[], on: (v: T) => void, locked = p.locked, wide = true) => (
    <div className={`setup-row ${wide ? 'is-wide' : ''}`}>
      <span className="setup-row__label">
        {label}
        {locked && <small> · избрано от учителя</small>}
      </span>
      <div className="setup-pills" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            disabled={locked && o.value !== value}
            className={`setup-pill ${o.value === value ? 'is-on' : ''}`}
            title={o.hint}
            onClick={() => {
              if (locked) return
              play('pick')
              on(o.value)
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
  const help = SPIN_HELP[p.difficulty]
  return (
    <div className="screen game-setup spin-setup">
      <BoothBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="back" onClick={p.onBack}>
          Игри
        </GameButton>
        <GradeTicket grade={p.grade} />
        <div className="level-chip">Завърти колелото</div>
        <div className="top-bar__spacer" />
        <GameButton color="yellow" size="md" icon="map" onClick={p.onExit}>
          Към парка
        </GameButton>
        <SoundControl />
      </div>
      <div className="setup-card">
        <div className="setup-card__title">
          <FerrisWheelArt size={84} />
          <span>Завърти колелото</span>
        </div>
        <div className="setup-grid">
          {pills(
            'Трудност',
            p.difficulty,
            DIFFICULTIES.map((x) => ({ value: x, label: DIFFICULTY_LABELS[x], hint: LEVEL_TEXT[x] })),
            p.onDifficulty,
            p.locked,
            false,
          )}
          {pills('Брой задачи', p.count, [5, 10, 15].map((x) => ({ value: x, label: String(x) })), p.onCount, p.locked, false)}
          {p.difficulty === 'explorer' &&
            pills(
              'Таблица',
              p.table,
              p.tables.map((t) => ({ value: t, label: `с ${t}` })),
              p.onTable,
              false,
            )}
          <div className="setup-row is-wide">
            <span className="setup-row__label">Какво те чака</span>
            <div className="wheel-setup-info">
              <span>{LEVEL_TEXT[p.difficulty]}</span>
              <span>
                <Icon name="lock" size={18} /> Изучени таблици: {p.tables.join(', ')}
              </span>
              {settings.spinZero && <span>И числото 0 на колелото</span>}
              {p.difficulty === 'master' && settings.spinMissing && <span>И задачи с липсващ множител</span>}
              {help !== 'none' && !settings.hintsOn && <span>Подсказките са изключени</span>}
            </div>
          </div>
        </div>
        <div className="setup-card__footer">
          <span className="setup-card__best">
            Най-добър резултат: <StarRow stars={best ?? 0} size={28} />
          </span>
          <span className="setup-card__meta">Таблиците се избират от учителя</span>
          <GameButton color="green" size="xl" icon="play" onClick={p.onStart} className="game-intro__start">
            Започни
          </GameButton>
        </div>
      </div>
    </div>
  )
}
