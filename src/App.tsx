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
import { TeacherScreen } from './screens/TeacherScreen'
import type { AttractionId } from './attractions/registry'
import { loadPlayerGrade, savePlayerGrade } from './core/storage'

export type ScreenName = 'home' | 'about' | 'teacher' | 'grade' | 'map' | { game: AttractionId }

function Router() {
  const { settings } = useApp()
  const [screen, setScreen] = useState<ScreenName>('home')
  const [returnTo, setReturnTo] = useState<ScreenName>('home')
  // Класът се избира само веднъж — с билетите — и се пази локално.
  const [savedGrade, setSavedGrade] = useState<Grade | null>(loadPlayerGrade)
  const [chosenGrade, setChosenGrade] = useState<Grade>(() => savedGrade ?? settings.grade)
  // Когато учителят е заключил избора, всички игри използват неговия клас.
  const grade: Grade = settings.studentCanChoose ? chosenGrade : settings.grade
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
      ) : (
        <MagicTokensGame grade={grade} onExit={() => setScreen('map')} />
      )
  } else {
    switch (screen) {
      case 'home':
        content = (
          <HomeScreen
            onPlay={() => setScreen(settings.studentCanChoose ? 'grade' : 'map')}
            onAbout={() => openOverlay('about')}
            onTeacher={() => openOverlay('teacher')}
          />
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
          />
        )
        break
      case 'about':
        content = <AboutScreen onBack={() => setScreen(returnTo)} />
        break
      case 'teacher':
        content = (
          <TeacherScreen
            onBack={() => setScreen(returnTo)}
          />
        )
        break
    }
  }

  const key = typeof screen === 'object' ? `game-${screen.game}` : screen
  return (
    <div key={key} className="screen-enter">
      {content}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Stage>
        <Router />
      </Stage>
    </AppProvider>
  )
}
