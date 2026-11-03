import { useStage } from '../core/Stage'
import { CastleArt, ClockTowerArt, CoasterArt, FerrisWheelArt, NumberTowerArt } from '../components/art/Attractions'
import { Mascot } from '../components/art/Mascot'
import { Bunting, Bush, FloatingBalloon, Flower, SkyAndHills, SkyDefs, Tree } from '../components/scenery/Scenery'
import { GameButton } from '../components/ui/GameButton'
import { SoundControl } from '../components/ui/SoundControl'

interface Props {
  onPlay: () => void
  onAbout: () => void
  onTeacher: () => void
}

/** Панорамна сцена на парка с голямо заглавие. */
export function HomeScreen({ onPlay, onAbout, onTeacher }: Props) {
  const { width: w, height: h, portrait } = useStage()
  const horizon = portrait ? h * 0.66 : h * 0.62

  return (
    <div className="screen home">
      <svg className="scene" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <SkyDefs />
        <SkyAndHills w={w} h={h} horizon={horizon} />
        <FloatingBalloon x={w * 0.3} y={h * 0.3} color="#ff5fa2" s={0.9} />
        <FloatingBalloon x={w * 0.68} y={h * 0.36} color="#2ed1c4" delay={4} />
        <FloatingBalloon x={w * 0.85} y={h * 0.5} color="#ffd23f" delay={8} s={0.8} />

        {portrait ? (
          <>
            <CastleArt x={w * 0.5 - 110} y={horizon - 200} size={220} />
            <FerrisWheelArt x={-60} y={horizon - 300} size={380} />
            <CoasterArt x={w - 330} y={horizon - 230} size={340} />
          </>
        ) : (
          <>
            <NumberTowerArt x={w * 0.5 - 520} y={horizon - 215} size={230} />
            <FerrisWheelArt x={w * 0.5 - 790} y={horizon - 390} size={440} />
            <CoasterArt x={w * 0.5 + 340} y={horizon - 340} size={440} />
          </>
        )}

        {/* преден план */}
        <path
          d={`M0 ${horizon + 60} Q ${w / 2} ${horizon + 10} ${w} ${horizon + 60} V ${h} H 0 Z`}
          fill="url(#grass)"
          stroke="#3b2a5a"
          strokeOpacity="0.25"
          strokeWidth="3"
        />
        <path
          d={`M${w / 2 - 70} ${horizon + 40} Q ${w / 2} ${horizon + 34} ${w / 2 + 70} ${horizon + 40} L ${w / 2 + 300} ${h} H ${w / 2 - 300} Z`}
          fill="url(#path)"
          stroke="#e0a94a"
          strokeWidth="4"
        />
        <Tree x={w * 0.25} y={h - 40} s={0.9} />
        {!portrait && <ClockTowerArt x={w - 300} y={h - 285} size={270} />}
        <Tree x={w * 0.96} y={h - 20} s={1.1} color="#3fb85f" />
        <Bush x={w * 0.36} y={h - 10} s={1.1} />
        <Bush x={w * 0.7} y={h - 10} s={1.1} />
        {[0.14, 0.28, 0.33, 0.7, 0.75, 0.87].map((fx, i) => (
          <Flower key={fx} x={w * fx} y={h - 50 - (i % 2) * 40} color={['#ff5fa2', '#ffd23f', '#9b5de5'][i % 3]} s={1.4} />
        ))}
        <Bunting x1={-20} x2={w / 2} y={0} sag={34} count={10} />
        <Bunting x1={w / 2} x2={w + 20} y={0} sag={34} count={10} />
      </svg>

      <div className="home__top-right">
        <SoundControl />
      </div>

      <div className="home__center">
        <h1 className="title-sign">
          <span className="title-sign__line title-sign__line--1">Математически</span>
          <span className="title-sign__line title-sign__line--2">увеселителен парк</span>
        </h1>
        <div className="home__buttons">
          <GameButton color="pink" size="xl" icon="play" onClick={onPlay} className="home__play">
            Играй
          </GameButton>
          <div className="home__secondary">
            <GameButton color="turquoise" size="lg" icon="info" onClick={onAbout}>
              За играта
            </GameButton>
            <GameButton color="purple" size="lg" icon="teacher" onClick={onTeacher}>
              За учителя
            </GameButton>
          </div>
        </div>
      </div>

      <div className="home__mascot">
        <Mascot mood="cheer" size={portrait ? 170 : 190} />
        <div className="speech-bubble speech-bubble--small">Здравей! Ела да смятаме заедно!</div>
      </div>
    </div>
  )
}
