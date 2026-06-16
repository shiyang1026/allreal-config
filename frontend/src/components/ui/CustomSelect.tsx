import { useEffect, useRef, useState } from 'react'
import type { SelectOption } from '../../types/dashboard'

interface Props {
  value: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
  size?: 'sm' | 'md'
}

export default function CustomSelect({
  value,
  options,
  placeholder = '请选择',
  disabled = false,
  onChange,
  size = 'md',
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const selected = options.find((option) => option.value === value)
  const buttonSize = size === 'sm'
    ? 'h-7 px-2 text-xs rounded-md'
    : 'h-9 px-2.5 text-xs rounded-md'

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [open])

  const choose = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative min-w-0" style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
          if ((event.key === 'Enter' || event.key === ' ') && !open) {
            event.preventDefault()
            setOpen(true)
          }
        }}
        className={`w-full min-w-0 flex items-center justify-between gap-2 bg-slate-900 border border-slate-700 text-slate-300 outline-none transition-colors
          hover:border-slate-500 focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed ${buttonSize}`}
      >
        <span className={`truncate ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
          {selected?.label || placeholder}
        </span>
        <span className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      {open && !disabled && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-56 overflow-y-auto rounded-md border border-slate-600 bg-slate-900"
        >
          {options.map((option) => {
            const active = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => choose(option.value)}
                className={`w-full min-w-0 px-2.5 py-2 text-left text-xs transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="block truncate">{option.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
