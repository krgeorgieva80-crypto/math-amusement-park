/**
 * Графичните слоеве на „Големи и малки ботуши“: фон, герои (със смяна на състоянията), предмети, рафт, постелки, ефекти.
 * Всеки слой показва окончателното изображение, ако е налично, иначе сегашната векторна рисунка.
 */
import { useEffect, useState } from 'react'
import { Dwarf, Giant, HeroMat, ItemArt, type HeroMood } from '../../art/GiantsArt'
import { GladeScene } from '../../art/KgScenery'
import { Sprite, useArt } from '../../art/sprites/Sprite'
import { heroSprite, itemSprite, type HeroState } from './art'
import type { ColorId, HeroId, ItemKind } from './logic'

/** Декоративен фон: широк или вертикален кадър. */
export function BootsBackground({ w, h, portrait }: { w: number; h: number; portrait: boolean }) {
  const art = useArt()
  const name = portrait ? 'bg-tall' : 'bg-wide'
  const url = art.url(name) ?? art.url(portrait ? 'bg-wide' : 'bg-tall')
  if (!url) return <GladeScene w={w} h={h} horizon={h * (portrait ? 0.3 : 0.42)} />
  return <img src={url} alt="" aria-hidden="true" draggable={false} className="kg-scene kg-boots__bg" data-sprite={name} />
}

/** Ред на заместване на състоянията на героя: „обут“ → „щастлив“ → „спокоен“; „очаква“ и „мигане“ → „спокоен“. */
// eslint-disable-next-line react-refresh/only-export-components
export function heroFallbackChain(st: HeroState): HeroState[] {
  if (st === 'boots') return ['boots', 'happy', 'idle']
  if (st === 'happy') return ['happy', 'idle']
  if (st === 'idle') return ['idle']
  return [st, 'idle']
}

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Герой със състояния; меко мигане от време на време (само ако има изображение за мигане и движението не е намалено). */
export function HeroSprite({ hero, state, motion = true }: { hero: HeroId; state: Exclude<HeroState, 'blink'>; motion?: boolean }) {
  const art = useArt()
  const canBlink = motion && (state === 'idle' || state === 'hopeful') && art.has(heroSprite(hero, 'blink')) && !prefersReduced()
  const [blink, setBlink] = useState(false)
  useEffect(() => {
    if (!canBlink) return
    let t: ReturnType<typeof setTimeout>
    const loop = () => {
      t = setTimeout(
        () => {
          setBlink(true)
          t = setTimeout(() => (setBlink(false), loop()), 160)
        },
        3500 + Math.random() * 3000,
      )
    }
    loop()
    return () => clearTimeout(t)
  }, [canBlink])
  const shown: HeroState = blink && canBlink ? 'blink' : state
  // Ако състоянието още няма изображение, но героят има други рисувани пози — най-близката от тях,
  // за да не се сменя стилът на героя по време на игра (рисунка ↔ векторна графика).
  const name =
    heroFallbackChain(shown)
      .map((st) => heroSprite(hero, st))
      .find((n) => art.has(n)) ?? heroSprite(hero, shown)
  const mood: HeroMood = state === 'boots' ? 'happy' : (state as HeroMood)
  const fallback = hero === 'giant' ? <Giant mood={mood} size={300} /> : <Dwarf mood={mood} size={200} />
  return <Sprite name={name} fallback={fallback} className={`kg-hero-img kg-hero-img--${hero} is-${state}`} />
}

/** Предмет: едно и също изображение за голям и малък (мащабът се задава от CSS). */
export function ItemSprite({ kind, color }: { kind: ItemKind; color: ColorId }) {
  return <Sprite name={itemSprite(kind, color)} fallback={<ItemArt kind={kind} color={color} size={100} />} className="kg-item-img" />
}

export function MatSprite({ hero }: { hero: HeroId }) {
  return <Sprite name={hero === 'giant' ? 'mat-giant' : 'mat-dwarf'} fallback={<HeroMat hero={hero} className="kg-boots__mat-bg" />} className="kg-boots__mat-bg kg-boots__mat-img" />
}

/** Рафт за един ред с предмети. */
export function ShelfSprite({ rows }: { rows: number }) {
  return (
    <Sprite
      name={rows > 1 ? 'shelf-two' : 'shelf-one'}
      fallback={
        <svg className="kg-boots__bench-art" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
          <rect x="4" y="4" width="592" height="26" rx="12" fill="#c98a5a" stroke="#4a2f3a" strokeWidth="4" />
          <path d="M20 12 H 580" stroke="#e7b07c" strokeWidth="5" strokeLinecap="round" />
          <rect x="40" y="28" width="22" height="30" rx="5" fill="#a76b3d" stroke="#4a2f3a" strokeWidth="4" />
          <rect x="538" y="28" width="22" height="30" rx="5" fill="#a76b3d" stroke="#4a2f3a" strokeWidth="4" />
        </svg>
      }
      className="kg-boots__bench-art kg-boots__shelf-img"
    />
  )
}

const HEART = 'M20 34 C 8 24 2 18 2 11 C 2 5 7 2 11.5 2 C 15 2 18 4 20 7 C 22 4 25 2 28.5 2 C 33 2 38 5 38 11 C 38 18 32 24 20 34 Z'
const STAR = 'M20 2 l 5 11 12 1.5 -9 8 2.6 12 -10.6 -6 -10.6 6 2.6 -12 -9 -8 12 -1.5 z'

/** Нежни звездички и сърчица при успех (без мигане). */
export function SuccessBurst() {
  const art = useArt()
  return (
    <div className="kg-hearts" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => {
        const star = i % 2 === 1
        const style = { left: `${8 + i * 11}%`, animationDelay: `${i * 0.1}s` }
        const url = art.url(star ? 'sparkle' : 'heart')
        return url ? (
          <img key={i} src={url} alt="" className="kg-heart kg-heart--float" style={style} draggable={false} />
        ) : (
          <svg key={i} viewBox="0 0 40 36" className="kg-heart kg-heart--float" style={style}>
            <path d={star ? STAR : HEART} fill={star ? '#ffe27a' : ['#ff7a9a', '#ffb3c7'][i % 2]} stroke="#4a2f2a" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        )
      })}
    </div>
  )
}
