import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useApp } from '../core/AppContext'
import { sound, type SoundName } from '../core/sound'
import type { AgeGroupId } from './curriculum/types'
import { addKgResult, clearKgResults, loadGroup, loadKgResults, loadKgSettings, saveGroup, saveKgSettings, type KgResult, type KgSettings } from './core/kgStorage'
import { voice } from './core/voice'

interface KgContextValue {
  group: AgeGroupId | null
  setGroup: (g: AgeGroupId) => void
  settings: KgSettings
  updateSettings: (patch: Partial<KgSettings>) => void
  results: KgResult[]
  saveResult: (r: Omit<KgResult, 'id' | 'date'>) => void
  resetResults: () => void
  /** Звуков ефект (само ако звукът в приказния парк е включен). */
  play: (name: SoundName) => void
  /** Гласова инструкция; връща false, ако няма запис. */
  say: (id: string) => boolean
  /** Няколко фрази една след друга (един канал). */
  sayAll: (ids: string[]) => boolean
  hasVoice: (id: string) => boolean
  speaking: string | null
  recordedPhrases: number
}

const KgContext = createContext<KgContextValue | null>(null)

export function KgProvider({ children }: { children: ReactNode }) {
  const app = useApp()
  const [group, setGroupState] = useState<AgeGroupId | null>(loadGroup)
  const [settings, setSettings] = useState<KgSettings>(loadKgSettings)
  const [results, setResults] = useState<KgResult[]>(loadKgResults)
  const [speaking, setSpeaking] = useState<string | null>(null)
  const [recorded, setRecorded] = useState(voice.recorded)

  useEffect(() => {
    let alive = true
    voice.load().then(() => alive && setRecorded(voice.recorded))
    const off = voice.subscribe(setSpeaking)
    return () => {
      alive = false
      off()
      voice.stop()
    }
  }, [])

  // Звукът в приказния парк: общият звук на приложението И настройката на учителя за детската градина.
  useEffect(() => {
    sound.enabled = app.settings.soundOn && settings.soundOn
    voice.enabled = settings.voiceOn
    voice.volume = Math.min(1, app.settings.volume + 0.2)
    if (!settings.voiceOn) voice.stop()
    return () => {
      sound.enabled = app.settings.soundOn
    }
  }, [app.settings.soundOn, app.settings.volume, settings.soundOn, settings.voiceOn])

  const updateSettings = useCallback((patch: Partial<KgSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveKgSettings(next)
      return next
    })
  }, [])

  const value = useMemo<KgContextValue>(
    () => ({
      group,
      setGroup: (g) => {
        saveGroup(g)
        setGroupState(g)
      },
      settings,
      updateSettings,
      results,
      saveResult: (r) => setResults(addKgResult(r)),
      resetResults: () => {
        clearKgResults()
        setResults([])
      },
      play: (name) => {
        if (settings.soundOn) sound.play(name)
      },
      say: (id) => voice.say(id),
      sayAll: (ids) => voice.sayAll(ids),
      hasVoice: (id) => settings.voiceOn && recorded > 0 && voice.has(id),
      speaking,
      recordedPhrases: recorded,
    }),
    [group, settings, updateSettings, results, speaking, recorded],
  )

  return <KgContext.Provider value={value}>{children}</KgContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useKg(): KgContextValue {
  const ctx = useContext(KgContext)
  if (!ctx) throw new Error('useKg трябва да се използва в KgProvider')
  return ctx
}
