/**
 * Регистър на атракционите в парка.
 * За да се добави нова игра: създайте компонента ѝ в src/games/<id>/,
 * сменете `status` на 'ready' и я добавете в GAME_COMPONENTS в App.tsx.
 */
import type { ComponentType } from 'react'
import {
  BalloonArt,
  CastleArt,
  ClockTowerArt,
  CoasterArt,
  FerrisWheelArt,
  MagicTokensArt,
  NumberTowerArt,
  ShopArt,
  type ArtProps,
} from '../components/art/Attractions'

export type AttractionId =
  | 'number-tower'
  | 'magic-tokens'
  | 'multiplication-wheel'
  | 'task-train'
  | 'wonder-shop'
  | 'clock-tower'
  | 'shape-castle'
  | 'balloon-challenge'

export interface Attraction {
  id: AttractionId
  name: string
  /** Кратко описание за картата и екрана „За играта“. */
  tagline: string
  status: 'ready' | 'soon'
  Art: ComponentType<ArtProps>
  color: string
}

export const ATTRACTIONS: Attraction[] = [
  { id: 'number-tower', name: 'Кулата на числата', tagline: 'Сравняване и подреждане на числа', status: 'soon', Art: NumberTowerArt, color: '#ff5fa2' },
  { id: 'magic-tokens', name: 'Вълшебните жетони', tagline: 'Съставяне на числа с жетони', status: 'ready', Art: MagicTokensArt, color: '#9b5de5' },
  { id: 'multiplication-wheel', name: 'Колелото на умножението', tagline: 'Равни групи и умножение', status: 'ready', Art: FerrisWheelArt, color: '#2ed1c4' },
  { id: 'task-train', name: 'Влакчето на задачите', tagline: 'Текстови задачи', status: 'soon', Art: CoasterArt, color: '#ff9f43' },
  { id: 'wonder-shop', name: 'Магазинът за чудеса', tagline: 'Пари и пазаруване', status: 'soon', Art: ShopArt, color: '#ffd23f' },
  { id: 'clock-tower', name: 'Часовниковата кула', tagline: 'Часовник и време', status: 'soon', Art: ClockTowerArt, color: '#2ed1c4' },
  { id: 'shape-castle', name: 'Замъкът на фигурите', tagline: 'Геометрични фигури', status: 'soon', Art: CastleArt, color: '#6bd66b' },
  { id: 'balloon-challenge', name: 'Балоненото предизвикателство', tagline: 'Бързо смятане', status: 'soon', Art: BalloonArt, color: '#ff5fa2' },
]

export const GAME_IDS = {
  magicTokens: 'magic-tokens',
} as const
