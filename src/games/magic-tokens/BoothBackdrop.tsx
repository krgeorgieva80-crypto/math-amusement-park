import { useStage } from '../../core/Stage'
import { OUTLINE as O } from '../../components/art/Attractions'

/** Фонът на щанда: навес на райета, завеси, звездна стена и светлинки. */
export function BoothBackdrop() {
  const { width: w, height: h } = useStage()
  const scallops = Math.ceil(w / 80)
  const sw = w / scallops
  const lights = Math.ceil(w / 70)
  return (
    <svg className="scene" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <radialGradient id="booth-wall" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor="#6a3fc9" />
          <stop offset="0.6" stopColor="#4a2a9a" />
          <stop offset="1" stopColor="#2e1a66" />
        </radialGradient>
        <linearGradient id="curtain" x1="0" x2="1">
          <stop offset="0" stopColor="#c2185b" />
          <stop offset="0.3" stopColor="#ff5fa2" />
          <stop offset="0.55" stopColor="#d63384" />
          <stop offset="0.8" stopColor="#ff7bb5" />
          <stop offset="1" stopColor="#c2185b" />
        </linearGradient>
        <radialGradient id="spot" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6a8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff6a8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill="url(#booth-wall)" />
      <ellipse cx={w / 2} cy={h * 0.45} rx={w * 0.38} ry={h * 0.38} fill="url(#spot)" />
      {/* звезди по стената */}
      {Array.from({ length: 36 }, (_, i) => {
        const x = (i * 293) % w
        const y = 130 + ((i * 157) % (h * 0.55))
        const s = 4 + (i % 3) * 3
        return (
          <path
            key={i}
            className="twinkle"
            style={{ animationDelay: `${(i % 6) * 0.35}s` }}
            d={`M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`}
            fill={['#ffd23f', '#fff', '#2ed1c4', '#ff8cc0'][i % 4]}
            opacity="0.8"
          />
        )
      })}
      {/* завеси */}
      <path d={`M0 90 H90 Q70 ${h * 0.45} 120 ${h * 0.72} Q60 ${h * 0.74} 0 ${h * 0.7} Z`} fill="url(#curtain)" stroke={O} strokeWidth="3" />
      <path d={`M${w} 90 H${w - 90} Q${w - 70} ${h * 0.45} ${w - 120} ${h * 0.72} Q${w - 60} ${h * 0.74} ${w} ${h * 0.7} Z`} fill="url(#curtain)" stroke={O} strokeWidth="3" />
      <circle cx="112" cy={h * 0.7} r="12" fill="#ffd23f" stroke={O} strokeWidth="3" />
      <circle cx={w - 112} cy={h * 0.7} r="12" fill="#ffd23f" stroke={O} strokeWidth="3" />
      {/* навес */}
      <rect x="0" y="0" width={w} height="96" fill="#ff5fa2" />
      {Array.from({ length: scallops }, (_, i) => (
        <g key={i}>
          <rect x={i * sw} y="0" width={sw} height="96" fill={i % 2 ? '#ffd23f' : '#ff5fa2'} />
          <path d={`M${i * sw} 96 h${sw} v8 a${sw / 2} ${sw / 2.4} 0 0 1 ${-sw} 0 z`} fill={i % 2 ? '#ffd23f' : '#ff5fa2'} stroke={O} strokeWidth="3" />
        </g>
      ))}
      <line x1="0" y1="96" x2={w} y2="96" stroke={O} strokeWidth="3" />
      {/* светлинки */}
      <path d={`M0 128 ${Array.from({ length: lights }, (_, i) => `Q ${(i + 0.5) * (w / lights)} 150 ${(i + 1) * (w / lights)} 128`).join(' ')}`} fill="none" stroke={O} strokeWidth="2" opacity="0.7" />
      {Array.from({ length: lights }, (_, i) => (
        <circle key={i} className="bulb" style={{ animationDelay: `${(i % 4) * 0.2}s` }} cx={(i + 0.5) * (w / lights)} cy="140" r="6" fill={['#ffd23f', '#2ed1c4', '#ff8cc0', '#b6ff9e'][i % 4]} stroke={O} strokeWidth="1.5" />
      ))}
    </svg>
  )
}
