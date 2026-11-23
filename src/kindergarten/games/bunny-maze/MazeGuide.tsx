/**
 * Указания с картинки и примери за „Зайчето в лабиринта“ — за деца, които още не четат,
 * докато няма гласови записи. Картинката повтаря указанието (не е подсказка), а примерите
 * преди всяка мисия показват понятията с други предмети, за да не издават отговора.
 */
import type { ReactNode } from 'react'
import { Basket, BigMushroom, Bunny, Chick, Fence, Frog, GiftArt, HillTree, MagicDoor, MazeDefs, Pond, Socket, Stone, Sun, TreasureArt } from './MazeArt'
import type { Gift, MissionId, Step, Vertical } from './logic'

const O = '#4a3560'
const GLOW = '#ffc93c'

/** Стрелка от (x1, y1) до (x2, y2). */
function Arrow({ x1, y1, x2, y2, w = 7, color = '#ff7aa8' }: { x1: number; y1: number; x2: number; y2: number; w?: number; color?: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const h = w * 2.6
  const p = (d: number, s: number) => `${x2 - Math.cos(a) * h + Math.cos(a + (s * Math.PI) / 2) * d} ${y2 - Math.sin(a) * h + Math.sin(a + (s * Math.PI) / 2) * d}`
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - Math.cos(a) * h * 0.8} y2={y2 - Math.sin(a) * h * 0.8} stroke={O} strokeWidth={w + 5} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2 - Math.cos(a) * h * 0.8} y2={y2 - Math.sin(a) * h * 0.8} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={`M${x2} ${y2} L ${p(h * 0.75, 1)} L ${p(h * 0.75, -1)} Z`} fill={color} stroke={O} strokeWidth="3" strokeLinejoin="round" />
    </g>
  )
}

/** Светло петно за мястото, за което става дума. */
const Spot = ({ cx, cy, r = 22 }: { cx: number; cy: number; r?: number }) => <circle cx={cx} cy={cy} r={r} fill="rgba(255,246,176,0.6)" stroke={GLOW} strokeWidth="5" />

function Card({ children, faded = false, done = false }: { children: ReactNode; faded?: boolean; done?: boolean }) {
  return (
    <svg viewBox="0 0 160 100" className={`mz-pic ${faded ? 'is-faded' : ''} ${done ? 'is-done' : ''}`} aria-hidden="true">
      <MazeDefs />
      {children}
    </svg>
  )
}

function DoorPic({ gift, target }: { gift: Gift; target: Vertical }) {
  return (
    <>
      <g transform="translate(30 52) scale(0.42)">
        <GiftArt id={gift} />
      </g>
      <Arrow x1={52} y1={52} x2={88} y2={target === 'up' ? 22 : 80} w={5} />
      <g transform="translate(122 98) scale(0.15)">
        <MagicDoor />
      </g>
      <Spot cx={122} cy={target === 'up' ? 18 : 80} r={14} />
    </>
  )
}

/** Картинка към указанието на стъпката (за двустъпковото — две картинки, текущата е отпред). */
export function StepPicture({ step, part }: { step: Step; part: number }) {
  switch (step.kind) {
    case 'fork': {
      const up = step.target === 'up'
      return (
        <Card>
          <g transform="translate(14 92) scale(0.3)">
            <Bunny mood="look" />
          </g>
          <path d="M40 54 H 70 C 92 54 96 22 150 20" fill="none" stroke={up ? '#f3d79e' : '#e8e2d6'} strokeWidth="14" strokeLinecap="round" opacity={up ? 1 : 0.55} />
          <path d="M40 54 H 70 C 92 54 96 86 150 86" fill="none" stroke={up ? '#e8e2d6' : '#f3d79e'} strokeWidth="14" strokeLinecap="round" opacity={up ? 0.55 : 1} />
          {up ? (
            <g transform="translate(140 16) scale(0.16)">
              <Sun r={44} />
            </g>
          ) : (
            <g transform="translate(140 90) scale(0.16)">
              <Pond />
            </g>
          )}
          <Arrow x1={92} y1={up ? 50 : 58} x2={122} y2={up ? 24 : 84} />
        </Card>
      )
    }
    case 'hide': {
      // само предметът, за който става дума: кошничката („в“) или гъбката („на“ / „под“)
      const inBasket = step.target === 'in'
      const sp = inBasket ? { x: 118, y: 58 } : step.target === 'on' ? { x: 118, y: 22 } : { x: 98, y: 84 }
      return (
        <Card>
          <g transform="translate(26 54) scale(0.55)">
            <TreasureArt id={step.item} />
          </g>
          {inBasket ? (
            <g transform="translate(118 96) scale(0.36)">
              <Basket />
            </g>
          ) : (
            <g transform="translate(118 98) scale(0.27)">
              <BigMushroom />
            </g>
          )}
          <Spot cx={sp.x} cy={sp.y} r={13} />
          <Arrow x1={50} y1={54} x2={sp.x - 15} y2={sp.y} w={5} />
        </Card>
      )
    }
    case 'chicks-in':
      return (
        <Card>
          <g transform="translate(24 84) scale(0.42)">
            <Chick />
          </g>
          <g transform="translate(112 66) scale(0.13)">
            <Fence rx={280} ry={150} part="ground" />
            <Fence rx={280} ry={150} part="back" />
            <Fence rx={280} ry={150} part="front" />
          </g>
          <Spot cx={112} cy={62} r={16} />
          <Arrow x1={46} y1={60} x2={96} y2={62} w={5} />
        </Card>
      )
    case 'chicks-out':
      return (
        <Card>
          <g transform="translate(92 66) scale(0.13)">
            <Fence rx={280} ry={150} part="ground" />
            <Fence rx={280} ry={150} part="back" />
          </g>
          <g transform="translate(80 66) scale(0.3)">
            <Chick />
          </g>
          <g transform="translate(104 66) scale(0.3)">
            <Chick />
          </g>
          <g transform="translate(92 66) scale(0.13)">
            <Fence rx={280} ry={150} part="front" />
          </g>
          <Spot cx={146} cy={70} r={16} />
          <g transform="translate(146 88) scale(0.36)">
            <Chick />
          </g>
        </Card>
      )
    case 'stone': {
      const near = step.target === 'near'
      return (
        <Card>
          <g transform="translate(18 88) scale(0.3)">
            <Bunny mood="look" />
          </g>
          <rect x="34" y="62" width="126" height="34" rx="10" fill="url(#mz-water)" />
          <g transform={`translate(${near ? 62 : 138} 84) scale(0.22)`}>
            <Stone />
          </g>
          {!near && (
            <g transform="translate(138 78) scale(0.32)">
              <Frog />
            </g>
          )}
          <Spot cx={near ? 62 : 138} cy={78} r={15} />
          <Arrow x1={32} y1={46} x2={near ? 56 : 128} y2={near ? 62 : 60} w={5} />
        </Card>
      )
    }
    case 'door':
      return (
        <span className="mz-pics">
          {step.seq.map((g, i) => (
            <Card key={i} faded={step.seq.length > 1 && i !== part} done={i < part}>
              <DoorPic gift={g.item} target={g.target} />
            </Card>
          ))}
        </span>
      )
  }
}

// ───────────── примери преди мисиите ─────────────

function Label({ x, y, children, color = '#ff7aa8' }: { x: number; y: number; children: string; color?: string }) {
  const w = children.length * 17 + 28
  return (
    <g className="mz-demo__label">
      <rect x={x - w / 2} y={y - 24} width={w} height="44" rx="22" fill={color} stroke={O} strokeWidth="4" />
      <text x={x} y={y + 8} textAnchor="middle" fontSize="28" fontWeight="900" fill="#fff" stroke={O} strokeWidth="5" paintOrder="stroke" fontFamily="var(--font-display)">
        {children}
      </text>
    </g>
  )
}

/** Илюстрация на примера за мисията (поле 600×320). Елементите се появяват един след друг. */
export function DemoArt({ mission }: { mission: MissionId }) {
  const step = (i: number) => ({ style: { animationDelay: `${0.3 + i * 0.9}s` } })
  return (
    <svg viewBox="0 0 600 320" className="mz-demo__art" aria-hidden="true">
      <MazeDefs />
      {mission === 'fork' && (
        <>
          <path d="M40 180 H 220 C 300 180 320 80 520 70" fill="none" stroke={O} strokeWidth="46" strokeLinecap="round" />
          <path d="M40 180 H 220 C 300 180 320 280 520 280" fill="none" stroke={O} strokeWidth="46" strokeLinecap="round" />
          <path d="M40 180 H 220 C 300 180 320 80 520 70" fill="none" stroke="url(#mz-path)" strokeWidth="38" strokeLinecap="round" />
          <path d="M40 180 H 220 C 300 180 320 280 520 280" fill="none" stroke="url(#mz-path)" strokeWidth="38" strokeLinecap="round" />
          <g transform="translate(70 200) scale(0.55)">
            <Bunny mood="look" />
          </g>
          <g className="mz-demo__in" {...step(0)}>
            <g transform="translate(550 50) scale(0.5)">
              <Sun r={44} />
            </g>
            <Arrow x1={300} y1={150} x2={420} y2={82} w={9} />
            <Label x={330} y={70}>горе</Label>
          </g>
          <g className="mz-demo__in" {...step(1)}>
            <g transform="translate(540 300) scale(0.42)">
              <Pond />
            </g>
            <Arrow x1={300} y1={210} x2={420} y2={268} w={9} color="#5fa8ff" />
            <Label x={330} y={300} color="#5fa8ff">
              долу
            </Label>
          </g>
        </>
      )}
      {mission === 'hide' && (
        <>
          <g transform="translate(250 300) scale(0.62)">
            <BigMushroom />
          </g>
          <g transform="translate(470 300) scale(0.6)">
            <Basket front={false} />
          </g>
          <g className="mz-demo__in" {...step(2)}>
            <g transform="translate(470 222) scale(0.7)">
              <Apple />
            </g>
          </g>
          <g transform="translate(470 300) scale(0.6)">
            <Basket back={false} />
          </g>
          <g className="mz-demo__in" {...step(0)}>
            <g transform="translate(250 102) scale(0.7)">
              <Apple />
            </g>
            <Label x={110} y={92}>на</Label>
            <Arrow x1={150} y1={92} x2={214} y2={100} w={6} />
          </g>
          <g className="mz-demo__in" {...step(1)}>
            <g transform="translate(196 270) scale(0.7)">
              <Apple />
            </g>
            <Label x={90} y={262} color="#5fa8ff">
              под
            </Label>
            <Arrow x1={126} y1={262} x2={168} y2={266} w={6} color="#5fa8ff" />
          </g>
          <g className="mz-demo__in" {...step(2)}>
            <Label x={380} y={150} color="#7ed957">
              в
            </Label>
            <Arrow x1={406} y1={160} x2={446} y2={200} w={6} color="#7ed957" />
          </g>
        </>
      )}
      {mission === 'chicks' && (
        <>
          <g transform="translate(300 190) scale(0.62)">
            <Fence rx={290} ry={140} part="ground" />
            <Fence rx={290} ry={140} part="back" />
          </g>
          <g className="mz-demo__in" {...step(1)}>
            <g transform="translate(300 210) scale(0.9)">
              <Chick happy />
            </g>
          </g>
          <g transform="translate(300 190) scale(0.62)">
            <Fence rx={290} ry={140} part="front" />
          </g>
          <g className="mz-demo__in" {...step(0)}>
            <g transform="translate(70 300) scale(0.9)">
              <Chick />
            </g>
            <Label x={70} y={170} color="#5fa8ff">
              вън
            </Label>
          </g>
          <g className="mz-demo__in" {...step(1)}>
            <Label x={300} y={60} color="#7ed957">
              вътре
            </Label>
          </g>
        </>
      )}
      {mission === 'stones' && (
        <>
          <rect x="120" y="150" width="466" height="140" rx="40" fill="url(#mz-water)" stroke={O} strokeWidth="4" />
          <g transform="translate(70 270) scale(0.8)">
            <Frog />
          </g>
          <g className="mz-demo__in" {...step(0)}>
            <g transform="translate(200 250) scale(0.75)">
              <LilyPad />
            </g>
            <Arrow x1={104} y1={200} x2={168} y2={226} w={7} />
            <Label x={170} y={120}>близо</Label>
          </g>
          <g className="mz-demo__in" {...step(1)}>
            <g transform="translate(530 250) scale(0.75)">
              <LilyPad />
            </g>
            <Arrow x1={110} y1={172} x2={490} y2={226} w={7} color="#5fa8ff" />
            <Label x={500} y={120} color="#5fa8ff">
              далече
            </Label>
          </g>
        </>
      )}
      {mission === 'door' && (
        <>
          <g transform="translate(300 310) scale(1.25)">
            <HillTree />
          </g>
          <g className="mz-demo__in" {...step(0)}>
            <g transform="translate(300 92) scale(0.55)">
              <Bird />
            </g>
            <Label x={440} y={76}>горе</Label>
            <Arrow x1={400} y1={84} x2={344} y2={92} w={6} />
          </g>
          <g className="mz-demo__in" {...step(1)}>
            <g transform="translate(220 300) scale(0.5)">
              <BigMushroom />
            </g>
            <Label x={90} y={250} color="#5fa8ff">
              долу
            </Label>
            <Arrow x1={130} y1={254} x2={176} y2={262} w={6} color="#5fa8ff" />
          </g>
          <g className="mz-demo__in" {...step(2)}>
            <g transform="translate(520 260) scale(0.55)">
              <Socket>
                <GiftArt id="star" />
              </Socket>
            </g>
          </g>
        </>
      )}
    </svg>
  )
}

function Apple() {
  return (
    <g>
      <path d="M0 -6 C -26 -26 -46 4 -30 26 C -20 40 -8 40 0 34 C 8 40 20 40 30 26 C 46 4 26 -26 0 -6 Z" fill="#ff6b6b" stroke={O} strokeWidth="4" />
      <path d="M0 -8 q 2 -14 10 -20" fill="none" stroke={O} strokeWidth="4" strokeLinecap="round" />
      <path d="M8 -22 q 14 -8 22 2 q -12 6 -22 -2 Z" fill="#7ed957" stroke={O} strokeWidth="3" />
      <path d="M-22 4 q 2 -10 10 -12" fill="none" stroke="#ffd1d1" strokeWidth="5" strokeLinecap="round" />
    </g>
  )
}

function LilyPad() {
  return (
    <g>
      <path d="M0 0 m -60 0 a 60 22 0 1 0 120 0 a 60 22 0 1 0 -120 0 Z M0 0 L 50 -12 L 56 6 Z" fill="#7ed957" stroke={O} strokeWidth="4" fillRule="evenodd" />
      <circle cx="-20" cy="-4" r="8" fill="#ffc2d8" stroke={O} strokeWidth="2.5" />
    </g>
  )
}

function Bird() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="34" ry="26" fill="#8fd3ff" stroke={O} strokeWidth="4" />
      <circle cx="26" cy="-20" r="16" fill="#8fd3ff" stroke={O} strokeWidth="4" />
      <circle cx="30" cy="-23" r="3.5" fill={O} />
      <path d="M40 -18 l 14 4 -14 5 z" fill="#ffd25e" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M-14 -4 q 16 -18 30 -2" fill="#5fa8ff" stroke={O} strokeWidth="3" />
    </g>
  )
}
