import { useState } from 'react'
import { useApp } from '../../core/AppContext'
import { RoundButton } from './GameButton'
import { Icon } from './Icon'

/** Бутон за звука с изскачащ панел: ефекти, музика и сила на звука. */
export function SoundControl() {
  const { settings, updateSettings, play } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <div className="sound-control">
      <RoundButton
        icon={settings.soundOn ? 'sound' : 'mute'}
        label="Настройки за звука"
        color="purple"
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <>
          <div className="sound-control__backdrop" onClick={() => setOpen(false)} />
          <div className="sound-panel" role="dialog" aria-label="Настройки за звука">
            <div className="sound-panel__title">Звук</div>
            <Toggle
              label="Звукови ефекти"
              icon="sound"
              on={settings.soundOn}
              onChange={(v) => {
                updateSettings({ soundOn: v })
                if (v) window.setTimeout(() => play('pick'), 30)
              }}
            />
            <Toggle label="Музика" icon="music" on={settings.musicOn} disabled={!settings.soundOn} onChange={(v) => updateSettings({ musicOn: v })} />
            <label className="sound-panel__volume">
              <span>Сила</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.volume}
                disabled={!settings.soundOn}
                onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
                onPointerUp={() => play('pick')}
                aria-label="Сила на звука"
              />
            </label>
          </div>
        </>
      )}
    </div>
  )
}

export function Toggle({
  label,
  on,
  onChange,
  icon,
  disabled,
}: {
  label: string
  on: boolean
  onChange: (v: boolean) => void
  icon?: 'sound' | 'music' | 'help'
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      className={`toggle ${on ? 'is-on' : ''}`}
      onClick={() => onChange(!on)}
    >
      {icon && <Icon name={icon} size={30} className="toggle__icon" />}
      <span className="toggle__label">{label}</span>
      <span className="toggle__track">
        <span className="toggle__thumb" />
      </span>
      <span className="toggle__state">{on ? 'Вкл.' : 'Изкл.'}</span>
    </button>
  )
}
