import { useStage } from '../core/Stage'
import { CastleArt, ClockTowerArt, CoasterArt, FerrisWheelArt, NumberTowerArt } from '../components/art/Attractions'
import { GuideStar } from '../components/art/Mascot'
import { Bench, DistantTrees, FarMountains, Fence, FlowerBed, Lamp, ParkDefs, SmallBush, SunGlow } from '../components/scenery/ParkProps'
import { Bunting, Cloud, FloatingBalloon, Flower, SkyDefs, Sun, Tree } from '../components/scenery/Scenery'
import { GameButton } from '../components/ui/GameButton'
import { SoundControl } from '../components/ui/SoundControl'

interface Props {
  onPlay: () => void
  onAbout: () => void
  onTeacher: () => void
}

const GUIDE_TIPS = [
  'Здравей! Аз съм Звездичка. Ела в парка!',
  'Натисни „Играй“ и избери своя клас.',
  'Всеки атракцион е игра с числа.',
  'За всяка вярна задача печелиш звезди!',
]

/** Пътека в перспектива: тясна в далечината, широка отпред. */
function PerspectivePath({ cx, top, bottom, wTop, wBottom }: { cx: number; top: number; bottom: number; wTop: number; wBottom: number }) {
  const half = (t: number) => (wTop + (wBottom - wTop) * t) / 2
  const yAt = (t: number) => top + (bottom - top) * t
  const outline = `M${cx - wTop / 2} ${top} Q ${cx} ${top - 8} ${cx + wTop / 2} ${top} L ${cx + wBottom / 2} ${bottom} H ${cx - wBottom / 2} Z`
  // Плочките се сгъстяват към хоризонта.
  const bands = Array.from({ length: 9 }, (_, i) => Math.pow((i + 1) / 10, 1.7))
  return (
    <g>
      <path d={outline} fill="url(#path)" stroke="#d39a3f" strokeWidth="5" strokeLinejoin="round" />
      {bands.map((t) => (
        <path key={t} d={`M${cx - half(t)} ${yAt(t)} Q ${cx} ${yAt(t) + 6 * t} ${cx + half(t)} ${yAt(t)}`} fill="none" stroke="#e8b866" strokeWidth={1.5 + 2.5 * t} opacity="0.8" />
      ))}
      <path d={`M${cx} ${top + 4} L ${cx} ${bottom}`} stroke="#fff" strokeOpacity="0.45" strokeWidth="6" strokeDasharray="10 26" />
      {/* бордюр от камъчета */}
      {[-1, 1].map((side) =>
        Array.from({ length: 12 }, (_, i) => {
          const t = Math.pow((i + 0.5) / 12, 1.3)
          return <ellipse key={`${side}-${i}`} cx={cx + side * (half(t) + 4)} cy={yAt(t)} rx={4 + 9 * t} ry={2.5 + 5 * t} fill="url(#pp-stone)" stroke="#3b2a5a" strokeWidth={1 + t} strokeOpacity="0.6" />
        }),
      )}
    </g>
  )
}

/** Панорамна сцена на парка с голямо заглавие. */
export function HomeScreen({ onPlay, onAbout, onTeacher }: Props) {
  const { width: w, height: h, portrait } = useStage()
  const horizon = portrait ? h * 0.64 : h * 0.6
  const cx = w / 2
  const pathTop = horizon + 34
  const wTop = 120
  const wBottom = portrait ? 560 : 720
  const edge = (t: number) => (wTop + (wBottom - wTop) * t) / 2
  const yAt = (t: number) => pathTop + (h - pathTop) * t

  const far = `M0 ${horizon - 10} C ${w * 0.12} ${horizon - 110} ${w * 0.25} ${horizon - 40} ${w * 0.36} ${horizon - 80} S ${w * 0.62} ${horizon - 140} ${w * 0.75} ${horizon - 60} S ${w * 0.92} ${horizon - 110} ${w} ${horizon - 50} V ${h} H0 Z`
  const mid = `M0 ${horizon + 30} C ${w * 0.15} ${horizon - 20} ${w * 0.3} ${horizon + 25} ${w * 0.45} ${horizon + 5} S ${w * 0.75} ${horizon - 30} ${w} ${horizon + 20} V ${h} H0 Z`

  return (
    <div className="screen home">
      <svg className="scene" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <SkyDefs />
        <ParkDefs />
        {/* заден план: небе, слънце, облаци, планини */}
        <rect width={w} height={h} fill="url(#sky)" />
        <SunGlow x={w - 150} y={130} r={380} />
        <Sun x={w - 150} y={130} r={62} />
        <Cloud x={w * 0.04} y={70} s={0.9} speed={140} />
        <Cloud x={w * 0.36} y={150} s={0.6} speed={170} delay={60} />
        <Cloud x={w * 0.62} y={50} s={0.85} speed={155} delay={100} />
        <Cloud x={w * 0.82} y={230} s={0.5} speed={190} delay={20} />
        <FarMountains w={w} base={horizon - 40} />
        <path d={far} fill="url(#hill-far)" stroke="#3b2a5a" strokeWidth="3" strokeOpacity="0.2" />
        <DistantTrees w={w} y={horizon + 4} s={0.8} color="#6cc786" />

        {/* среден план: атракциони */}
        {portrait ? (
          <>
            <CastleArt x={cx - 90} y={horizon - 160} size={180} />
            <FerrisWheelArt x={-70} y={horizon - 330} size={400} />
            <CoasterArt x={w - 360} y={horizon - 270} size={380} />
          </>
        ) : (
          <>
            <CastleArt x={cx + 140} y={horizon - 150} size={170} />
            <NumberTowerArt x={cx - 500} y={horizon - 210} size={225} />
            <FerrisWheelArt x={cx - 800} y={horizon - 410} size={460} />
            <CoasterArt x={cx + 320} y={horizon - 350} size={460} />
          </>
        )}

        <path d={mid} fill="url(#hill-mid)" stroke="#3b2a5a" strokeWidth="3" strokeOpacity="0.25" />
        <Fence x1={-10} x2={cx - wTop / 2 - 30} y={horizon + 40} s={0.8} />
        <Fence x1={cx + wTop / 2 + 30} x2={w + 10} y={horizon + 40} s={0.8} />

        {/* преден план: поляна, пътека, лехи, фенери */}
        <path d={`M0 ${horizon + 56} Q ${cx} ${horizon + 16} ${w} ${horizon + 56} V ${h} H 0 Z`} fill="url(#grass)" stroke="#3b2a5a" strokeOpacity="0.2" strokeWidth="3" />
        <PerspectivePath cx={cx} top={pathTop} bottom={h + 4} wTop={wTop} wBottom={wBottom} />
        <FlowerBed x={cx - edge(0.3) - 190} y={yAt(0.3)} s={0.8} />
        <FlowerBed x={cx + edge(0.3) + 190} y={yAt(0.3)} s={0.8} palette={['#2ed1c4', '#ffd23f', '#ff5fa2', '#9b5de5']} />
        {[0.15, 0.62].map((t) => (
          <g key={t}>
            <Lamp x={cx - edge(t) - 22} y={yAt(t)} s={0.45 + 0.6 * t} />
            <Lamp x={cx + edge(t) + 22} y={yAt(t)} s={0.45 + 0.6 * t} />
          </g>
        ))}
        {!portrait && <Bench x={cx + edge(0.5) + 230} y={yAt(0.5)} s={1} />}
        {!portrait && <ClockTowerArt x={w - 290} y={h - 290} size={270} />}
        <Tree x={portrait ? w * 0.9 : w * 0.97} y={h - 14} s={1.05} color="#3fb85f" />
        <SmallBush x={portrait ? w * 0.68 : w * 0.72} y={h - 8} s={1.2} />
        <SmallBush x={portrait ? w * 0.3 : w * 0.33} y={h - 6} s={1.1} color="#4fc46a" />
        {[0.38, 0.62, 0.66].map((fx, i) => (
          <Flower key={fx} x={w * fx + (i === 2 ? 40 : 0)} y={h - 60 - (i % 2) * 30} color={['#ff5fa2', '#ffd23f', '#9b5de5'][i % 3]} s={1.3} />
        ))}
        <FloatingBalloon x={w * 0.3} y={h * 0.3} color="#ff5fa2" s={0.85} />
        <FloatingBalloon x={w * 0.69} y={h * 0.34} color="#2ed1c4" delay={5} s={0.9} />
        <FloatingBalloon x={w * 0.86} y={h * 0.5} color="#ffd23f" delay={9} s={0.75} />
        <Bunting x1={-20} x2={cx} y={0} sag={34} count={10} />
        <Bunting x1={cx} x2={w + 20} y={0} sag={34} count={10} />
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

      <GuideStar className="home__guide" tips={GUIDE_TIPS} size={portrait ? 150 : 170} />
    </div>
  )
}
