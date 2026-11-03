import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useApp } from '../../core/AppContext'
import { Icon, type IconName } from './Icon'

export type ButtonColor = 'yellow' | 'pink' | 'turquoise' | 'purple' | 'green' | 'orange'

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: IconName
  children?: ReactNode
  /** Без звук при натискане (когато екранът пуска свой звук). */
  silent?: boolean
}

/** Обемен „бонбонен“ бутон с меки сенки и пружинираща анимация. */
export function GameButton({ color = 'yellow', size = 'md', icon, children, className = '', silent, onClick, ...rest }: GameButtonProps) {
  const { play } = useApp()
  return (
    <button
      type="button"
      className={`game-btn game-btn--${color} game-btn--${size} ${children ? '' : 'game-btn--icon-only'} ${className}`}
      onClick={(e) => {
        if (!silent) play('click')
        onClick?.(e)
      }}
      {...rest}
    >
      <span className="game-btn__face">
        {icon && <Icon name={icon} size={size === 'xl' ? 56 : size === 'lg' ? 44 : size === 'sm' ? 28 : 36} />}
        {children && <span className="game-btn__label">{children}</span>}
      </span>
    </button>
  )
}

/** Кръгъл бутон с икона (за горната лента). */
export function RoundButton({ icon, label, color = 'turquoise', onClick, active }: { icon: IconName; label: string; color?: ButtonColor; onClick: () => void; active?: boolean }) {
  return (
    <GameButton
      color={color}
      size="md"
      icon={icon}
      className={`round-btn ${active === false ? 'is-off' : ''}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    />
  )
}
