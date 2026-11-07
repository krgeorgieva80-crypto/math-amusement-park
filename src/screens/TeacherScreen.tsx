import { useState } from 'react'
import { useApp } from '../core/AppContext'
import { useStage } from '../core/Stage'
import { loadPlayerGrade } from '../core/storage'
import { SkyAndHills, SkyDefs } from '../components/scenery/Scenery'
import { GameButton, RoundButton } from '../components/ui/GameButton'
import { Icon } from '../components/ui/Icon'
import { Toggle } from '../components/ui/SoundControl'
import { DIFFICULTY_LABELS, GRADES, type Grade } from '../games/magic-tokens/logic'
import { ALL_TABLES } from '../games/multiplication-wheel/spin/logic'

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
  // само за кой клас се редактират таблиците (не е отделен избор на клас за играта)
  const [tableGrade, setTableGrade] = useState<Grade>(() => loadPlayerGrade() ?? 2)

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

      <div className="teacher-layout teacher-layout--v2">
        <div className="teacher-col">
          <section className="teacher-card teacher-card--general">
            <h3 className="teacher-card__title">Поведение на приложението</h3>
            <div className="teacher-toggles">
              <Toggle label="Подсказки" icon="help" on={settings.hintsOn} onChange={(v) => updateSettings({ hintsOn: v })} />
              <Toggle label="Звук" icon="sound" on={settings.soundOn} onChange={(v) => updateSettings({ soundOn: v })} />
              <Toggle label="Музика" icon="music" on={settings.musicOn} disabled={!settings.soundOn} onChange={(v) => updateSettings({ musicOn: v })} />
              <Toggle label="Ученикът избира сам" on={settings.studentCanChoose} onChange={(v) => updateSettings({ studentCanChoose: v })} />
            </div>
            <p className="teacher-note">
              Класът, трудността, броят задачи, обхватът и начинът на работа се избират в самата игра — преди „Започни“. Когато „Ученикът избира сам“ е изключено, остават заключени последно избраните там стойности.
            </p>
          </section>

          <section className="teacher-card teacher-card--subject">
            <h3 className="teacher-card__title">Умножение · „Колелото на умножението“</h3>
            <Segmented<Grade> label="Таблици за" value={tableGrade} options={GRADES.map((g) => ({ value: g, label: `${g}. клас` }))} onChange={setTableGrade} />
            <div className="setting-row setting-row--stack">
              <span className="setting-row__label">Изучени таблици</span>
              <div className="segmented spin-tables" role="group" aria-label={`Изучени таблици за ${tableGrade}. клас`}>
                {ALL_TABLES.map((t) => {
                  const on = settings.spinTables[tableGrade].includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={on}
                      title={on ? `Махни таблицата с ${t}` : `Добави таблицата с ${t}`}
                      className={`segmented__opt ${on ? 'is-on' : ''}`}
                      onClick={() => {
                        const cur = settings.spinTables[tableGrade]
                        // поне една таблица остава активна
                        if (on && cur.length === 1) return
                        const next = on ? cur.filter((x) => x !== t) : [...cur, t].sort((a, b) => a - b)
                        updateSettings({ spinTables: { ...settings.spinTables, [tableGrade]: next } })
                      }}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="teacher-toggles">
              <Toggle label="Умножение с 0" on={settings.spinZero} onChange={(v) => updateSettings({ spinZero: v })} />
              <Toggle label="Липсващ множител (Майстор)" on={settings.spinMissing} onChange={(v) => updateSettings({ spinMissing: v })} />
            </div>
            <p className="teacher-note">Таблиците и умножението с 0 важат за „Завърти колелото“, „Попълни таблицата“ и „Предизвикателството на колелото“ — за всеки клас поотделно и на всички нива.</p>
          </section>
        </div>

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
