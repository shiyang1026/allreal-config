import type { Message } from '../../types/dashboard'

interface Props {
  message: Message | null
}

export default function Toast({ message }: Props) {
  if (!message) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm"
      style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}
    >
      <div className={`rounded-md border px-3 py-2 text-sm shadow-sm ${
        message.type === 'success'
          ? 'border-green-800 bg-green-950 text-green-200'
          : 'border-red-800 bg-red-950 text-red-200'
      }`}>
        {message.text}
      </div>
    </div>
  )
}
