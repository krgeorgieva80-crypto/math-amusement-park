import { useEffect, useState } from 'react'
import { useApp } from '../../../core/AppContext'
import { Confetti } from '../../../components/ui/Effects'
import { GameButton } from '../../../components/ui/GameButton'
import { MagicKey } from './TopArt'

const O = '#3b2a5a'

/**
 * Златната порта на върха: трите ключа влизат в ключалките, крилата се отварят
 * и златната светлина води към финалния екран.
 */
export function GoldenGate({ keys, onDone }: { keys: number; onDone: () => void }) {
  const { play, settings } = useApp()
  const [step, setStep] = useState(0) // 0 ключове, 1–3 поставени, 4 отворена
  useEffect(() => {
    const ms = settings.animationsOn ? 520 : 80
    const ids = [1, 2, 3, 4].map((k) =>
      window.setTimeout(() => {
        setStep(k)
        play(k === 4 ? 'fanfare' : 'drop')
      }, ms * k),
    )
    return () => ids.forEach(window.clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const open = step >= 4
  return (
    <div className="success-overlay tt-gate-overlay">
      {open && <Confetti seed={keys + 11} />}
      <div className="tt-gate" aria-label={open ? 'Златната порта е отворена' : 'Отключване на златната порта'}>
        <svg viewBox="0 0 420 420" className={`tt-gate__art ${open ? 'is-open' : ''}`} aria-hidden="true">
          <defs>
            <linearGradient id="tg-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff3a0" />
              <stop offset="1" stopColor="#ffb400" />
            </linearGradient>
            <radialGradient id="tg-light">
              <stop offset="0" stopColor="#fffbe0" />
              <stop offset="1" stopColor="#ffd23f" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <path d="M40 410 V170 Q210 -10 380 170 V410 Z" fill="#9b5de5" stroke={O} strokeWidth="10" />
          <path d="M80 410 V190 Q210 50 340 190 V410 Z" fill="url(#tg-light)" className="tt-gate__light" />
          <g className="tt-gate__wing tt-gate__wing--l">
            <path d="M80 410 V190 Q145 120 210 112 V410 Z" fill="url(#tg-gold)" stroke={O} strokeWidth="8" />
            <path d="M110 230 H190 M110 290 H190 M110 350 H190" stroke="#c99400" strokeWidth="7" strokeLinecap="round" />
          </g>
          <g className="tt-gate__wing tt-gate__wing--r">
            <path d="M340 410 V190 Q275 120 210 112 V410 Z" fill="url(#tg-gold)" stroke={O} strokeWidth="8" />
            <path d="M230 230 H310 M230 290 H310 M230 350 H310" stroke="#c99400" strokeWidth="7" strokeLinecap="round" />
          </g>
          {/* трите ключалки */}
          {[0, 1, 2].map((k) => (
            <g key={k} transform={`translate(${150 + k * 60} 270)`} className={`tt-gate__lock ${k < step ? 'is-in' : ''}`}>
              <circle r="22" fill={k < step ? '#fff6a8' : '#5b3fb0'} stroke={O} strokeWidth="6" />
              <path d="M0 -6 V10" stroke={k < step ? '#ffb400' : '#2a1660'} strokeWidth="7" strokeLinecap="round" />
            </g>
          ))}
          <path d="M210 8 l12 26 28 4 -20 20 5 28 -25 -13 -25 13 5 -28 -20 -20 28 -4z" fill="#ffd23f" stroke={O} strokeWidth="6" className="tt-gate__star" />
        </svg>
        <div className="tt-gate__keys">
          {[0, 1, 2].map((k) => (
            <span key={k} className={`tt-gate__key ${k < step ? 'is-used' : ''}`}>
              <MagicKey size={96} got={k < keys} />
            </span>
          ))}
        </div>
        <div className="tt-gate__title">{open ? 'Портата е отворена!' : 'Трите ключа отключват портата…'}</div>
        {open && (
          <GameButton color="green" size="xl" icon="next" onClick={onDone} className="success-card__next">
            Виж съкровището
          </GameButton>
        )}
      </div>
    </div>
  )
}
