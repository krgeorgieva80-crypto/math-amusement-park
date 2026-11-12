import { useState } from 'react'
import { GameButton } from '../../components/ui/GameButton'
import { Toggle } from '../../components/ui/SoundControl'
import { useStage } from '../../core/Stage'
import { ChooserScene } from '../art/KgScenery'
import { activitiesFor, activityById } from '../curriculum/activities'
import { CORES, groupById } from '../curriculum/structure'
import type { CoreId } from '../curriculum/types'
import { summarize } from '../core/kgStorage'
import { allPhrases } from '../core/phrases'
import { useKg } from '../KgContext'
import { KgTopBar } from './KgTopBar'

function Segmented<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; disabled?: boolean }[]; onChange: (v: T) => void }) {
  return (
    <div className="setting-row setting-row--stack">
      <span className="setting-row__label">{label}</span>
      <div className="segmented kg-segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            disabled={o.disabled}
            className={`segmented__opt ${o.value === value ? 'is-on' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Учителски панел за приказния парк — отделен от училищния. Групата се избира при влизане; тук само се вижда и сменя. */
export function KgTeacherScreen({ onBack, onPlay, onGroup }: { onBack: () => void; onPlay: (activityId: string) => void; onGroup: () => void }) {
  const { width: w, height: h } = useStage()
  const { group, settings, updateSettings, results, resetResults, recordedPhrases } = useKg()
  const [core, setCore] = useState<CoreId>(settings.lesson?.core ?? 'quantity')
  const [confirm, setConfirm] = useState(false)
  const g = group ? groupById(group) : null
  const activity = group ? activitiesFor(group, core)[0] : undefined
  const ready = activity?.status === 'ready'
  const count = activity ? (settings.taskCounts[activity.id] ?? activity.taskCount.default) : 0
  const isLesson = settings.lesson?.activityId === activity?.id
  const summary = summarize(results)
  const phrases = allPhrases().length

  return (
    <div className="screen kg-screen kg-teacher">
      <ChooserScene w={w} h={h} />
      <KgTopBar onBack={onBack} backLabel="Назад" title="За учителя · Детска градина" />
      <div className="kg-teacher__body">
        <section className="teacher-card kg-tcard">
          <h3 className="teacher-card__title">Група и игра за занятието</h3>
          <div className="kg-tcard__row">
            <span className="setting-row__label">Текуща група:</span>
            <span className="kg-chip" style={{ background: g?.color }}>
              {g ? `${g.name} · ${g.ages}` : 'не е избрана'}
            </span>
            <GameButton color="yellow" size="sm" onClick={onGroup}>
              Смени групата
            </GameButton>
          </div>
          <Segmented label="Образователно ядро" value={core} options={CORES.map((c) => ({ value: c.id, label: c.name }))} onChange={setCore} />
          {activity && (
            <div className={`kg-activity ${ready ? 'is-ready' : 'is-planned'}`} data-activity={activity.id}>
              <div className="kg-activity__head">
                <b>{activity.title}</b>
                <span className={`kg-badge ${ready ? 'is-ready' : ''}`}>{ready ? 'Готова' : 'Подготвя се'}</span>
              </div>
              <dl className="kg-activity__spec">
                <dt>Очакван резултат по стандарта</dt>
                <dd className={activity.normative.status === 'pending' ? 'is-pending' : ''}>{activity.normative.status === 'pending' ? 'За проверка' : activity.normative.text}</dd>
                <dt>Насоченост на играта (предложение)</dt>
                <dd>{activity.targetOutcome}</dd>
                <dt>Педагогическа цел (предложение)</dt>
                <dd>{activity.pedagogicalGoal}</dd>
                <dt>Критерий за успех</dt>
                <dd>{activity.successCriterion}</dd>
              </dl>
              {ready && (
                <>
                  <Segmented
                    label="Брой задачи"
                    value={count}
                    options={Array.from({ length: activity.taskCount.max - activity.taskCount.min + 1 }, (_, i) => activity.taskCount.min + i).map((n) => ({ value: n, label: String(n) }))}
                    onChange={(n) => updateSettings({ taskCounts: { ...settings.taskCounts, [activity.id]: n } })}
                  />
                  <div className="kg-tcard__actions">
                    <GameButton color="green" size="md" icon="play" onClick={() => onPlay(activity.id)}>
                      Започни сега
                    </GameButton>
                    {isLesson ? (
                      <GameButton color="orange" size="md" icon="close" onClick={() => updateSettings({ lesson: null })}>
                        Премахни „Днешна игра“
                      </GameButton>
                    ) : (
                      <GameButton color="turquoise" size="md" icon="star" onClick={() => updateSettings({ lesson: { core, activityId: activity.id } })}>
                        Покажи като „Днешна игра“
                      </GameButton>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        <section className="teacher-card kg-tcard">
          <h3 className="teacher-card__title">Звук, глас и подсказки</h3>
          <div className="teacher-toggles">
            <Toggle label="Звукови ефекти" icon="sound" on={settings.soundOn} onChange={(v) => updateSettings({ soundOn: v })} />
            <Toggle label="Гласови инструкции" icon="music" on={settings.voiceOn} onChange={(v) => updateSettings({ voiceOn: v })} />
            <Toggle label="Визуални подсказки" icon="help" on={settings.hintsOn} onChange={(v) => updateSettings({ hintsOn: v })} />
          </div>
          <p className="teacher-note" data-test-voice={recordedPhrases}>
            Гласовите инструкции се пускат само от предварително записани файлове на български език (без синтезиран глас). Записани фрази: {Math.min(recordedPhrases, phrases)} от {phrases}. Без запис
            инструкцията се показва като текст с илюстрация.
          </p>
          <Segmented
            label="Начин на работа"
            value={settings.workMode}
            options={[
              { value: 'solo', label: 'Самостоятелна' },
              { value: 'group', label: 'Групова (интерактивен дисплей)' },
            ]}
            onChange={(v) => updateSettings({ workMode: v })}
          />
        </section>

        <section className="teacher-card kg-tcard kg-tcard--report">
          <h3 className="teacher-card__title">Обобщен отчет</h3>
          <p className="teacher-note">Пазят се само обобщени данни на това устройство — без имена и лични данни на децата.</p>
          {summary.length === 0 ? (
            <div className="results-empty">Все още няма изиграни игри.</div>
          ) : (
            <table className="results-table kg-report">
              <thead>
                <tr>
                  <th>Игра</th>
                  <th>Група</th>
                  <th>Игри</th>
                  <th>Задачи</th>
                  <th>От първия опит</th>
                  <th>С подсказка</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((r) => (
                  <tr key={`${r.activity}-${r.group}`}>
                    <td>{activityById(r.activity)?.title ?? r.activity}</td>
                    <td>{groupById(r.group).short}</td>
                    <td>
                      {r.sessions}
                      {r.groupSessions ? ` (${r.groupSessions} групови)` : ''}
                    </td>
                    <td>{r.tasks}</td>
                    <td>{r.firstTry}</td>
                    <td>{r.hinted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {summary.length > 0 &&
            (confirm ? (
              <div className="kg-tcard__actions">
                <GameButton color="orange" size="sm" icon="trash" onClick={() => (resetResults(), setConfirm(false))}>
                  Да, изтрий отчета
                </GameButton>
                <GameButton color="turquoise" size="sm" onClick={() => setConfirm(false)}>
                  Отказ
                </GameButton>
              </div>
            ) : (
              <GameButton color="orange" size="sm" icon="trash" onClick={() => setConfirm(true)}>
                Изтрий отчета
              </GameButton>
            ))}
        </section>
      </div>
    </div>
  )
}
