/**
 * Възрастови групи, образователни ядра и атракции на приказния парк.
 */
import type { AgeGroupId, CoreId, KgAttractionId } from './types'

export interface AgeGroup {
  id: AgeGroupId
  name: string
  ages: string
  /** Кратко наименование за горната лента. */
  short: string
  color: string
}

export const AGE_GROUPS: AgeGroup[] = [
  { id: 1, name: 'Първа група', ages: '3–4 години', short: '1. група', color: '#ffb3c7' },
  { id: 2, name: 'Втора група', ages: '4–5 години', short: '2. група', color: '#ffd59a' },
  { id: 3, name: 'Трета група', ages: '5–6 години', short: '3. група', color: '#a8e6cf' },
  { id: 4, name: 'Четвърта група', ages: '6–7 години', short: '4. група', color: '#b8c8ff' },
]

export const groupById = (id: AgeGroupId) => AGE_GROUPS.find((g) => g.id === id)!

export interface Core {
  id: CoreId
  /** Наименование на образователното ядро (както в стандарта). */
  name: string
}

/** Петте образователни ядра в направление „Математика“. */
export const CORES: Core[] = [
  { id: 'quantity', name: 'Количествени отношения' },
  { id: 'measurement', name: 'Измерване' },
  { id: 'space', name: 'Пространствени отношения' },
  { id: 'time', name: 'Времеви отношения' },
  { id: 'shapes', name: 'Геометрични фигури и форми' },
]

export const coreById = (id: CoreId) => CORES.find((c) => c.id === id)!

export interface KgAttraction {
  id: KgAttractionId
  name: string
  core: CoreId
  /** Кратко представяне на атракцията за децата. */
  intro: string
  color: string
}

export const KG_ATTRACTIONS: KgAttraction[] = [
  { id: 'carousel', name: 'Вълшебната въртележка', core: 'quantity', intro: 'Тук броим, сравняваме и даваме на всеки по равно.', color: '#ff9ec4' },
  { id: 'giants-tower', name: 'Кулата на великаните', core: 'measurement', intro: 'Тук сравняваме кое е голямо и кое е малко, кое е високо и кое е ниско.', color: '#b9a3ff' },
  { id: 'labyrinth', name: 'Приказният лабиринт', core: 'space', intro: 'Тук търсим къде е скрито: горе, долу, вляво, вдясно.', color: '#8fd9a8' },
  { id: 'wonder-clock', name: 'Часовникът на чудесата', core: 'time', intro: 'Тук разказваме какво е било преди и какво става после.', color: '#ffd27a' },
  { id: 'shape-town', name: 'Градът на фигурите', core: 'shapes', intro: 'Тук откриваме кръгове, квадрати и триъгълници навсякъде около нас.', color: '#8fd3ff' },
]

export const attractionById = (id: KgAttractionId) => KG_ATTRACTIONS.find((a) => a.id === id)!
export const attractionOfCore = (core: CoreId) => KG_ATTRACTIONS.find((a) => a.core === core)!
