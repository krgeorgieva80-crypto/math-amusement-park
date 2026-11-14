/**
 * Каталог на художествените ресурси за „Големи и малки ботуши“ (папка public/kg/art/giant-boots/).
 * Имената са без разширение; в manifest.json всяко име сочи към своя файл (WebP или PNG с прозрачност).
 */
import { COLORS, type ColorId, type HeroId, type ItemKind } from './logic'

export const ART_GAME = 'giant-boots'

export type HeroState = 'idle' | 'hopeful' | 'happy' | 'blink' | 'boots'
export const HERO_STATES: HeroState[] = ['idle', 'hopeful', 'happy', 'blink', 'boots']
export const ITEM_KINDS: ItemKind[] = ['boot', 'winter-boot', 'hat', 'mitten']

export const heroSprite = (hero: HeroId, st: HeroState) => `${hero}-${st}`
export const itemSprite = (kind: ItemKind, color: ColorId) => `${kind}-${color}`

export interface ArtResource {
  name: string
  /** Размер на изходното изображение в пиксели (ширина×височина). */
  size: string
  transparent: boolean
  note: string
}

const KIND_NOTE: Record<ItemKind, string> = { boot: 'гумен ботуш', 'winter-boot': 'зимна ботушка с пух', hat: 'плетена шапка с помпон', mitten: 'ръкавица' }
const STATE_NOTE: Record<HeroState, string> = {
  idle: 'спокоен, лека усмивка',
  hopeful: 'очаква, гледа към рафта',
  happy: 'широка усмивка, вдигнати ръце',
  blink: 'като спокоен, със затворени очи',
  boots: 'щастлив, обут в своите ботуши (финал)',
}

export const BOOTS_ART: ArtResource[] = [
  { name: 'bg-wide', size: '3840×2160', transparent: false, note: 'вълшебна градина (хоризонтално); долната трета — спокойна поляна, горната 1/6 — небе' },
  { name: 'bg-tall', size: '2160×3840', transparent: false, note: 'същата градина вертикално' },
  ...HERO_STATES.map((st) => ({ name: heroSprite('giant', st), size: '1600×2000', transparent: true, note: `великан: ${STATE_NOTE[st]}` })),
  ...HERO_STATES.map((st) => ({ name: heroSprite('dwarf', st), size: '1000×1400', transparent: true, note: `джудже: ${STATE_NOTE[st]}` })),
  ...ITEM_KINDS.flatMap((k) => COLORS.map((c) => ({ name: itemSprite(k, c), size: '800×800', transparent: true, note: `${KIND_NOTE[k]}, ${c}; долният ръб на 92% от височината` }))),
  { name: 'shelf-two', size: '2400×1000', transparent: true, note: 'дървен рафт на два реда, без предмети' },
  { name: 'shelf-one', size: '2400×600', transparent: true, note: 'дървен рафт на един ред' },
  { name: 'mat-giant', size: '1400×500', transparent: true, note: 'голяма кръгла плетена постелка' },
  { name: 'mat-dwarf', size: '900×350', transparent: true, note: 'малка кръгла постелка' },
  { name: 'sparkle', size: '256×256', transparent: true, note: 'мека звездичка (ефект при успех)' },
  { name: 'heart', size: '256×256', transparent: true, note: 'сърчице (ефект при успех)' },
]

export const bootsArtNames = () => BOOTS_ART.map((r) => r.name)
