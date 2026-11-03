import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { sound, type SoundName } from './sound'
import { addResult, clearResults, loadResults, loadSettings, saveSettings, type GameResult, type Settings } from './storage'

interface AppContextValue {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  results: GameResult[]
  saveResult: (r: Omit<GameResult, 'id' | 'date'>) => void
  resetResults: () => void
  play: (name: SoundName) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [results, setResults] = useState<GameResult[]>(loadResults)

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  useEffect(() => {
    sound.enabled = settings.soundOn
    sound.setVolume(settings.volume)
  }, [settings.soundOn, settings.volume])

  // Музиката тръгва след първото докосване (изискване на браузърите).
  useEffect(() => {
    if (!settings.musicOn || !settings.soundOn) {
      sound.stopMusic()
      return
    }
    const start = () => sound.startMusic()
    start()
    window.addEventListener('pointerdown', start, { once: true })
    return () => window.removeEventListener('pointerdown', start)
  }, [settings.musicOn, settings.soundOn])

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      updateSettings,
      results,
      saveResult: (r) => setResults(addResult(r)),
      resetResults: () => {
        clearResults()
        setResults([])
      },
      play: (name) => sound.play(name),
    }),
    [settings, updateSettings, results],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp трябва да се използва в AppProvider')
  return ctx
}
