import { useApp } from '../../../core/AppContext'
import { bestStars } from '../../../core/storage'
import { StarRow } from '../../../components/ui/Effects'
import { GameButton } from '../../../components/ui/GameButton'
import { GradeTicket } from '../../../components/ui/GradeTicket'
import { Icon } from '../../../components/ui/Icon'
import { SoundControl } from '../../../components/ui/SoundControl'
import { BoothBackdrop } from '../../magic-tokens/BoothBackdrop'
import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty, type Grade } from '../../magic-tokens/logic'
import { ACTIVITIES, type ActivityId } from './logic'
import { TableModeArt } from './TableModeArt'

export const TABLE_RESULT_MODE = 'Колелото: Попълни таблицата'

const LEVEL_TEXT: Record<Difficulty, string> = {
  explorer: 'Една таблица, подсказки с „3 · 7“ и броене',
  researcher: 'Няколко таблици, една подсказка на задача',
  master: 'Повече празни и скрити грешки, работиш сам',
}

/** Настройки на „Попълни таблицата“: маршрут или отделна дейност, трудност, таблица. */
export function TableSetup(p: {
  grade: Grade
  gameId: string
  difficulty: Difficulty
  count: number
  locked: boolean
  tables: number[]
  table: number
  activity: ActivityId | 'route'
  onDifficulty: (d: Difficulty) => void
  onCount: (n: number) => void
  onTable: (n: number) => void
  onActivity: (a: ActivityId | 'route') => void
  onStart: () => void
  onBack: () => void
  onExit: () => void
}) {
  const { results, settings, play } = useApp()
  const best = bestStars(
    results.filter((r) => r.mode?.startsWith(TABLE_RESULT_MODE)),
    p.gameId,
    p.grade,
    p.difficulty,
  )
  const pills = <T extends string | number>(label: string, value: T, options: { value: T; label: string; hint?: string }[], on: (v: T) => void, locked: boolean, wide: boolean) => (
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
  return (
    <div className="screen game-setup table-setup">
      <BoothBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="back" onClick={p.onBack}>
          Игри
        </GameButton>
        <GradeTicket grade={p.grade} />
        <div className="level-chip">Попълни таблицата</div>
        <div className="top-bar__spacer" />
        <GameButton color="yellow" size="md" icon="map" onClick={p.onExit}>
          Към парка
        </GameButton>
        <SoundControl />
      </div>
      <div className="setup-card is-compact">
        <div className="setup-card__title">
          <TableModeArt small />
          <span>Попълни таблицата</span>
        </div>
        <div className="setup-grid">
          {pills<ActivityId | 'route'>(
            'Какво ще играеш',
            p.activity,
            [{ value: 'route' as const, label: 'Маршрут (4 станции)', hint: 'Четирите дейности една след друга' }, ...ACTIVITIES.map((a) => ({ value: a.id, label: a.short, hint: a.label }))],
            p.onActivity,
            false,
            true,
          )}
          {pills('Трудност', p.difficulty, DIFFICULTIES.map((x) => ({ value: x, label: DIFFICULTY_LABELS[x], hint: LEVEL_TEXT[x] })), p.onDifficulty, p.locked, false)}
          {p.activity === 'route' ? (
            <div className="setup-row">
              <span className="setup-row__label">Брой задачи</span>
              <div className="wheel-setup-info">
                <span>7 задачи в 4 станции</span>
              </div>
            </div>
          ) : (
            pills('Брой задачи', p.count, [5, 10, 15].map((x) => ({ value: x, label: String(x) })), p.onCount, p.locked, false)
          )}
          {p.difficulty === 'explorer' &&
            pills(
              'Таблица',
              p.table,
              p.tables.map((t) => ({ value: t, label: `с ${t}` })),
              p.onTable,
              false,
              true,
            )}
          <div className="setup-row is-wide">
            <span className="setup-row__label">Какво те чака</span>
            <div className="wheel-setup-info">
              <span>{LEVEL_TEXT[p.difficulty]}</span>
              <span>
                <Icon name="lock" size={18} /> Изучени таблици: {p.tables.join(', ')}
              </span>
              {settings.spinZero && <span>И умножение с 0</span>}
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
