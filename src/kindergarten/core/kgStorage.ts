/**
 * Запис за предучилищния модул — отделно от училищния парк (ключове kg.*).
 * Възрастовата група се пази само в текущия раздел на браузъра (sessionStorage).
 * Резултатите са обобщени по дейност, без лични данни за децата.
 */
import type { AgeGroupId, CoreId } from '../curriculum/types'

const GROUP_KEY = 'kg.group.v1'
const SETTINGS_KEY = 'kg.settings.v1'
const RESULTS_KEY = 'kg.results.v1'
const MAX_RESULTS = 500

export type WorkMode = 'solo' | 'group'

export interface KgSettings {
  /** Звукови ефекти в приказния парк. */
  soundOn: boolean
  /** Гласови инструкции (само записани файлове). */
  voiceOn: boolean
  /** Визуални подсказки след опит. */
  hintsOn: boolean
  /** Самостоятелна работа или групова работа (интерактивен дисплей). */
  workMode: WorkMode
  /** Брой задачи по игра (идентификатор на дейност → брой). */
  taskCounts: Record<string, number>
  /** Игра за занятието, избрана от учителя (показва се като „Днешна игра“ на картата). */
  lesson: { core: CoreId; activityId: string } | null
}

export const DEFAULT_KG_SETTINGS: KgSettings = {
  soundOn: true,
  voiceOn: true,
  hintsOn: true,
  workMode: 'solo',
  taskCounts: {},
  lesson: null,
}

export interface KgResult {
  id: string
  /** ISO дата и час */
  date: string
  activity: string
  group: AgeGroupId
  mode: WorkMode
  tasks: number
  /** Задачи, решени от първия опит. */
  firstTry: number
  /** Задачи, при които е показана визуална подсказка. */
  hinted: number
  durationSec: number
}

function read<T>(store: Storage | undefined, key: string): T | null {
  try {
    const raw = store?.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(store: Storage | undefined, key: string, value: unknown): void {
  try {
    store?.setItem(key, JSON.stringify(value))
  } catch {
    // частен режим или пълно хранилище — играта продължава без запис
  }
}

const session = () => (typeof window === 'undefined' ? undefined : window.sessionStorage)
const local = () => (typeof window === 'undefined' ? undefined : window.localStorage)

export function loadGroup(): AgeGroupId | null {
  const g = read<number>(session(), GROUP_KEY)
  return g === 1 || g === 2 || g === 3 || g === 4 ? g : null
}

export function saveGroup(group: AgeGroupId): void {
  write(session(), GROUP_KEY, group)
}

export function loadKgSettings(): KgSettings {
  const saved = read<Partial<KgSettings>>(local(), SETTINGS_KEY)
  return { ...DEFAULT_KG_SETTINGS, ...saved, taskCounts: { ...DEFAULT_KG_SETTINGS.taskCounts, ...(saved?.taskCounts ?? {}) } }
}

export function saveKgSettings(s: KgSettings): void {
  write(local(), SETTINGS_KEY, s)
}

export function loadKgResults(): KgResult[] {
  return read<KgResult[]>(local(), RESULTS_KEY) ?? []
}

export function addKgResult(r: Omit<KgResult, 'id' | 'date'>): KgResult[] {
  const all = [{ ...r, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, date: new Date().toISOString() }, ...loadKgResults()].slice(0, MAX_RESULTS)
  write(local(), RESULTS_KEY, all)
  return all
}

export function clearKgResults(): void {
  try {
    local()?.removeItem(RESULTS_KEY)
  } catch {
    // нищо
  }
}

/** Обобщение по дейност и група за учителския отчет. */
export function summarize(results: KgResult[]) {
  const map = new Map<string, { activity: string; group: AgeGroupId; sessions: number; tasks: number; firstTry: number; hinted: number; groupSessions: number }>()
  for (const r of results) {
    const k = `${r.activity}|${r.group}`
    const e = map.get(k) ?? { activity: r.activity, group: r.group, sessions: 0, tasks: 0, firstTry: 0, hinted: 0, groupSessions: 0 }
    e.sessions++
    e.tasks += r.tasks
    e.firstTry += r.firstTry
    e.hinted += r.hinted
    if (r.mode === 'group') e.groupSessions++
    map.set(k, e)
  }
  return [...map.values()].sort((a, b) => a.group - b.group || a.activity.localeCompare(b.activity))
}
