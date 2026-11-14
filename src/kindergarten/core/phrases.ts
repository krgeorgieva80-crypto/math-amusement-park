/**
 * Всички гласови фрази на приказния парк (за списъка със записи и за учителския панел).
 */
import { KG_ATTRACTIONS } from '../curriculum/structure'
import { allFeedPhrases } from '../games/feed-bears/logic'
import { BOOTS_PHRASES } from '../games/giant-boots/logic'
import type { Phrase } from './voice'

export const GENERAL_PHRASES: Phrase[] = [
  { id: 'kg.groups', text: 'Коя група сме? Докосни картинката.' },
  { id: 'kg.map', text: 'Добре дошли в приказния парк! Избери атракция.' },
  ...KG_ATTRACTIONS.map((a) => ({ id: `kg.attr.${a.id}`, text: `${a.name}. ${a.intro}` })),
]

export function allPhrases(): Phrase[] {
  return [...GENERAL_PHRASES, ...allFeedPhrases(), ...BOOTS_PHRASES]
}
