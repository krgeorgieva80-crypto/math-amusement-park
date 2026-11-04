import { useState } from 'react'
import { useApp } from '../core/AppContext'
import { useStage } from '../core/Stage'
import type { TaskCount, TokensRangeLevel, TokensRegrouping, TokensWorkMode } from '../core/storage'
import { SkyAndHills, SkyDefs } from '../components/scenery/Scenery'
import { GameButton, RoundButton } from '../components/ui/GameButton'
import { Icon } from '../components/ui/Icon'
import { Toggle } from '../components/ui/SoundControl'
import { DIFFICULTIES, DIFFICULTY_LABELS, GRADES, type Grade } from '../games/magic-tokens/logic'
import { GRADE_RANGES, RANGES, REGROUPING_LABELS } from '../games/magic-tokens/tasks'
import { WORK_MODE_LABELS, WORK_MODE_SHORT } from '../games/magic-tokens/compute'

function Segmented<T extends string | number>({ options, value, onChange, label }: { options: { value: T; label: string; title?: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  const { play } = useApp()
  return (
    <div className="setting-row">
      <span className="setting-row__label">{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            title={o.title}
            className={`segmented__opt ${o.value === value ? 'is-on' : ''}`}
            onClick={() => {
              play('click')
              onChange(o.value)
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TeacherScreen({ onBack }: { onBack: () => void }) {
  const { width: w, height: h } = useStage()
  const { settings, updateSettings, results, resetResults } = useApp()
  const [confirmClear, setConfirmClear] = useState(false)

  const games = results
  const totalTasks = games.reduce((a, r) => a + r.total, 0)
  const solvedTasks = games.reduce((a, r) => a + r.solved, 0)

  return (
    <div className="screen teacher-screen">
      <svg className="scene" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <SkyDefs />
        <SkyAndHills w={w} h={h} horizon={h * 0.8} />
      </svg>
      <div className="top-bar">
        <RoundButton icon="back" label="Назад" color="yellow" onClick={onBack} />
        <h2 className="top-bar__title">
          <Icon name="teacher" size={40} /> За учителя
        </h2>
        <div className="top-bar__spacer" />
      </div>

      <div className="teacher-layout">
        <section className="teacher-card">
          <h3 className="teacher-card__title">Настройки на играта</h3>
          <Segmented<Grade>
            label="Клас"
            value={settings.grade}
            options={GRADES.map((g) => ({ value: g, label: `${g}. клас` }))}
            onChange={(g) => updateSettings({ grade: g })}
          />
          <Segmented
            label="Степен на трудност"
            value={settings.difficulty}
            options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] }))}
            onChange={(d) => updateSettings({ difficulty: d })}
          />
          <Segmented<TaskCount>
            label="Брой задачи"
            value={settings.taskCount}
            options={[5, 10, 15].map((n) => ({ value: n as TaskCount, label: String(n) }))}
            onChange={(n) => updateSettings({ taskCount: n })}
          />
          <Segmented<TokensRangeLevel>
            label="Числов обхват"
            value={settings.tokensRange}
            options={(['small', 'large'] as TokensRangeLevel[]).map((v, i) => ({ value: v, label: RANGES[GRADE_RANGES[settings.grade][i]].label }))}
            onChange={(v) => updateSettings({ tokensRange: v })}
          />
          <Segmented<TokensRegrouping>
            label="Преминаване"
            value={settings.tokensRegrouping}
            options={(['none', 'with', 'mixed'] as TokensRegrouping[]).map((v) => ({ value: v, label: REGROUPING_LABELS[v] }))}
            onChange={(v) => updateSettings({ tokensRegrouping: v })}
          />
          <Segmented<TokensWorkMode>
            label="Начин на работа"
            value={settings.tokensWorkMode}
            options={(['tokensAndCompute', 'computeOnly', 'tokensOnly'] as TokensWorkMode[]).map((v) => ({ value: v, label: WORK_MODE_SHORT[v], title: WORK_MODE_LABELS[v] }))}
            onChange={(v) => updateSettings({ tokensWorkMode: v })}
          />
          <div className="teacher-toggles">
            <Toggle label="Подсказки" icon="help" on={settings.hintsOn} onChange={(v) => updateSettings({ hintsOn: v })} />
            <Toggle label="Звук" icon="sound" on={settings.soundOn} onChange={(v) => updateSettings({ soundOn: v })} />
            <Toggle label="Музика" icon="music" on={settings.musicOn} disabled={!settings.soundOn} onChange={(v) => updateSettings({ musicOn: v })} />
            <Toggle label="Ученикът избира сам" on={settings.studentCanChoose} onChange={(v) => updateSettings({ studentCanChoose: v })} />
          </div>
          <p className="teacher-note">
            Запазва се автоматично. Обхватът, преминаването и начинът на работа са за „Вълшебните жетони“ (начинът — при събиране и изваждане). При заключен избор учениците избират само режима.
          </p>
        </section>

        <section className="teacher-card teacher-card--results">
          <h3 className="teacher-card__title">Резултати</h3>
          <div className="teacher-summary">
            <div>
              <b>{games.length}</b>
              <span>изиграни игри</span>
            </div>
            <div>
              <b>
                {solvedTasks}/{totalTasks}
              </b>
              <span>решени задачи</span>
            </div>
            <div>
              <b>{totalTasks ? Math.round((solvedTasks / totalTasks) * 100) : 0}%</b>
              <span>успеваемост</span>
            </div>
          </div>
          <div className="results-table-wrap">
            {games.length === 0 ? (
              <div className="results-empty">Все още няма запазени резултати.</div>
            ) : (
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Клас</th>
                    <th>Режим</th>
                    <th>Ниво</th>
                    <th>Решени</th>
                    <th>От 1. опит</th>
                    <th>Звезди</th>
                  </tr>
                </thead>
                <tbody>
                  {games.slice(0, 100).map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.date)}</td>
                      <td>{r.grade}.</td>
                      <td className="results-table__mode">{r.mode ?? 'С различни жетони'}</td>
                      <td>{DIFFICULTY_LABELS[r.difficulty]}</td>
                      <td>
                        {r.solved}/{r.total}
                      </td>
                      <td>{r.firstTry}</td>
                      <td>
                        {r.stars}/{r.maxStars}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="teacher-card__footer">
            <p className="teacher-note">
              <Icon name="lock" size={22} /> Пазят се само анонимни резултати на това устройство — без имена и лични данни.
            </p>
            {confirmClear ? (
              <div className="confirm-row">
                <span>Да изтрия ли всички резултати?</span>
                <GameButton
                  color="pink"
                  size="sm"
                  onClick={() => {
                    resetResults()
                    setConfirmClear(false)
                  }}
                >
                  Да
                </GameButton>
                <GameButton color="yellow" size="sm" onClick={() => setConfirmClear(false)}>
                  Не
                </GameButton>
              </div>
            ) : (
              <GameButton color="pink" size="sm" icon="trash" disabled={games.length === 0} onClick={() => setConfirmClear(true)}>
                Изтрий резултатите
              </GameButton>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
