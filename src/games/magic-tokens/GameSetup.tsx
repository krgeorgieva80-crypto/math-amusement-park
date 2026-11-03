import { useApp } from '../../core/AppContext'
import { bestStars } from '../../core/storage'
import { Mascot } from '../../components/art/Mascot'
import { StarRow } from '../../components/ui/Effects'
import { GameButton } from '../../components/ui/GameButton'
import { SoundControl } from '../../components/ui/SoundControl'
import { BoothBackdrop } from './BoothBackdrop'
import { WORK_MODE_LABELS } from './compute'
import { DIFFICULTIES, DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS, GRADES, type Difficulty, type Grade } from './logic'
import {
  CHALLENGE_KINDS,
  CHALLENGE_LABELS,
  COMPOSE_TOPIC_LABELS,
  GRADE_RANGES,
  MODE_LABELS,
  RANGES,
  REGROUPING_LABELS,
  applicableOptions,
  type ChallengeKind,
  type ComposeTopic,
  type RangeId,
  type Regrouping,
  type TokensConfig,
} from './tasks'

function Pills<T extends string | number>({ label, value, options, onChange, locked, wide }: { label: string; value: T; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void; locked?: boolean; wide?: boolean }) {
  const { play } = useApp()
  return (
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
            onClick={() => {
              if (locked) return
              play('pick')
              onChange(o.value)
            }}
            title={o.hint}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Избор на учебно съдържание — показват се само приложимите опции. */
export function GameSetup({ config, onChange, onStart, onBack, onExit }: { config: TokensConfig; onChange: (c: TokensConfig) => void; onStart: () => void; onBack: () => void; onExit: () => void }) {
  const { settings, results } = useApp()
  const locked = !settings.studentCanChoose
  const show = applicableOptions(config.mode, config.composeTopic, config.challenge)
  const set = (patch: Partial<TokensConfig>) => onChange({ ...config, ...patch })

  const setGrade = (g: Grade) => {
    const ranges = GRADE_RANGES[g]
    set({ grade: g, range: ranges.includes(config.range) ? config.range : ranges[settings.tokensRange === 'small' ? 0 : 1] })
  }

  return (
    <div className="screen game-setup">
      <BoothBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="back" onClick={onBack}>
          Игри
        </GameButton>
        <div className="level-chip">{MODE_LABELS[config.mode]}</div>
        <div className="top-bar__spacer" />
        <GameButton color="yellow" size="md" icon="map" onClick={onExit}>
          Към парка
        </GameButton>
        <SoundControl />
      </div>

      <div className="setup-card">
        <div className="setup-card__title">
          <Mascot mood="happy" size={92} />
          <span>{MODE_LABELS[config.mode]}</span>
        </div>
        <div className="setup-grid">
          <Pills<Grade> label="Клас" value={config.grade} locked={locked} options={GRADES.map((g) => ({ value: g, label: `${g}. клас` }))} onChange={setGrade} />
          {show.range && (
            <Pills<RangeId> label="Числов обхват" value={config.range} locked={locked} options={GRADE_RANGES[config.grade].map((r) => ({ value: r, label: RANGES[r].label }))} onChange={(range) => set({ range })} />
          )}
          {show.composeTopic && (
            <Pills<ComposeTopic>
              label="Вид задачи"
              wide
              value={config.composeTopic}
              options={(Object.keys(COMPOSE_TOPIC_LABELS) as ComposeTopic[]).map((t) => ({ value: t, label: COMPOSE_TOPIC_LABELS[t] }))}
              onChange={(composeTopic) => set({ composeTopic })}
            />
          )}
          {show.challenge && (
            <Pills<ChallengeKind | 'mixed'>
              label="Вид предизвикателство"
              wide
              value={config.challenge}
              options={[{ value: 'mixed' as const, label: 'Смесени' }, ...CHALLENGE_KINDS.map((k) => ({ value: k, label: CHALLENGE_LABELS[k] }))]}
              onChange={(challenge) => set({ challenge })}
            />
          )}
          {show.regrouping && (
            <Pills<Regrouping>
              label="Преминаване през десетицата"
              value={config.regrouping}
              locked={locked}
              options={(['none', 'with', 'mixed'] as Regrouping[]).map((r) => ({ value: r, label: REGROUPING_LABELS[r] }))}
              onChange={(regrouping) => set({ regrouping })}
            />
          )}
          <Pills<Difficulty>
            label="Трудност"
            value={config.difficulty}
            locked={locked}
            options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABELS[d], hint: DIFFICULTY_DESCRIPTIONS[d] }))}
            onChange={(difficulty) => set({ difficulty })}
          />
          <Pills<number> label="Брой задачи" value={config.count} locked={locked} options={[5, 10, 15].map((n) => ({ value: n, label: String(n) }))} onChange={(count) => set({ count })} />
        </div>
        <div className="setup-card__footer">
          <span className="setup-card__best">
            Най-добър резултат: <StarRow stars={bestStars(results, 'magic-tokens', config.grade, config.difficulty) ?? 0} size={28} />
          </span>
          <span className="setup-card__meta">
            {settings.hintsOn ? 'С подсказки' : 'Подсказките са изключени'}
            {(config.mode === 'add' || config.mode === 'subtract') && (
              <>
                <br />
                Начин на работа: <b>{WORK_MODE_LABELS[settings.tokensWorkMode]}</b>
              </>
            )}
          </span>
          <GameButton color="green" size="xl" icon="play" onClick={onStart} className="game-intro__start">
            Започни
          </GameButton>
        </div>
      </div>
    </div>
  )
}
