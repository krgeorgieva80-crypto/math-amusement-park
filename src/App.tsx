import { useState } from 'react'
import { AppProvider, useApp } from './core/AppContext'
import { Stage } from './core/Stage'
import type { Grade } from './games/magic-tokens/logic'
import { MagicTokensGame } from './games/magic-tokens/MagicTokensGame'
import { MultiplicationWheelGame } from './games/multiplication-wheel/MultiplicationWheelGame'
import { AboutScreen } from './screens/AboutScreen'
import { GradeScreen } from './screens/GradeScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ParkMap } from './screens/ParkMap'
import { PassportScreen } from './screens/PassportScreen'
import { TowerPrototype } from './games/number-tower/TowerPrototype'
import { NumberTowerGame } from './games/number-tower/NumberTowerGame'
import { TeacherScreen } from './screens/TeacherScreen'
import type { AttractionId } from './attractions/registry'
import { loadPlayerGrade, savePlayerGrade } from './core/storage'
import { parkFromUrl, type ParkId } from './core/audiences'
import { ParkChooser } from './screens/ParkChooser'
import { KindergartenPark } from './kindergarten/KindergartenPark'
import './styles/parks.css'

export type ScreenName = 'home' | 'about' | 'teacher' | 'grade' | 'map' | 'passport' | { game: AttractionId }

/** Училищният парк („Математически увеселителен парк“) — непроменен; onSwitchPark води към началния избор. */
function Router({ onSwitchPark }: { onSwitchPark: () => void }) {
  const { settings } = useApp()
  const [screen, setScreen] = useState<ScreenName>('home')
  const [returnTo, setReturnTo] = useState<ScreenName>('home')
  // печатите, ударени току-що (анимация „удар“ в паспорта)
  const [freshStamps, setFreshStamps] = useState<string[]>([])
  // Класът се избира само веднъж — с билетите — и се пази локално.
  const [savedGrade, setSavedGrade] = useState<Grade | null>(loadPlayerGrade)
  const [chosenGrade, setChosenGrade] = useState<Grade>(() => savedGrade ?? settings.grade)
  // Единствен източник: класът от билетите. При заключен избор остава последно избраният.
  const grade: Grade = chosenGrade
  const chooseGrade = (g: Grade) => {
    setChosenGrade(g)
    setSavedGrade(g)
    savePlayerGrade(g)
  }

  const openOverlay = (target: 'about' | 'teacher') => {
    setReturnTo(screen)
    setScreen(target)
  }

  let content
  if (typeof screen === 'object') {
    // Всеки атракцион е отделен модул; класът идва от общото състояние.
    content =
      screen.game === 'multiplication-wheel' ? (
        <MultiplicationWheelGame grade={grade} onExit={() => setScreen('map')} />
      ) : screen.game === 'number-tower' ? (
        <NumberTowerGame grade={grade} onExit={() => setScreen('map')} />
      ) : (
        <MagicTokensGame grade={grade} onExit={() => setScreen('map')} />
      )
  } else {
    switch (screen) {
      case 'home':
        content = (
          <HomeScreen onPlay={() => setScreen(settings.studentCanChoose ? 'grade' : 'map')} onAbout={() => openOverlay('about')} onTeacher={() => openOverlay('teacher')} onSwitchPark={onSwitchPark} />
        )
        break
      case 'grade':
        content = (
          <GradeScreen
            selected={grade}
            lastGrade={savedGrade}
            onSelect={(g) => {
              chooseGrade(g)
              setScreen('map')
            }}
            onBack={() => setScreen('home')}
          />
        )
        break
      case 'map':
        content = (
          <ParkMap
            grade={grade}
            onOpen={(id) => setScreen({ game: id })}
            onHome={() => setScreen('home')}
            onChangeGrade={() => setScreen('grade')}
            onTeacher={() => openOverlay('teacher')}
            onPassport={(fresh) => {
              setFreshStamps(fresh)
              setScreen('passport')
            }}
          />
        )
        break
      case 'passport':
        content = <PassportScreen grade={grade} fresh={freshStamps} onBack={() => setScreen('map')} onOpen={(id) => setScreen({ game: id })} />
        break
      case 'about':
        content = <AboutScreen onBack={() => setScreen(returnTo)} />
        break
      case 'teacher':
        content = <TeacherScreen onBack={() => setScreen(returnTo)} />
        break
    }
  }

  // Етап 1: визуалният прототип на „Кулата на числата“ — само при разработка
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('prototype') === 'number-tower') return <TowerPrototype />
  const key = typeof screen === 'object' ? `game-${screen.game}` : screen
  return (
    <div key={key} className="screen-enter">
      {content}
    </div>
  )
}

/** Начален избор: приказният парк за детската градина или увеселителният парк за началното училище. */
function Root() {
  const [park, setPark] = useState<ParkId | null>(parkFromUrl)
  if (park === 'school') return <Router onSwitchPark={() => setPark(null)} />
  if (park === 'kindergarten') return <KindergartenPark onExit={() => setPark(null)} />
  return (
    <div key="chooser" className="screen-enter">
      <ParkChooser onChoose={setPark} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Stage>
        <Root />
      </Stage>
    </AppProvider>
  )
}
