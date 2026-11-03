import { useState } from 'react'
import { AppProvider, useApp } from './core/AppContext'
import { Stage } from './core/Stage'
import type { Grade } from './games/magic-tokens/logic'
import { MagicTokensGame } from './games/magic-tokens/MagicTokensGame'
import { AboutScreen } from './screens/AboutScreen'
import { GradeScreen } from './screens/GradeScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ParkMap } from './screens/ParkMap'
import { TeacherScreen } from './screens/TeacherScreen'
import type { AttractionId } from './attractions/registry'

export type ScreenName = 'home' | 'about' | 'teacher' | 'grade' | 'map' | { game: AttractionId }

function Router() {
  const { settings } = useApp()
  const [screen, setScreen] = useState<ScreenName>('home')
  const [returnTo, setReturnTo] = useState<ScreenName>('home')
  const [grade, setGrade] = useState<Grade>(settings.grade)

  const openOverlay = (target: 'about' | 'teacher') => {
    setReturnTo(screen)
    setScreen(target)
  }

  let content
  if (typeof screen === 'object') {
    // Тук се добавят следващите атракциони.
    content = <MagicTokensGame grade={grade} onGradeChange={setGrade} onExit={() => setScreen('map')} />
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
            onSelect={(g) => {
              setGrade(g)
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
            onBack={() => {
              // Ако учителят е заключил избора, ученикът играе в избрания клас.
              if (!settings.studentCanChoose) setGrade(settings.grade)
              setScreen(returnTo)
            }}
            onGradeChange={setGrade}
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
